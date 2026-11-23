// TickerSec — Breaking News feeds: desktop news tickers.
// Main process: settings, feed polling, translation, tray, and windows.

const { app, BrowserWindow, Tray, Menu, ipcMain, screen, shell, nativeImage, globalShortcut, Notification, session } = require('electron');
const path = require('path');
const { Store } = require('./src/store');
const PRESETS = require('./src/presets');
const { fetchFeed, setBrowserFetcher } = require('./src/feeds');
const { translateItems } = require('./src/translate');
const { classify, inQuietHours, keywordMatchers } = require('./src/alerts');
const layout = require('./src/layout');
const updater = require('./src/updater');
const STARTER = require('./src/starter');
// Update links are built into the app (src/update-config.json) and never shown.
const BAKED = (() => { try { return require('./src/update-config.json'); } catch { return {}; } })();
// latest.json can move the update folder ("move": { "manifest": "…", "installer": "…" });
// the new links are saved and used from then on, with the built-in links as backup.
const updLinks = () => {
  const mv = (store && store.get().updateMove) || {};
  return {
    manifest: [mv.manifest, BAKED.manifestUrl, ...(BAKED.manifestBackups || [])].filter(Boolean),
    installer: mv.installer || BAKED.installerUrl || ''
  };
};

// Let the ticker play the alert chime without a click first.
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// Dev/testing hook: keep a separate settings folder.
if (process.env.BN_USER_DATA) app.setPath('userData', process.env.BN_USER_DATA);

// Renamed from "Breaking News" to "TickerSec" (2.0.0). Windows keeps settings under the
// app's name, so bring an existing setup across on the first TickerSec start.
let migratedFromBreakingNews = false;
(function migrateFromBreakingNews() {
  if (process.env.BN_USER_DATA) return;
  try {
    const fsm = require('fs');
    const newDir = app.getPath('userData');
    const oldDir = path.join(app.getPath('appData'), 'Breaking News');
    if (fsm.existsSync(path.join(newDir, 'settings.json')) || !fsm.existsSync(oldDir)) return;
    fsm.mkdirSync(newDir, { recursive: true });
    for (const f of ['settings.json', 'alerts-seen.json', 'running.json']) {
      const from = path.join(oldDir, f);
      if (fsm.existsSync(from)) fsm.copyFileSync(from, path.join(newDir, f));
    }
    migratedFromBreakingNews = true;
    fsm.rmSync(oldDir, { recursive: true, force: true });   // old app is gone; don't leave its folder behind
  } catch {}
})();

// Only one copy runs at a time. We pass our version along so an older copy
// that is already running can step aside for a newer one (e.g. after an update).
const VERSION = app.getVersion();
const fs = require('fs');
const { execFileSync, execFile } = require('child_process');
const fsx = require('fs');
const RUNNING_FILE = () => path.join(app.getPath('userData'), 'running.json');

let gotLock = app.requestSingleInstanceLock({ version: VERSION, execPath: process.execPath });
if (!gotLock) {
  // Another copy is running. Copies from 1.0.4 on record their version in
  // running.json and step aside for a newer one by themselves. Copies older
  // than 1.0.4 (or a stray portable .exe) don't, so close them ourselves.
  let running = null;
  try { running = JSON.parse(fs.readFileSync(RUNNING_FILE(), 'utf8')); } catch {}
  const olderOrUnknown = !running || !running.version || isNewer(VERSION, running.version);
  if (olderOrUnknown && process.platform === 'win32' && !process.argv.includes('--after-takeover')) {
    setTimeout(() => {
      if (!app.requestSingleInstanceLock()) killOtherCopies();
      app.relaunch({ args: [...process.argv.slice(1).filter(a => a !== '--after-takeover'), '--after-takeover'] });
      app.exit(0);
    }, 2500);
  } else {
    app.quit();
  }
}

// Ends every other TickerSec (or older Breaking News) process tree, never our own.
function killOtherCopies() {
  try {
    const ps = `Get-CimInstance Win32_Process -Filter "(Name like 'TickerSec%' or Name like 'Breaking News%') and not Name like '%Setup%'" | ` +
      `ForEach-Object { "$($_.ProcessId),$($_.ParentProcessId)" }`;
    const rows = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { encoding: 'utf8', windowsHide: true })
      .trim().split(/\r?\n/).filter(Boolean).map(l => l.split(',').map(Number));
    const ids = new Set(rows.map(r => r[0]));
    const me = process.pid;
    // Top-level copies: not us, not our children, and not a child of another copy.
    const roots = rows.filter(([pid, ppid]) => pid !== me && ppid !== me && !ids.has(ppid)).map(r => r[0]);
    for (const pid of roots) {
      try { execFileSync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], { windowsHide: true }); } catch {}
    }
  } catch {}
}

function isNewer(a, b) {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true;
    if ((pa[i] || 0) < (pb[i] || 0)) return false;
  }
  return false;
}

let store, tray, tickerWin, settingsWin, welcomeWin;
let welcoming = false;   // first run: tickers wait until services are picked
let refreshTimer = null;
let paused = false;
let hidden = false;
let lastPayload = null;
const status = {};        // id -> { ok, error, count, updated }

const ICON = path.join(__dirname, 'build', 'icon.png');
const ICON_OFF = path.join(__dirname, 'build', 'icon-off.png');
const isActive = () => store.get().active !== false;

// ── Agencies ────────────────────────────────────────────────────
function allAgencies() {
  const s = store.get();
  return [...PRESETS, ...s.custom.map(c => ({ region: 'Custom', ...c }))];
}

function enabledAgencies() {
  const s = store.get();
  const map = new Map(allAgencies().map(a => [a.id, a]));
  return s.enabled
    .map(id => map.get(id))
    .filter(Boolean)
    .map(a => ({ ...a, ...(s.overrides[a.id] || {}) }));
}

// ── Ticker window ───────────────────────────────────────────────
function tickerBounds() {
  const s = store.get();
  const d = s.display;
  const displays = screen.getAllDisplays();
  const disp = displays[d.monitor] || screen.getPrimaryDisplay();
  const wa = disp.workArea;
  const rows = layout.layoutRows(enabledAgencies(), d.collapsed || {});
  const full = layout.rowsHeight(rows, d);
  if (d.position === 'window') {
    const b = d.windowBounds;
    const onScreen = b && displays.some(x => b.x < x.bounds.x + x.bounds.width - 40 && b.x + b.width > x.bounds.x + 40 && b.y >= x.bounds.y - 10 && b.y < x.bounds.y + x.bounds.height - 40);
    if (onScreen) return b;
    const w = Math.min(1100, wa.width - 80), h = Math.min(full + 40, Math.round(wa.height * 0.6));
    return { x: wa.x + Math.round((wa.width - w) / 2), y: wa.y + Math.round((wa.height - h) / 2), width: w, height: Math.max(120, h) };
  }
  // Docked: never taller than the set share of the screen — the rest scrolls.
  const cap = Math.max(d.barHeight, Math.round(wa.height * (d.maxHeightPct || 50) / 100));
  const height = Math.min(full, cap);
  const y = d.position === 'top' ? wa.y : wa.y + wa.height - height;
  return { x: wa.x, y, width: wa.width, height };
}
const isWindowMode = () => store.get().display.position === 'window';

let tickerMode = null;   // 'docked' | 'window' — the kind of window tickerWin is
function createTicker() {
  const win = isWindowMode();
  tickerMode = win ? 'window' : 'docked';
  const common = { ...tickerBounds(), show: false, alwaysOnTop: store.get().display.alwaysOnTop !== false,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), backgroundThrottling: false } };
  tickerWin = new BrowserWindow(win ? {
    // A normal window: move it, resize it, minimize it.
    ...common, title: 'TickerSec', frame: true, transparent: false, resizable: true, movable: true,
    minimizable: true, maximizable: true, skipTaskbar: false, focusable: true, minWidth: 360, minHeight: 80,
    backgroundColor: '#0b1020', autoHideMenuBar: true
  } : {
    ...common, frame: false, transparent: true, resizable: false, movable: false, minimizable: false,
    maximizable: false, fullscreenable: false, skipTaskbar: true, hasShadow: false,
    // ROOT CAUSE of "headlines won't open" (proven live on an affected PC, 2026-11-21):
    // a docked ticker made with focusable:false answers Windows' WM_MOUSEACTIVATE
    // with MA_NOACTIVATEANDEAT ("don't activate, and THROW THE CLICK AWAY"), so the
    // mouse press never reaches the page (only the release does). A click posted
    // straight to the window opened the headline fine. The tickers are therefore
    // activatable; 'toolbar' keeps them out of Alt+Tab and the taskbar, and they are
    // still shown with showInactive so they never take focus by themselves.
    focusable: true, type: 'toolbar',
    backgroundColor: '#00000000'
  });
  if (win) {
    tickerWin.setMenu(null);
    let t;
    const remember = () => { clearTimeout(t); t = setTimeout(() => {
      if (!tickerWin || tickerWin.isMinimized() || tickerWin.isMaximized()) return;
      const s = store.get(); store.save({ ...s, display: { ...s.display, windowBounds: tickerWin.getBounds() } });
    }, 500); };
    tickerWin.on('resize', remember);
    tickerWin.on('move', remember);
    // The window's X hides the tickers (like Ctrl+Alt+N); Quit is in the tray.
    tickerWin.on('close', e => { if (!app.isQuitting) { e.preventDefault(); if (!hidden) toggleHidden(); } });
    tickerWin.on('page-title-updated', e => e.preventDefault());
  } else {
    tickerWin.setVisibleOnAllWorkspaces(true);
  }
  if (store.get().display.alwaysOnTop !== false) tickerWin.setAlwaysOnTop(true, win ? 'floating' : 'screen-saver');
  tickerWin.loadFile(path.join(__dirname, 'renderer', 'ticker.html'), warmStart ? { query: { warm: '1' } } : {});
  warmStart = false;
  watchPresses(tickerWin);
  tickerWin.once('ready-to-show', () => {
    applyTickerSettings();
    if (!hidden && !welcoming && isActive() && enabledAgencies().length) tickerWin.showInactive();
  });
  const me = tickerWin;
  tickerWin.on('closed', () => { if (tickerWin === me) tickerWin = null; });
}

// Everything the ticker draws goes through here (adds category grouping).
function sendToTicker(payload) {
  if (!tickerWin || !payload) return;
  tickerWin.webContents.send('ticker:news', layout.toView(payload, enabledAgencies(), store.get().display.collapsed || {}));
}

function toggleCategory(cat) {
  if (layout.isConsolidated(cat)) return;   // always one ticker
  const s = store.get();
  const collapsed = { ...(s.display.collapsed || {}) };
  collapsed[cat] = !layout.isCollapsed(cat, collapsed);
  store.save({ ...s, display: { ...s.display, collapsed } });
  applyTickerSettings();
  updateTray();
}

function applyTickerSettings() {
  if (!tickerWin) return;
  const s = store.get();
  // Switching between docked and window needs a different kind of window.
  if (tickerMode !== (isWindowMode() ? 'window' : 'docked')) {
    const old = tickerWin; tickerWin = null;
    old.removeAllListeners('close'); old.destroy();
    createTicker();
    return;
  }
  if (tickerMode === 'docked') tickerWin.setBounds(tickerBounds());
  tickerWin.setIgnoreMouseEvents(tickerMode === 'docked' && !!s.display.clickThrough, { forward: true });
  // On top of everything, or a normal window that files and programs can cover.
  if (s.display.alwaysOnTop !== false) tickerWin.setAlwaysOnTop(true, tickerMode === 'window' ? 'floating' : 'screen-saver');
  else if (tickerWin.isAlwaysOnTop()) tickerWin.setAlwaysOnTop(false);
  tickerWin.webContents.send('ticker:config', { display: s.display, paused, translation: s.translation, alerts: s.alerts });
  if (!enabledAgencies().length || hidden || welcoming || !isActive()) tickerWin.hide();
  else if (!tickerWin.isVisible()) tickerMode === 'window' ? tickerWin.show() : tickerWin.showInactive();
  if (lastPayload) sendToTicker(lastPayload);
}

// ── Settings window ─────────────────────────────────────────────
function openSettings() {
  if (settingsWin) { settingsWin.show(); settingsWin.focus(); return; }
  settingsWin = new BrowserWindow({
    width: 1060,
    height: 780,
    minWidth: 820,
    minHeight: 560,
    title: 'TickerSec — Settings',
    icon: ICON,
    backgroundColor: '#0b1020',
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });
  settingsWin.loadFile(path.join(__dirname, 'renderer', 'settings.html'));
  settingsWin.on('closed', () => { settingsWin = null; });
}

// ── First run: pick up to 4 services ────────────────────────────
function openWelcome() {
  welcoming = true;
  welcomeWin = new BrowserWindow({
    width: 1080, height: 780, minWidth: 900, minHeight: 680,
    title: 'Welcome to TickerSec', icon: ICON, backgroundColor: '#0b1020', autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });
  welcomeWin.loadFile(path.join(__dirname, 'renderer', 'welcome.html'));
  // Closing the window without choosing = keep the suggested services.
  welcomeWin.on('closed', () => { welcomeWin = null; if (welcoming) finishWelcome(null); });
}

// Apply the categories picked on the welcome screen (up to 4).
// Closing the window without finishing = U.S. News + World News at the bottom.
function finishWelcome(choice) {
  welcoming = false;
  const s = store.get();
  const ids = (choice && Array.isArray(choice.categories) ? choice.categories : ['us', 'world']).slice(0, 4);
  const cats = ids.map(id => STARTER.find(c => c.id === id)).filter(Boolean);
  const enabled = [...new Set(cats.flatMap(c => c.sources))].filter(id => PRESETS.some(p => p.id === id));
  // Chosen categories start expanded: a title strip with one bar per source.
  const collapsed = { ...(s.display.collapsed || {}) };
  cats.forEach(c => { if (c.category) delete collapsed[c.category]; });   // each category's default (Breaking Across the U.S. = one bar)
  const position = choice && choice.position === 'top' ? 'top' : 'bottom';
  store.save({
    ...s,
    enabled: enabled.length ? enabled : s.enabled,
    display: { ...s.display, position, collapsed }
  });   // writes settings.json, so the welcome never shows again
  applyTickerSettings();
  updateTray();
  refresh();
  if (welcomeWin && !welcomeWin.isDestroyed()) welcomeWin.close();
}

ipcMain.handle('welcome:data', () => ({
  categories: STARTER,
  names: Object.fromEntries(PRESETS.map(p => [p.id, p.name]))
}));

ipcMain.on('welcome:done', (_e, ids) => finishWelcome(ids));

// ── Fetching ────────────────────────────────────────────────────
function fullLink(link, base, title) {
  let l = String(link || '').trim();
  if (/^https?:\/\//i.test(l)) return l;
  if (/^www\./i.test(l)) return 'https://' + l;
  if (l && !/^(javascript|data|file|mailto):/i.test(l)) {
    try { const u = new URL(l, base); if (/^https?:$/.test(u.protocol)) return u.href; } catch {}
  }
  return `https://www.google.com/search?q=${encodeURIComponent(title || '')}`;
}

// Some sources have more than one address: try each until one works, and
// remember the one that worked for next time.
const workingUrl = new Map();
async function fetchWithFallbacks(agency) {
  const urls = [...new Set([workingUrl.get(agency.id), agency.url, ...(agency.alt || [])].filter(Boolean))];
  // Last resort for any site's own feed: Google News headlines from that site
  // (covers feeds that move, break or are blocked on some networks).
  let backup = null;
  if (!agency.noBackup && !/news\.google\./i.test(agency.url)) {
    try {
      const host = new URL(agency.url).hostname.replace(/^(www|feeds?|rss)\./i, '');
      if (!/feedburner|blogspot|googleblog/i.test(host)) urls.push(backup = `https://news.google.com/rss/search?q=${encodeURIComponent(`site:${host} when:2d`)}&hl=en-US&gl=US&ceid=US:en`);
    } catch {}
  }
  let lastErr;
  for (const u of urls) {
    try {
      const f = await fetchFeed(u);
      if (u === backup && !f.items.length) throw lastErr || new Error('no headlines');   // backup found nothing: report the real problem
      if (u !== backup) workingUrl.set(agency.id, u);   // keep retrying the real feed
      f.sourceUrl = u; f.viaBackup = u === backup; return f;
    }
    catch (err) { lastErr = err; }
  }
  throw lastErr;
}

async function loadAgency(agency, s) {
  const feed = await fetchWithFallbacks(agency);
  // Every headline must open something: complete partial addresses
  // ("/news/123", "//site.com/x", "www.site.com/x") against the feed's site,
  // and give headlines without one a search for the headline itself.
  const base = feed.sourceUrl || agency.url;
  feed.items = feed.items.map(i => ({ ...i, link: fullLink(i.link, base, i.title) }));
  // Some sources drop notices that aren't news (e.g. scheduled maintenance).
  if (Array.isArray(agency.exclude) && agency.exclude.length) {
    const ex = keywordMatchers(agency.exclude);
    feed.items = feed.items.filter(i => !ex.some(k => k.re.test(i.title)));
  }
  // Google News titles end with the real outlet ("… - KHOU"): show that as the source.
  if (/news\.google\./i.test(feed.sourceUrl || agency.url)) {
    feed.items = feed.items.map(i => {
      const m = /^(.*\S)\s+-\s+([^-]{2,60})$/.exec(i.title);
      return m ? { ...i, title: m[1], publisher: m[2].trim() } : i;
    });
  }
  // Sources with a filter (local TV in Breaking Across the U.S.) only pass matching headlines.
  if (Array.isArray(agency.filter) && agency.filter.length) {
    const m = keywordMatchers(agency.filter);
    feed.items = feed.items.filter(i => m.some(k => k.re.test(i.title)));
    if (!feed.items.length) return { items: [], translated: false, from: agency.lang };
  }
  const maxAge = s.updates.maxAgeHours > 0 ? s.updates.maxAgeHours * 3600e3 : Infinity;
  const now = Date.now();
  let items = feed.items
    .filter(i => !i.date || now - i.date <= maxAge)
    .slice(0, s.updates.maxPerAgency);
  // Sources that post rarely (e.g. Krebs on Security) would end up empty with
  // the age limit — show their newest few headlines instead of a blank bar.
  if (!items.length && feed.items.length) items = feed.items.slice(0, Math.min(5, s.updates.maxPerAgency));

  const tr = s.translation;
  const from = agency.lang && agency.lang !== 'auto' ? agency.lang : (feed.language || 'auto');
  let translated = false;
  if (tr.enabled && from !== tr.target.slice(0, 2)) {
    const r = await translateItems(items, from, tr);
    items = r.items;
    translated = r.failures < items.length;
  }
  return { items, translated, from, viaBackup: !!feed.viaBackup };
}

let generation = 0;
let rawBars = null;          // headlines as fetched, before alert marking

// ── Alerts ──────────────────────────────────────────────────────
let seenAlerts = null;       // headlines we've already alerted on (link or title)
let refreshCount = 0;
const SEEN_FILE = () => path.join(app.getPath('userData'), 'alerts-seen.json');

function loadSeen() {
  if (seenAlerts) return;
  try { seenAlerts = new Set(JSON.parse(fs.readFileSync(SEEN_FILE(), 'utf8'))); } catch { seenAlerts = new Set(); }
}
function saveSeen() {
  try { fs.writeFileSync(SEEN_FILE(), JSON.stringify([...seenAlerts].slice(-3000))); } catch {}
}

// Mark keyword/breaking headlines; flag the ones that are new since last time.
function decorate(bars, fromFetch) {
  loadSeen();
  const a = store.get().alerts;
  const now = Date.now();
  const fresh = [];
  if (fromFetch) refreshCount++;
  const out = bars.map(b => {
    const items = classify(b.items || [], a).map(it => {
      if (!it.alert) return it;
      const key = it.link || it.title;
      // Only recent headlines count as new (no flood of old ones on start-up).
      const recent = it.date ? now - it.date < 2 * 3600e3 : refreshCount > 1;
      if (!seenAlerts.has(key)) {
        seenAlerts.add(key);
        if (recent) { fresh.push({ bar: b, item: it }); return { ...it, flash: true }; }
      }
      return it;
    });
    return { ...b, items };
  });
  if (fresh.length) { saveSeen(); announce(fresh, a); }
  return out;
}

function announce(fresh, a) {
  if (!isActive()) return;
  const notifyList = fresh.filter(f =>
    (f.item.alert.breaking && a.notifyBreaking) || (f.item.alert.keywords.length && a.notifyKeywords));
  if (notifyList.length) {
    const style = a.notifyStyle || 'popup';
    const alerts = notifyList.map(({ bar, item }) => ({
      agency: bar.name, color: bar.color, breaking: item.alert.breaking,
      why: item.alert.breaking ? 'BREAKING' : `Keyword: ${item.alert.keywords.join(', ')}`,
      title: item.title, link: item.link
    }));
    if (style === 'popup' || style === 'both') {
      if (alerts.length <= 4) alerts.forEach(showPopup);
      else showPopup({ agency: 'TickerSec', color: '#5b8cff', breaking: alerts.some(x => x.breaking),
        why: `${alerts.length} alerts`, title: alerts.slice(0, 2).map(x => x.title).join('  •  '),
        foot: 'Click to show the tickers', showTickers: true });
    }
    if (style === 'windows' || style === 'both') {
      if (alerts.length <= 3) alerts.forEach(x => windowsNotify(`${x.agency} — ${x.why}`, x.title, x.link));
      else windowsNotify(`TickerSec — ${alerts.length} alert headlines`, alerts.slice(0, 4).map(x => `• ${x.title}`).join('\n'));
    }
  }
  if (a.chime && !inQuietHours(a) && tickerWin) {
    tickerWin.webContents.send('ticker:chime', { volume: a.chimeVolume, sound: a.chimeSound, breaking: fresh.some(f => f.item.alert.breaking) });
  }
}

// ── Windows notifications ───────────────────────────────────────
// Kept referenced until closed so Windows doesn't lose them (and their click).
const liveNotes = new Set();
// ── Windows helpers (reg.exe only — no PowerShell) ──────────────
function reg(args) {
  return new Promise(resolve => {
    if (process.platform !== 'win32') return resolve('');
    execFile('reg.exe', args, { windowsHide: true, encoding: 'utf8' }, (err, out) => resolve(err ? '' : out || ''));
  });
}
const regDword = (out, name) => { const m = new RegExp(name + '\\s+REG_DWORD\\s+0x([0-9a-f]+)', 'i').exec(out); return m ? parseInt(m[1], 16) : null; };

// Why Windows would hide our notifications, in plain words (null = nothing found).
async function toastsBlocked() {
  if (process.platform !== 'win32') return null;
  const all = await reg(['query', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\PushNotifications', '/v', 'ToastEnabled']);
  if (regDword(all, 'ToastEnabled') === 0) return 'Windows notifications are switched off on this PC (Settings → System → Notifications → Notifications).';
  const pol = await reg(['query', 'HKCU\\Software\\Policies\\Microsoft\\Windows\\CurrentVersion\\PushNotifications', '/v', 'NoToastApplicationNotification']);
  if (regDword(pol, 'NoToastApplicationNotification') === 1) return 'Your organization has turned off Windows notifications on this PC.';
  const app_ = await reg(['query', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings\\com.jayappell.tickersec', '/v', 'Enabled']);
  if (regDword(app_, 'Enabled') === 0) return 'Notifications from TickerSec are switched off in Settings → System → Notifications.';
  return null;
}

// Windows 11 tucks new tray icons into the ^ overflow. Show TickerSec's icon on
// the taskbar once (if the user hides it again later, we leave it hidden), and
// tidy away tray entries left by old TickerSec / Breaking News installs.
async function showTrayIconOnTaskbar() {
  if (process.platform !== 'win32') return;
  const root = 'HKCU\\Control Panel\\NotifyIconSettings';
  const out = await reg(['query', root, '/s', '/f', '.exe', '/d']);
  const me = process.execPath.toLowerCase();
  let key = null;
  for (const line of out.split(/\r?\n/)) {
    if (/^HKEY_/i.test(line)) { key = line.trim(); continue; }
    const m = /ExecutablePath\s+REG_SZ\s+(.+)$/i.exec(line);
    if (!m || !key) continue;
    const p = m[1].trim();
    if (!/\\(TickerSec|Breaking News)\.exe$/i.test(p)) continue;
    if (p.toLowerCase() === me) {
      const s = store.get();
      if (s.trayShownFor === me) continue;                  // done before — respect the user's choice
      const cur = await reg(['query', key, '/v', 'IsPromoted']);
      if (regDword(cur, 'IsPromoted') === null) await reg(['add', key, '/v', 'IsPromoted', '/t', 'REG_DWORD', '/d', '1', '/f']);
      store.save({ ...store.get(), trayShownFor: me });
    } else if (!fsx.existsSync(p)) {
      await reg(['delete', key, '/f']);                     // an old install that no longer exists
    }
  }
}

// Notification icons can't be read from inside the app package: use a real file.
let notifIconPath = null;
function notifIcon() {
  if (notifIconPath) return notifIconPath;
  try { const p = path.join(app.getPath('userData'), 'notification-icon.png'); fsx.copyFileSync(ICON, p); notifIconPath = p; }
  catch { notifIconPath = ICON; }
  return notifIconPath;
}

async function windowsNotify(title, body, link) {
  const blocked = await toastsBlocked();
  if (blocked) return { ok: false, blocked: true, error: blocked };
  return new Promise(resolve => {
    if (!Notification.isSupported()) return resolve({ ok: false, error: 'Windows notifications are not supported on this PC' });
    const n = new Notification({ title, body, icon: notifIcon(), silent: true });
    liveNotes.add(n);
    const done = r => { clearTimeout(t); resolve(r); };
    const t = setTimeout(() => done({ ok: true, unconfirmed: true }), 3000);
    n.on('show', () => done({ ok: true }));
    n.on('failed', (_e, err) => { liveNotes.delete(n); done({ ok: false, error: String(err) }); });
    n.on('click', () => openLink(link, null));
    n.on('close', () => liveNotes.delete(n));
    setTimeout(() => liveNotes.delete(n), 10 * 60e3);
    n.show();
  });
}

// ── App updates (from the SharePoint folder) ────────────────────
let upd = { status: 'idle' };          // idle | checking | current | available | downloading | signin | error
let updTimer = null;

function setUpd(next) {
  upd = { ...upd, ...next, checkedAt: next.status === 'checking' ? upd.checkedAt : Date.now() };
  if (settingsWin) settingsWin.webContents.send('update:state', { ...upd, current: VERSION });
  updateTray();
}

async function checkForUpdates(manual = false) {
  const links = updLinks();
  if (!links.manifest.length) { if (manual) setUpd({ status: 'error', error: 'Updates are not set up in this copy' }); return; }
  setUpd({ status: 'checking', error: null });
  try {
    const m = await updater.readManifest(links.manifest);
    if (m.move && (m.move.manifest || m.move.installer)) {
      const cur = store.get().updateMove || {};
      if (cur.manifest !== m.move.manifest || cur.installer !== m.move.installer) store.save({ ...store.get(), updateMove: { manifest: m.move.manifest || '', installer: m.move.installer || '' } });
    }
    if (updater.isNewer(m.version, VERSION)) {
      setUpd({ status: 'available', version: m.version, notes: m.notes || '', installer: m.installer || links.installer, size: Number(m.size) || 0, sha256: m.sha256 || '' });
      // Announce each new version exactly once (the slide-up panel), whether
      // found by the automatic check or by Check for updates — never again
      // for that version, even after a restart.
      const s = store.get();
      if (s.updateNotified !== m.version) {
        store.save({ ...s, updateNotified: m.version });
        showUpdatePanel(m.version, m.notes);
      }
    } else {
      setUpd({ status: 'current', version: m.version });
    }
  } catch (err) {
    setUpd({ status: err.code === 'SIGN_IN' ? 'signin' : 'error', error: err.message });
  }
}

async function installUpdate() {
  // Installing from the tray or Settings: lower the "update available" panel.
  if (updatePanel && !updatePanel.isDestroyed()) {
    const p = updatePanel;
    p.webContents.send('updpanel:lower');
    setTimeout(() => { if (!p.isDestroyed()) p.destroy(); }, 700);
  }
  if (upd.status !== 'available') { await checkForUpdates(true); if (upd.status !== 'available') return; }
  const link = upd.installer || updLinks().installer;
  if (!link) { setUpd({ status: 'error', error: 'Updates are not set up in this copy' }); return; }
  const version = upd.version;
  setUpd({ status: 'downloading', progress: 0 });
  try {
    const file = await updater.download(link, version, p => setUpd({ status: 'downloading', progress: p }), { size: upd.size, sha256: upd.sha256 });
    setUpd({ status: 'downloading', progress: 100 });
    await updater.runInstaller(file);
  } catch (err) {
    setUpd({ status: err.code === 'SIGN_IN' ? 'signin' : 'error', error: err.message, version });
  }
}

function scheduleUpdateChecks() {
  clearInterval(updTimer);
  const u = store.get().updates;
  if (!u.autoCheck) return;
  updTimer = setInterval(() => checkForUpdates(false), Math.max(1, u.checkHours || 3) * 3600e3);
}

ipcMain.handle('update:state', () => ({ ...upd, current: VERSION }));
ipcMain.on('update:check', () => checkForUpdates(true));
ipcMain.on('update:install', () => installUpdate());
// ── TickerSec pop-ups (don't depend on Windows notifications) ──
const POP_W = 420, POP_H = 124;
const popups = [];
function popupAnchor() {
  const s = store.get();
  const disp = screen.getAllDisplays()[s.display.monitor] || screen.getPrimaryDisplay();
  const wa = disp.workArea;
  const tickerUp = tickerWin && tickerWin.isVisible() && s.display.position === 'bottom' ? tickerWin.getBounds().height : 0;
  return { right: wa.x + wa.width - 8, bottom: wa.y + wa.height - tickerUp - 8 };
}
function layoutPopups() {
  const { right, bottom } = popupAnchor();
  popups.forEach((w, i) => { if (!w.isDestroyed()) w.setBounds({ x: right - POP_W, y: bottom - (i + 1) * POP_H, width: POP_W, height: POP_H }); });
}
// ── "Update available" panel ─────────────────────────────────────
// Slides up from the bottom of the screen (above bottom tickers), stays one
// minute, then slides back down. Shown once per new version.
let updatePanel = null;
function showUpdatePanel(version, notes) {
  if (updatePanel && !updatePanel.isDestroyed()) updatePanel.destroy();
  const s = store.get();
  const disp = screen.getAllDisplays()[s.display.monitor] || screen.getPrimaryDisplay();
  const wa = disp.workArea;
  const tickerUp = tickerWin && tickerWin.isVisible() && s.display.position === 'bottom' ? tickerWin.getBounds().height : 0;
  const W = Math.min(620, wa.width - 40), H = 112;
  const w = new BrowserWindow({
    x: wa.x + Math.round((wa.width - W) / 2), y: wa.y + wa.height - tickerUp - H, width: W, height: H,
    frame: false, transparent: true, resizable: false, movable: false, skipTaskbar: true, focusable: true, type: 'toolbar',
    alwaysOnTop: true, show: false, hasShadow: false, backgroundColor: '#00000000',
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });
  w.setAlwaysOnTop(true, 'screen-saver');
  w.loadFile(path.join(__dirname, 'renderer', 'update-panel.html'), { query: { d: JSON.stringify({ version, notes, seconds: 60 }) } });
  w.once('ready-to-show', () => w.showInactive());
  w.on('closed', () => { if (updatePanel === w) updatePanel = null; });
  updatePanel = w;
}
ipcMain.on('updpanel:done', (e, action) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (w && !w.isDestroyed()) w.destroy();
  if (action === 'install') installUpdate();
});

function showPopup(data) {
  while (popups.length >= 4) { const old = popups.shift(); if (!old.isDestroyed()) old.destroy(); }
  const w = new BrowserWindow({
    width: POP_W, height: POP_H, frame: false, transparent: true, resizable: false, movable: false,
    skipTaskbar: true, focusable: true, type: 'toolbar', alwaysOnTop: true, show: false, hasShadow: false,
    backgroundColor: '#00000000', webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });
  w.setAlwaysOnTop(true, 'screen-saver');
  w.showTickers = !!data.showTickers;
  w.runUpdate = false;
  w.webContents.on('ipc-message', (_e, ch) => { if (ch === 'popup:action') w.runUpdate = data.action === 'update'; });
  popups.push(w);
  layoutPopups();
  w.loadFile(path.join(__dirname, 'renderer', 'popup.html'), { query: { d: JSON.stringify(data) } });
  w.once('ready-to-show', () => w.showInactive());
  w.on('closed', () => { const i = popups.indexOf(w); if (i >= 0) popups.splice(i, 1); layoutPopups(); });
}
ipcMain.on('popup:close', e => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (w && w.showTickers && hidden) { hidden = false; applyTickerSettings(); updateTray(); }
  if (w && w.runUpdate) installUpdate();
  if (w && !w.isDestroyed()) w.destroy();
});

// Re-mark headlines after alert settings change (no re-download needed).
function redecorate() {
  if (!rawBars) return;
  const prevById = new Map((lastPayload ? lastPayload.bars : []).map(b => [b.id, b]));
  const bars = rawBars.map(b => ({ ...b, name: (prevById.get(b.id) || b).name, color: (prevById.get(b.id) || b).color }));
  lastPayload = { bars: decorate(bars, false), fetchedAt: lastPayload ? lastPayload.fetchedAt : Date.now() };
  sendToTicker(lastPayload);
}

// Send what we have right away (new agencies show "Loading headlines…").
function sendPlaceholders(agencies) {
  const bars = agencies.map(a => {
    const prev = lastPayload && lastPayload.bars.find(b => b.id === a.id);
    return prev ? { ...prev, name: a.label || a.name, color: a.color }
                : { id: a.id, name: a.label || a.name, color: a.color, items: [], error: null };
  });
  lastPayload = { bars, fetchedAt: lastPayload ? lastPayload.fetchedAt : Date.now() };
  sendToTicker(lastPayload);
}

async function refresh() {
  clearTimeout(refreshTimer);
  if (!isActive()) { updateTray(); return; }     // switched off: no fetching until switched on
  const my = ++generation;
  const s = store.get();
  const agencies = enabledAgencies();
  sendPlaceholders(agencies);

  const bars = await Promise.all(agencies.map(async a => {
    try {
      const r = await loadAgency(a, s);
      status[a.id] = { ok: true, count: r.items.length, updated: Date.now(), backup: !!r.viaBackup };
      return { id: a.id, name: a.label || a.name, color: a.color, lang: r.from, translated: r.translated, items: r.items, error: null, loaded: true };
    } catch (err) {
      status[a.id] = { ok: false, error: String(err.message || err), updated: Date.now() };
      // Keep showing the last good headlines if we have them.
      const prev = lastPayload && lastPayload.bars.find(b => b.id === a.id);
      return { id: a.id, name: a.label || a.name, color: a.color, items: prev ? prev.items : [], error: String(err.message || err) };
    }
  }));
  if (my !== generation) return;          // a newer refresh started meanwhile

  rawBars = bars;
  lastPayload = { bars: decorate(bars, true), fetchedAt: Date.now() };
  sendToTicker(lastPayload);
  if (settingsWin) settingsWin.webContents.send('settings:status', status);
  updateTray();

  refreshTimer = setTimeout(refresh, Math.max(1, s.updates.refreshMinutes) * 60e3);
}

// ── Tray ────────────────────────────────────────────────────────
function updateTray() {
  if (!tray) return;
  const when = lastPayload ? new Date(lastPayload.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
  const on = isActive();
  tray.setToolTip(on ? `TickerSec ${VERSION} — updated ${when}` : `TickerSec ${VERSION} — switched off`);
  const icon = nativeImage.createFromPath(on ? ICON : ICON_OFF);
  if (!icon.isEmpty()) tray.setImage(icon.resize({ width: 16, height: 16 }));
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: `TickerSec ${VERSION} — Breaking News feeds`, enabled: false },
    { label: on ? '●  TickerSec is ON — click to turn off' : '○  TickerSec is OFF — click to turn on', accelerator: 'Ctrl+Alt+T', click: () => setActive(!on) },
    { label: 'Created by Jay Appell · 11/2026  ↗', click: () => shell.openExternal('https://www.youtube.com/@epomd') },
    { label: '✉  Send feedback…', click: sendFeedback },
    { label: '↻  Headlines won\'t open? Refresh the tickers', click: async () => { await writeClickReport(); recycleTicker('from the tray'); showPopup({ agency: 'TickerSec', color: '#5b8cff', why: 'REFRESHED', title: 'Tickers refreshed — headlines should open again', foot: 'A click report was also saved to link-open.log', seconds: 6 }); } },
    ...(upd.status === 'available' ? [{ type: 'separator' }, { label: `⬆  Install update ${upd.version}`, click: installUpdate }] : []),
    ...(upd.status === 'downloading' ? [{ type: 'separator' }, { label: `Downloading update… ${upd.progress || 0}%`, enabled: false }] : []),
    { type: 'separator' },
    { label: hidden ? 'Show tickers' : 'Hide tickers', accelerator: 'Ctrl+Alt+N', click: toggleHidden },
    { label: paused ? 'Resume scrolling' : 'Pause scrolling', click: togglePause },
    { label: 'Keep tickers on top of other windows', type: 'checkbox', checked: store.get().display.alwaysOnTop !== false, click: toggleOnTop },
    { label: 'Show only NEW headlines', type: 'checkbox', checked: !!store.get().display.onlyNew, click: toggleOnlyNew },
    ...categoryMenu(),
    { label: `Refresh now  (last ${when})`, click: refresh },
    { type: 'separator' },
    { label: 'Check for updates', click: () => checkForUpdates(true) },
    { label: 'Settings…', click: openSettings },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
  ]));
}

// Tray: one "Collapse" checkbox per category that has sources turned on.
function categoryMenu() {
  const cats = [...new Set(enabledAgencies().map(a => a.region).filter(layout.isCategory))].filter(c => !layout.isConsolidated(c));
  if (!cats.length) return [];
  const collapsed = store.get().display.collapsed || {};
  return [{
    label: 'Categories',
    submenu: [
      { label: 'Collapse all', click: () => setAllCategories(cats, true) },
      { label: 'Expand all', click: () => setAllCategories(cats, false) },
      { type: 'separator' },
      ...cats.map(c => ({ label: `${layout.CATEGORIES[c].icon}  ${layout.CATEGORIES[c].label || c} — collapsed`, type: 'checkbox', checked: layout.isCollapsed(c, collapsed), click: () => toggleCategory(c) }))
    ]
  }];
}

function setAllCategories(cats, on) {
  const s = store.get();
  const collapsed = { ...(s.display.collapsed || {}) };
  cats.forEach(c => { collapsed[c] = !!on; });
  store.save({ ...s, display: { ...s.display, collapsed } });
  applyTickerSettings();
  updateTray();
}

// Master switch: off = tickers hidden, no fetching, no alerts. Remembered across restarts.
function setActive(on) {
  const s = store.get();
  store.save({ ...s, active: !!on });
  if (!on) {
    clearTimeout(refreshTimer);
    popups.slice().forEach(w => { if (!w.isDestroyed()) w.destroy(); });
  }
  applyTickerSettings();
  if (on) refresh();
  if (settingsWin) settingsWin.webContents.send('settings:changed', store.get());
  updateTray();
}

function toggleHidden() {
  hidden = !hidden;
  applyTickerSettings();
  updateTray();
}

function toggleOnTop() {
  const s = store.get();
  store.save({ ...s, display: { ...s.display, alwaysOnTop: s.display.alwaysOnTop === false } });
  applyTickerSettings();
  if (settingsWin) settingsWin.webContents.send('settings:changed', store.get());
  updateTray();
}

function toggleOnlyNew() {
  const s = store.get();
  store.save({ ...s, display: { ...s.display, onlyNew: !s.display.onlyNew } });
  applyTickerSettings();
  if (settingsWin) settingsWin.webContents.send('settings:changed', store.get());
  updateTray();
}

function togglePause() {
  paused = !paused;
  applyTickerSettings();
  updateTray();
}

// ── Browser fallback ────────────────────────────────────────────
// Loads a feed in a hidden Chromium window (real browser, keeps cookies),
// waits out any bot-check page, then reads the raw feed text from inside it.
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
function fetchInBrowser(url) {
  return new Promise(resolve => {
    const win = new BrowserWindow({
      show: false, width: 1024, height: 768,
      webPreferences: { partition: 'persist:feeds', javascript: true, images: false }
    });
    let done = false;
    const finish = text => { if (done) return; done = true; clearInterval(poll); clearTimeout(limit); if (!win.isDestroyed()) win.destroy(); resolve(text); };
    const grab = async () => {
      if (done || win.isDestroyed()) return;
      try {
        const text = await win.webContents.executeJavaScript(
          `fetch(location.href, { credentials: 'include' }).then(r => r.text()).catch(() => '')`, true);
        if (/<(rss|feed|rdf:RDF|RDF)[\s>]/i.test(String(text).slice(0, 5000))) finish(text);
      } catch {}
    };
    const poll = setInterval(grab, 2000);
    const limit = setTimeout(() => finish(null), 25000);
    win.webContents.on('did-finish-load', grab);
    win.loadURL(url, { userAgent: BROWSER_UA }).catch(() => {});
  });
}

// ── IPC ─────────────────────────────────────────────────────────
// ── Settings → Status page ──
ipcMain.handle('status:info', () => ({ hidden, memoryMB: (() => { try { return Math.round(app.getAppMetrics().reduce((n, m) => n + (m.memory ? m.memory.workingSetSize : 0), 0) / 1024); } catch { return 0; } })() }));
ipcMain.handle('status:action', async (_e, what) => {
  if (what === 'toggleHidden') toggleHidden();
  else if (what === 'rebuild') recycleTicker('from Settings');
  else if (what === 'report') await writeClickReport();
  else if (what === 'openLog') { const f = path.join(app.getPath('userData'), 'link-open.log'); if (!fs.existsSync(f)) fs.writeFileSync(f, ''); shell.openPath(f); }
  return true;
});
ipcMain.handle('settings:get', () => ({
  version: VERSION,
  settings: store.get(),
  presets: PRESETS,
  status,
  displays: screen.getAllDisplays().map((d, i) => ({
    index: i,
    label: `Monitor ${i + 1} — ${d.size.width}×${d.size.height}${d.id === screen.getPrimaryDisplay().id ? ' (main)' : ''}`
  }))
}));

// Only re-download feeds when something that affects headlines changed.
const feedKey = s => JSON.stringify([s.enabled, s.custom, { ...s.updates, manifestUrl: 0, installerUrl: 0, autoCheck: 0, checkHours: 0 }, s.translation]);

ipcMain.handle('settings:save', async (_e, next) => {
  const before = feedKey(store.get());
  const alertsBefore = JSON.stringify(store.get().alerts);
  // Categories are collapsed from the ticker/tray, not Settings: keep the live state.
  next = { ...next, active: store.get().active, display: { ...next.display, collapsed: store.get().display.collapsed || {} } };
  const saved = store.save(next);
  if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: !!saved.startWithWindows });
  applyTickerSettings();
  updateTray();
  scheduleUpdateChecks();
  if (feedKey(saved) !== before) refresh();
  else if (JSON.stringify(saved.alerts) !== alertsBefore) redecorate();
  else sendPlaceholders(enabledAgencies());   // just names/colors changed
  return saved;
});

ipcMain.on('news:refresh', () => refresh());
ipcMain.on('app:setActive', (_e, on) => setActive(on));

// ── Preview buttons (Settings → Alerts → Preview) ───────────────
// Put a sample headline at the front of the first bar, slide it in now,
// and take it away again after a minute.
let demoTimer = null;
function demoHeadline(kind) {
  if (!lastPayload || !lastPayload.bars.length) return { ok: false, error: 'Add at least one agency first' };
  const a = store.get().alerts;
  const kw = (a.keywords && a.keywords[0]) ? a.keywords[0].replace(/\*$/, '') : 'Steelers';
  const stamp = Date.now();
  const item = {
    new:      { title: 'Sample: a headline published a minute ago gets the NEW tag', alert: null },
    keyword:  { title: `Sample: ${kw} headline — your keyword is marked in gold`, alert: { breaking: false, keywords: [kw] }, flash: true },
    breaking: { title: 'Sample: BREAKING headlines turn red and jump to the front', alert: { breaking: true, keywords: [] }, flash: true },
    glow:     { title: 'Sample: a brand-new alert headline glows as it scrolls by', alert: { breaking: false, keywords: [] }, flash: true }
  }[kind];
  const sample = { link: `https://example.com/preview/${stamp}`, date: stamp - 60e3, ...item };
  const bars = lastPayload.bars.map((b, i) => i === 0 ? { ...b, items: [sample, ...b.items] } : b);
  sendToTicker({ bars, fetchedAt: lastPayload.fetchedAt, force: [bars[0].id] });
  clearTimeout(demoTimer);
  demoTimer = setTimeout(() => { if (lastPayload) sendToTicker({ ...lastPayload, force: [lastPayload.bars[0]?.id] }); }, 60e3);
  return { ok: true, bar: bars[0].name, hidden };
}

ipcMain.handle('demo:run', async (_e, kind) => {
  const a = store.get().alerts;
  const kw = (a.keywords && a.keywords[0]) ? a.keywords[0].replace(/\*$/, '') : 'Steelers';
  const first = lastPayload && lastPayload.bars[0];
  const agency = first ? first.name : 'TickerSec', color = first ? first.color : '#5b8cff';
  switch (kind) {
    case 'new': case 'keyword': case 'breaking': case 'glow':
      return demoHeadline(kind);
    case 'popup-keyword':
      showPopup({ agency, color, why: `Keyword: ${kw}`, title: `Sample: a ${kw} headline arrived — click to read, ✕ to dismiss`, foot: 'Preview' });
      return { ok: true };
    case 'popup-breaking':
      showPopup({ agency, color, breaking: true, why: 'BREAKING', title: 'Sample: breaking pop-ups are red and pulse three times', foot: 'Preview' });
      return { ok: true };
    case 'windows':
      return { ok: true, windows: await windowsNotify(`${agency} — Keyword: ${kw}`, 'Sample: this is a Windows notification from TickerSec.') };
    case 'chime': case 'chime-breaking':
      if (!a.chime) return { ok: true, off: true };
      if (tickerWin) tickerWin.webContents.send('ticker:chime', { volume: a.chimeVolume, sound: a.chimeSound, breaking: kind === 'chime-breaking' });
      return { ok: true, quiet: inQuietHours(a) };
    case 'everything': {
      const r = demoHeadline('breaking');
      showPopup({ agency, color, breaking: true, why: 'BREAKING', title: 'Sample: BREAKING — this is a full alert: red headline, glow, pop-up and chime', foot: 'Preview' });
      if (a.chime && tickerWin) tickerWin.webContents.send('ticker:chime', { volume: a.chimeVolume, sound: a.chimeSound, breaking: true });
      return { ...r, chimeOff: !a.chime };
    }
  }
  return { ok: false, error: 'Unknown preview' };
});

ipcMain.handle('alerts:test', async (_e, kind) => {
  const a = store.get().alerts;
  if (kind === 'chime' || kind === 'chime-breaking') {
    if (!a.chime) return { ok: true, off: true };
    if (tickerWin) tickerWin.webContents.send('ticker:chime', { volume: a.chimeVolume, sound: a.chimeSound, breaking: kind === 'chime-breaking', test: true });
    return { ok: true, quiet: inQuietHours(a) };
  }
  const style = a.notifyStyle || 'popup';
  const res = { ok: true, style };
  if (style === 'popup' || style === 'both') {
    showPopup({ agency: 'TickerSec', color: '#f6c344', why: 'Keyword: test', title: 'This is what an alert looks like — click it to open the story, or ✕ to dismiss.', foot: 'Test alert' });
  }
  if (style === 'windows' || style === 'both') {
    res.windows = await windowsNotify('TickerSec — Keyword: test', 'This is what an alert notification looks like.');
  }
  return res;
});

ipcMain.handle('feed:test', async (_e, url) => {
  try {
    const preset = PRESETS.find(p => p.url === url);
    const f = preset ? await fetchWithFallbacks(preset) : await fetchFeed(url);
    return { ok: true, backup: !!f.viaBackup, title: f.title, language: f.language, count: f.items.length, sample: f.items.slice(0, 3).map(i => i.title) };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
});

ipcMain.handle('translate:test', async (_e, cfg) => {
  try {
    const { translateOne } = require('./src/translate');
    const out = await translateOne('Guten Morgen, die Nachrichten des Tages', 'de', cfg);
    return { ok: true, text: out };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
});

// ── Feedback by email ─────────────────────────────────────────────
const FEEDBACK_EMAIL = 'tickersec@epomd.com';
function sendFeedback() {
  const rel = require('os').release();
  const build = Number(rel.split('.')[2]) || 0;
  const win = process.platform === 'win32' ? `Windows ${build >= 22000 ? 11 : 10} (build ${build})` : process.platform;
  const body = `Hi,\n\n[Your feedback, suggestion or problem here]\n\n\n---\nTickerSec ${VERSION} · ${win}`;
  const url = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('Feedback from User')}&body=${encodeURIComponent(body)}`;
  logLink(`feedback email`);
  if (process.platform === 'win32') {
    execFile('rundll32.exe', ['url.dll,FileProtocolHandler', url], { windowsHide: true }, err => { if (err) shell.openExternal(url).catch(() => {}); });
  } else shell.openExternal(url).catch(() => {});
}
ipcMain.on('open:feedback', () => sendFeedback());

// ── Opening a headline in the browser ───────────────────────────
// The tickers and pop-ups never take keyboard focus, so after TickerSec has
// been running a while Windows treats it as a background app and won't let it
// bring the browser forward — the story opened in a hidden tab, so "nothing
// happened". Now the clicked window briefly takes focus (allowed: the user just
// clicked it), and the link is handed to Windows' own URL opener, with
// Electron's opener as a fallback. Each click is logged (link-open.log).
function logLink(msg) {
  try {
    const f = path.join(app.getPath('userData'), 'link-open.log');
    if (fs.existsSync(f) && fs.statSync(f).size > 200e3) fs.renameSync(f, f + '.old');
    fs.appendFileSync(f, `${new Date().toISOString()}  ${msg}\n`);
  } catch {}
}
let lastOpen = { url: '', at: 0 };
function openLink(url, fromWin) {
  if (url && url === lastOpen.url && Date.now() - lastOpen.at < 1500) return;   // same headline twice in a row
  lastOpen = { url, at: Date.now() };
  if (!/^https?:\/\//i.test(url || '')) { logLink(`skipped — not a web address: ${String(url).slice(0, 200)}`); return; }
  url = url.replace(/ /g, '%20');
  logLink(`open ${url}`);
  if (fromWin && !fromWin.isDestroyed() && process.platform === 'win32') {
    try {
      // 2.7.5: the docked tickers and pop-ups are no longer switched to
      // "focusable" for a moment on each click — Windows could leave them
      // unable to take clicks afterwards. Normal windows are focused as usual.
      if (fromWin.isFocusable() && !(fromWin === tickerWin && tickerMode === 'docked')) fromWin.focus();
    } catch {}
  }
  const viaElectron = () => shell.openExternal(url).then(() => logLink('  opened (electron)')).catch(err => logLink(`  FAILED: ${err.message}`));
  if (process.platform !== 'win32') return viaElectron();
  execFile('rundll32.exe', ['url.dll,FileProtocolHandler', url], { windowsHide: true }, err => {
    if (err) { logLink(`  windows opener failed (${err.message}) — trying electron`); viaElectron(); }
    else logLink('  opened (windows)');
  });
}
let lastInput = null;
// ── Clicks straight from Windows ──────────────────────────────────
// Proven on an affected PC (2026-11-21): Windows delivers every left press to the
// ticker window, but after a while the press no longer reaches the ticker page
// inside it (mouse moves still do). So TickerSec also takes the press from the
// window itself and opens the headline under the mouse. If the page did get the
// press, it has already opened it and this path does nothing.
const pressCount = { windows: 0, engine: 0, activate: 0 };
function watchPresses(w) {
  try {
    w.webContents.on('input-event', (_e, ev) => { if (ev.type === 'mouseDown') pressCount.engine++; });
  } catch {}
  if (process.platform !== 'win32' || typeof w.hookWindowMessage !== 'function') return;
  w.hookWindowMessage(0x0201, () => { pressCount.windows++; });   // WM_LBUTTONDOWN reached the window
  // Belt and braces: WM_MOUSEACTIVATE arrives on every press, even one Windows
  // then throws away. If the page didn't get the press, open the headline anyway.
  w.hookWindowMessage(0x0021, (_wp, lp) => {
    const msg = lp && lp.length >= 4 ? (lp.readUInt32LE(0) >>> 16) : 0;
    if (msg !== 0x0201) return;                    // left button only
    pressCount.activate = (pressCount.activate || 0) + 1;
    const at = screen.getCursorScreenPoint();
    setTimeout(() => pressFromWindows(w, at), 250);
  });
}
async function pressFromWindows(w, at) {
  if (!w || w.isDestroyed()) return;
  const b = w.getBounds(), x = at.x - b.x, y = at.y - b.y;
  try {
    const r = await w.webContents.executeJavaScript(`window.__pressAt ? window.__pressAt(${x}, ${y}) : null`, true);
    if (r && r.link) { logLink('ticker: press taken from Windows (the page did not get it)'); openLink(r.link, w); }
  } catch (err) { logLink(`ticker: could not handle press from Windows: ${err.message}`); }
}
ipcMain.on('diag:input', (_e, c) => {
  lastInput = { ...c, at: Date.now(), windows: pressCount.windows, engine: pressCount.engine, activate: pressCount.activate };
  if (pressCount.activate > c.down) logLink(`ticker: last minute — ${pressCount.activate} press(es) on the ticker, ${pressCount.windows} reached the window, ${pressCount.engine} reached the engine, ${c.down} reached the page (missed ones were opened via Windows)`);
  else if (c.down === 0 && c.move > 20 && c.enter > 0) logLink(`ticker: mouse moving over the tickers but no button presses arrived in the last minute (moves ${c.move})`);
  pressCount.windows = 0; pressCount.engine = 0; pressCount.activate = 0;
});
async function writeClickReport() {
  const lines = [`==== Click report · TickerSec ${app.getVersion()} · running ${Math.round(process.uptime() / 60)} min ====`];
  try {
    const m = app.getAppMetrics();
    const mb = m.reduce((t, p) => t + (p.memory ? p.memory.workingSetSize : 0), 0) / 1024;
    lines.push(`memory: ${mb.toFixed(0)} MB across ${m.length} processes · ` + m.map(p => `${p.type} ${Math.round((p.memory?.workingSetSize || 0) / 1024)}MB`).join(', '));
  } catch {}
  for (const w of BrowserWindow.getAllWindows()) {
    try {
      const u = w.webContents.getURL().split('/').pop().split('?')[0] || '(blank)';
      lines.push(`window ${u}: visible=${w.isVisible()} focusable=${w.isFocusable()} onTop=${w.isAlwaysOnTop()} minimized=${w.isMinimized()} bounds=${JSON.stringify(w.getBounds())}`);
    } catch {}
  }
  if (lastInput) lines.push(`ticker input in the last minute (as of ${new Date(lastInput.at).toLocaleTimeString()}): moves ${lastInput.move}, enters ${lastInput.enter}, presses ${lastInput.down}, releases ${lastInput.up}, clicks ${lastInput.click} · presses Windows delivered ${lastInput.windows ?? '?'}, engine passed on ${lastInput.engine ?? '?'}`);
  try {
    const probe = await tickerWin.webContents.executeJavaScript(`(() => { const r = window.__lastMouse; if (!r) return 'no mouse position yet'; const e = document.elementFromPoint(r.x, r.y); return 'element under last mouse position: ' + (e ? e.tagName.toLowerCase() + '.' + String(e.className).replace(/ /g, '.') : 'none') + ' · items on screen: ' + document.querySelectorAll('.item').length; })()`);
    lines.push(probe);
  } catch (err) { lines.push(`ticker page did not answer: ${err.message}`); }
  lines.forEach(l => logLink(l));
  return lines.join('\n');
}
ipcMain.handle('diag:report', () => writeClickReport());
let diagCount = 0; setInterval(() => { diagCount = 0; }, 60e3);
ipcMain.on('diag', (_e, msg) => { if (diagCount++ < 10) logLink(`ticker: ${msg}`); });
ipcMain.on('open:link', (e, url) => openLink(url, BrowserWindow.fromWebContents(e.sender)));
ipcMain.on('open:settings', openSettings);
ipcMain.on('open:notifySettings', () => shell.openExternal('ms-settings:notifications'));
ipcMain.on('category:toggle', (_e, cat) => toggleCategory(cat));
ipcMain.on('ticker:ready', () => applyTickerSettings());

// ── App lifecycle ───────────────────────────────────────────────
app.on('second-instance', (_e, _argv, _cwd, data) => {
  if (data && data.version && isNewer(data.version, VERSION)) {
    // A newer version was started: close this old copy and launch the new one.
    app.relaunch({ execPath: data.execPath || process.execPath, args: [] });
    app.exit(0);
    return;
  }
  if (welcomeWin) { welcomeWin.show(); welcomeWin.focus(); return; }
  openSettings();
});

// After sleep or a locked screen, Windows can leave the always-visible,
// never-focused ticker window half-responsive: set it up again.
// ── Housekeeping: keep a long-running TickerSec lean ──────────────
// After many hours the ticker window can stop receiving clicks (fixed by a
// restart). So the ticker window is quietly rebuilt every few hours, sooner if
// it uses a lot of memory — never while the mouse is over it. Old data is
// trimmed and network caches cleared at the same time.
const RECYCLE_HOURS = 4, RECYCLE_MB = 350;
let tickerBorn = Date.now(), lastCacheClear = Date.now(), warmStart = false;
function recycleTicker(why) {
  if (!tickerWin || tickerWin.isDestroyed()) return;
  logLink(`rebuild ticker window (${why})`);
  const old = tickerWin; tickerWin = null;
  old.removeAllListeners('close'); old.removeAllListeners('closed');
  warmStart = true;     // new window starts with the bars already full, so nothing goes blank
  createTicker();
  tickerBorn = Date.now();
  let gone = false;
  const drop = () => { if (gone) return; gone = true; if (!old.isDestroyed()) old.destroy(); };
  if (tickerWin) tickerWin.once('ready-to-show', () => setTimeout(drop, 1500));   // swap without a blink
  setTimeout(drop, 15000);
}
function tickerMemoryMB() {
  try {
    const pid = tickerWin.webContents.getOSProcessId();
    const p = app.getAppMetrics().find(m => m.pid === pid);
    return p && p.memory ? Math.round(p.memory.workingSetSize / 1024) : 0;
  } catch { return 0; }
}
function mouseOverTicker() {
  try { const c = screen.getCursorScreenPoint(), b = tickerWin.getBounds(); return c.x >= b.x && c.x < b.x + b.width && c.y >= b.y && c.y < b.y + b.height; } catch { return false; }
}
function housekeeping() {
  // Trim what TickerSec remembers.
  if (seenAlerts && seenAlerts.size > 3000) seenAlerts = new Set([...seenAlerts].slice(-3000));
  if (Date.now() - lastCacheClear > 6 * 3600e3) {
    lastCacheClear = Date.now();
    for (const ses of [session.defaultSession, session.fromPartition('persist:updates')]) { try { ses.clearCache(); ses.clearCodeCaches({}); } catch {} }
  }
  if (!tickerWin || tickerWin.isDestroyed() || !tickerWin.isVisible() || mouseOverTicker()) return;
  const mb = tickerMemoryMB();
  if (mb > RECYCLE_MB) recycleTicker(`using ${mb} MB`);
  else if (Date.now() - tickerBorn > RECYCLE_HOURS * 3600e3) recycleTicker(`routine, ${mb} MB`);
}

function refreshTickerWindow(why) {
  logLink(`refresh ticker window (${why})`);
  setTimeout(() => { try { applyTickerSettings(); } catch {} }, 1500);
}

app.whenReady().then(() => {
  try {
    const { powerMonitor } = require('electron');
    powerMonitor.on('resume', () => setTimeout(() => recycleTicker('after sleep'), 4000));
    powerMonitor.on('unlock-screen', () => refreshTickerWindow('unlock'));
  } catch {}
  if (!gotLock) return;
  if (process.platform === 'win32') app.setAppUserModelId('com.jayappell.tickersec');
  store = new Store(app.getPath('userData'));
  setInterval(housekeeping, 10 * 60e3);
  // After the rename, drop any "Start with Windows" entry that still points at the old Breaking News.exe.
  if (migratedFromBreakingNews && process.platform === 'win32') {
    try {
      execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
        "$k='HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'; (Get-ItemProperty $k).PSObject.Properties | Where-Object { \"$($_.Value)\" -like '*Breaking News.exe*' } | ForEach-Object { Remove-ItemProperty $k -Name $_.Name }"],
        { windowsHide: true, timeout: 15000 });
    } catch {}
  }
  // Keep the Windows start-up entry in step with the setting (e.g. after a reinstall that kept settings).
  if (app.isPackaged) { try { app.setLoginItemSettings({ openAtLogin: !!store.get().startWithWindows }); } catch {} }
  // Fresh install = no settings and no sign the app ever ran here (running.json exists since 1.0.5).
  const isFirstRun = !fs.existsSync(store.file) && !fs.existsSync(RUNNING_FILE());
  if (isFirstRun) welcoming = true;
  else {
    // Upgrades keep their configuration. "Keep on top" is now off by default for new
    // installs, so copies that never chose keep the on-top behaviour they had.
    const raw = store.read();
    if (!raw.display || raw.display.alwaysOnTop === undefined) {
      const cur = store.get();
      store.save({ ...cur, display: { ...cur.display, alwaysOnTop: true } });
    } else if (!fs.existsSync(store.file)) store.save(store.get());
  }
  setBrowserFetcher(fetchInBrowser);
  setTimeout(() => checkForUpdates(false), 20000);
  scheduleUpdateChecks();
  try { fs.writeFileSync(RUNNING_FILE(), JSON.stringify({ version: VERSION, pid: process.pid })); } catch {}

  const img = nativeImage.createFromPath(ICON);
  tray = new Tray(img.isEmpty() ? img : img.resize({ width: 16, height: 16 }));
  tray.on('click', openSettings);
  updateTray();
  // Windows registers the icon a moment after it appears.
  setTimeout(showTrayIconOnTaskbar, 5000);
  setTimeout(showTrayIconOnTaskbar, 60000);

  createTicker();
  screen.on('display-metrics-changed', applyTickerSettings);
  screen.on('display-added', applyTickerSettings);
  screen.on('display-removed', applyTickerSettings);
  globalShortcut.register('Control+Alt+N', toggleHidden);
  globalShortcut.register('Control+Alt+T', () => setActive(!isActive()));

  refresh();
  // First run (no settings yet): ask which services to start with.
  // An upgrade keeps settings.json, so its configuration stays exactly as it was.
  if (isFirstRun) openWelcome();
  else if (process.argv.includes('--settings')) openSettings();
});

app.on('before-quit', () => { app.isQuitting = true; });
app.on('window-all-closed', e => e.preventDefault?.());   // live in the tray
app.on('will-quit', () => globalShortcut.unregisterAll());
