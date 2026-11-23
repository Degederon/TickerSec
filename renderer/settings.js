let VERSION = '';
// Settings page. Every change is saved automatically and applied live.

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const LANGS = {
  auto: 'Detect automatically', en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
  pt: 'Portuguese', nl: 'Dutch', pl: 'Polish', sv: 'Swedish', ru: 'Russian', uk: 'Ukrainian',
  tr: 'Turkish', ar: 'Arabic', he: 'Hebrew', hi: 'Hindi', ja: 'Japanese', ko: 'Korean', zh: 'Chinese'
};

let S, PRESETS, STATUS = {};
const TESTED = {};   // id -> 'ok' | 'bad' | 'testing' (from Test all agencies)
let saveTimer;

// ── Helpers ─────────────────────────────────────────────────────
function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) e.setAttribute(k, v);
  }
  for (const k of kids.flat()) if (k !== null && k !== undefined) e.append(k);
  return e;
}

function allAgencies() {
  return [...PRESETS, ...S.custom.map(c => ({ region: 'Custom', ...c }))];
}

// Categories whose sources all scroll in a single bar.
const CONSOLIDATED = {
  'Power Related News': 'One ticker · consolidated feed',
  'Internet & Telecom News': 'One ticker · consolidated feed',
  'Service Outages': 'One ticker · consolidated feed',
  'Vendor Security Advisories': 'One ticker · consolidated feed',
  'Cyber Breaking News': 'One ticker · consolidated feed',
  'Breaking Across the U.S.': 'One ticker · consolidated feed'
};

function agency(id) {
  const a = allAgencies().find(x => x.id === id);
  return a ? { ...a, ...(S.overrides[id] || {}) } : null;
}

function save() {
  $('#saveState').textContent = 'Saving…';
  $('#saveState').classList.add('dirty');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    S = await window.news.saveSettings(S);
    pushPreview(); renderStatus();
    $('#saveState').textContent = 'All changes saved';
    $('#saveState').classList.remove('dirty');
  }, 350);
}

// ── Master on/off switch ────────────────────────────────────────
function showMaster(on) {
  $('#master').checked = on;
  $('#masterWrap').classList.toggle('off', !on);
  $('#masterText').textContent = on ? 'TickerSec is ON' : 'TickerSec is OFF';
  $('#masterSub').textContent = on ? 'Tickers, headlines and alerts are running' : 'No tickers, headlines or alerts until you turn it on';
}
$('#master').addEventListener('change', () => { S.active = $('#master').checked; showMaster(S.active); window.news.setActive(S.active); });

// ── Credit link ─────────────────────────────────────────────────
$('#creditLink').addEventListener('click', e => { e.preventDefault(); window.news.openLink('https://www.youtube.com/@epomd'); });

$('#feedbackBtn').addEventListener('click', () => window.news.sendFeedback());

// ── Live preview (Display + Alerts) ─────────────────────────────
function pushPreview() {
  if (!S) return;
  $$('iframe.preview').forEach(f => { try { f.contentWindow.postMessage({ display: S.display, alerts: S.alerts }, '*'); } catch {} });
}
window.addEventListener('message', e => {
  if (!e.data) return;
  if (e.data.previewReady) pushPreview();
  if (e.data.previewHeight) $$('iframe.preview').forEach(f => { if (f.contentWindow === e.source) f.style.height = `${Math.ceil(e.data.previewHeight) + 2}px`; });
});
['input', 'change'].forEach(t => document.addEventListener(t, () => setTimeout(pushPreview, 0)));

// ── Status page ─────────────────────────────────────────────────
let INFO = {}, UPD = {}, feedFilter = 'all';
const agoText = t => { if (!t) return 'not yet'; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`; };
function renderStatus() {
  if (!S || !$('#stFeeds')) return;
  const ids = S.enabled.filter(id => agency(id));
  const rows = ids.map(id => ({ id, a: agency(id), st: STATUS[id] }));
  const bad = rows.filter(r => r.st && !r.st.ok), ok = rows.filter(r => r.st && r.st.ok), waiting = rows.filter(r => !r.st);
  const headlines = ok.reduce((n, r) => n + (r.st.count || 0), 0);
  const last = Math.max(0, ...rows.map(r => (r.st && r.st.updated) || 0));
  const on = S.active !== false;
  const state = !on ? 'off' : INFO.hidden ? 'hidden' : bad.length ? 'warn' : waiting.length === rows.length ? 'wait' : 'ok';
  $('#stHero').dataset.state = state;
  $('#stTitle').textContent = {
    off: 'TickerSec is turned off', hidden: 'Tickers are hidden', wait: 'Getting the first headlines…',
    warn: `${bad.length} feed${bad.length === 1 ? '' : 's'} need${bad.length === 1 ? 's' : ''} attention`, ok: 'Everything is working'
  }[state];
  $('#stSub').textContent = !on ? 'Turn it on with the switch on the left (or Ctrl + Alt + T).'
    : INFO.hidden ? 'Press Ctrl + Alt + N, or “Show tickers” below, to bring them back.'
    : `${ok.length} of ${rows.length} feeds working · last refresh ${agoText(last)}`;
  const kpi = (v, l, cls = '') => `<div class="kpi ${cls}"><b>${v}</b><small>${l}</small></div>`;
  $('#stKpis').innerHTML = kpi(`${ok.length}/${rows.length}`, 'feeds working', bad.length ? 'warn' : '') + kpi(headlines, 'headlines') +
    kpi(agoText(last).replace(' ago', ''), 'last refresh') + kpi(INFO.memoryMB ? `${INFO.memoryMB} MB` : '—', 'memory');
  $('#qaHide').textContent = INFO.hidden ? 'Show tickers' : 'Hide tickers';
  $('#stFeedCount').textContent = `${rows.length} feeds`;
  const show = rows.filter(r => feedFilter === 'all' || (feedFilter === 'bad' ? (r.st && !r.st.ok) : (r.st && r.st.ok)))
    .sort((x, y) => (x.st && !x.st.ok ? 0 : 1) - (y.st && !y.st.ok ? 0 : 1));
  $('#stFeeds').replaceChildren(...(show.length ? show.map(r => {
    const cls = !r.st ? 'wait' : r.st.ok ? (r.st.backup ? 'backup' : 'ok') : 'bad';
    const msg = !r.st ? 'waiting for the first update' : r.st.ok ? `${r.st.count} headlines${r.st.backup ? ' · its own feed failed, using Google News backup' : ''} · ${agoText(r.st.updated)}` : r.st.error;
    return el('li', { class: cls }, el('span', { class: 'hdot' }), el('b', {}, r.a.label || r.a.name), el('span', { class: 'hmsg', title: msg }, msg));
  }) : [el('li', { class: 'none' }, feedFilter === 'bad' ? '✓ No problems — every feed is working.' : 'No feeds here.')]));
  $('#stVersion').textContent = `v${VERSION}`;
  $('#stUpd').textContent = UPD.status === 'available' ? `Version ${UPD.version} is available.` : UPD.status === 'error' ? `Last update check failed: ${UPD.error || ''}` : 'You have the newest version.';
  $('#hlNote').textContent = `Right now: ${headlines} headlines across ${ok.length} working feed${ok.length === 1 ? '' : 's'}.`;
}
async function refreshInfo() { try { INFO = await window.news.statusInfo(); } catch {} renderStatus(); }
function initStatus() {
  $$('#stFilter button').forEach(b => b.addEventListener('click', () => { feedFilter = b.dataset.v; $$('#stFilter button').forEach(x => x.classList.toggle('on', x === b)); renderStatus(); }));
  const res = t => { $('#qaResult').textContent = t; setTimeout(() => { $('#qaResult').textContent = ''; }, 5000); };
  $('#qaRefresh').addEventListener('click', () => { window.news.refresh(); res('Fetching fresh headlines…'); });
  $('#qaHide').addEventListener('click', async () => { await window.news.statusAction('toggleHidden'); refreshInfo(); });
  $('#qaRebuild').addEventListener('click', async () => { await window.news.statusAction('rebuild'); res('Tickers refreshed.'); });
  $('#qaLog').addEventListener('click', () => window.news.statusAction('openLog'));
  $('#qaReport').addEventListener('click', async () => { await window.news.statusAction('report'); res('Click report written to the log.'); });
  $('#stUpdGo').addEventListener('click', () => $('.nav[data-tab="updates"]').click());
  window.news.getUpdateState().then(st => { UPD = st || {}; renderStatus(); });
  window.news.onUpdateState(st => { UPD = st || {}; renderStatus(); });
  refreshInfo();
  setInterval(refreshInfo, 15000);
}

// ── Tabs ────────────────────────────────────────────────────────
$$('.nav').forEach(b => b.addEventListener('click', () => {
  $$('.nav').forEach(n => n.classList.toggle('active', n === b));
  $$('.tab').forEach(t => t.classList.toggle('active', t.id === `tab-${b.dataset.tab}`));
}));

// ── Enabled list (drag to reorder) ──────────────────────────────
let dragId = null;

// "Your tickers" is grouped by region/category, each group folded to one line
// (click to open it). The groups keep the ticker order: the top group is the
// top of the tickers, and sources stay together with their group.
const GROUP_ICON = {
  'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'Canada & Oceania': '🍁', 'Europe': '🇪🇺',
  'Middle East, Asia & Africa': '🌍', 'Cybersecurity': '🛡️', 'Government Cyber Alerts': '🏛️',
  'Power Related News': '⚡', 'Internet & Telecom News': '📶', 'Service Outages': '⚠️', 'Vendor Security Advisories': '🧩', 'Threat Intelligence': '🔬', 'Data Breaches': '🔓',
  'Cyber Breaking News': '⚡', 'Breaking Across the U.S.': '🚨', 'Technology': '💻',
  'Science & Space': '🔭', 'Health': '🩺', 'Business & Markets': '📈', 'Sports': '🏈',
  'Weather & Disasters': '🌪️', 'Gaming': '🎮', 'Custom': '➕'
};
const GROUP_LABEL = { 'United States': 'U.S. News' };
const openGroups = new Set();          // groups the user has opened this session
const groupOf = id => { const a = agency(id); return a ? (a.region || 'Custom') : 'Custom'; };

// Keep each group's sources next to each other in S.enabled (order of first appearance).
function groupedOrder(list) {
  const groups = [];
  for (const id of list) {
    const g = groupOf(id);
    let grp = groups.find(x => x.name === g);
    if (!grp) groups.push(grp = { name: g, ids: [] });
    grp.ids.push(id);
  }
  return groups;
}

function renderEnabled() {
  const list = $('#enabledList');
  list.replaceChildren();
  S.enabled = S.enabled.filter(id => agency(id));
  const groups = groupedOrder(S.enabled);
  const flat = groups.flatMap(g => g.ids);
  if (flat.join() !== S.enabled.join()) { S.enabled = flat; save(); }
  $('#enabledEmpty').style.display = S.enabled.length ? 'none' : 'block';
  $('#enabledCount').textContent = `${S.enabled.length} bar${S.enabled.length === 1 ? '' : 's'} · ${groups.length} group${groups.length === 1 ? '' : 's'}`;

  const commit = () => { S.enabled = groups.flatMap(g => g.ids); renderEnabled(); save(); };

  groups.forEach((g, gi) => {
    const open = openGroups.has(g.name);
    const badIds = g.ids.filter(id => STATUS[id] && !STATUS[id].ok);
    const bad = badIds.length;
    const badNames = badIds.map(id => (agency(id).label || agency(id).name));
    const badTip = badIds.map(id => `${agency(id).label || agency(id).name}: ${STATUS[id].error}`).join('\n');
    const head = el('div', { class: 'grp-head', title: open ? 'Click to fold' : 'Click to show these sources' },
      el('span', { class: 'grp-caret' }, open ? '▾' : '▸'),
      el('span', { class: 'grp-icon' }, GROUP_ICON[g.name] || '📰'),
      el('span', { class: 'grp-name' }, GROUP_LABEL[g.name] || g.name),
      el('span', { class: 'grp-count' }, `${g.ids.length} on`),
      bad ? el('span', { class: 'grp-bad', title: badTip }, bad <= 2 ? `can't reach ${badNames.join(', ')}` : `${bad} sources can't be reached`) : el('span'),
      el('span', { class: 'grp-tools' },
        el('button', { class: 'icon-btn', title: 'Move group up', onclick: e => { e.stopPropagation(); if (gi > 0) { [groups[gi - 1], groups[gi]] = [groups[gi], groups[gi - 1]]; commit(); } } }, '▲'),
        el('button', { class: 'icon-btn', title: 'Move group down', onclick: e => { e.stopPropagation(); if (gi < groups.length - 1) { [groups[gi + 1], groups[gi]] = [groups[gi], groups[gi + 1]]; commit(); } } }, '▼'))
    );
    head.addEventListener('click', () => { open ? openGroups.delete(g.name) : openGroups.add(g.name); renderEnabled(); });
    const li = el('li', { class: `grp${open ? ' open' : ''}` }, head);

    if (open) {
      const inner = el('ul', { class: 'grp-items' });
      g.ids.forEach((id, i) => {
        const a = agency(id);
        const st = STATUS[id];
        const stCls = st ? (st.ok ? 'ok' : 'bad') : '';
        const stTip = st ? (st.ok ? `${st.count} headlines` : `Error: ${st.error}`) : 'Waiting for first update';
        const color = el('input', { type: 'color', class: 'swatch', value: a.color, title: 'Bar color' });
        color.addEventListener('input', () => { setOverride(id, 'color', color.value); renderCatalog(); });
        const label = el('input', { class: 'lbl', value: a.label || a.name, title: 'Name shown on the bar' });
        label.addEventListener('change', () => setOverride(id, 'label', label.value.trim() || a.name));
        const swap = d => { const j = i + d; if (j < 0 || j >= g.ids.length) return; [g.ids[i], g.ids[j]] = [g.ids[j], g.ids[i]]; commit(); };
        const row = el('li', { draggable: 'true', 'data-id': id, class: stCls === 'bad' ? 'bad' : '', title: stCls === 'bad' ? stTip : '' },
          el('span', { class: 'grip', title: 'Drag to reorder within this group' }, '⋮⋮'),
          el('span', { class: `status ${stCls}`, title: stTip }),
          color, label,
          el('span', { class: 'meta', title: a.url }, `${LANGS[a.lang] || a.lang || ''} · ${a.url}`),
          el('button', { class: 'icon-btn', title: 'Move up', onclick: () => swap(-1) }, '▲'),
          el('button', { class: 'icon-btn', title: 'Move down', onclick: () => swap(1) }, '▼'),
          el('button', { class: 'icon-btn', title: 'Remove', onclick: () => toggle(id) }, '✕')
        );
        row.addEventListener('dragstart', () => { dragId = id; row.classList.add('dragging'); });
        row.addEventListener('dragend', () => { dragId = null; row.classList.remove('dragging'); });
        row.addEventListener('dragover', e => { e.preventDefault(); row.classList.add('over'); });
        row.addEventListener('dragleave', () => row.classList.remove('over'));
        row.addEventListener('drop', e => {
          e.preventDefault(); row.classList.remove('over');
          if (!dragId || dragId === id || !g.ids.includes(dragId)) return;
          const from = g.ids.indexOf(dragId);
          g.ids.splice(from, 1);
          g.ids.splice(g.ids.indexOf(id) + (from <= i ? 1 : 0), 0, dragId);
          commit();
        });
        inner.append(row);
      });
      li.append(inner);
    }
    list.append(li);
  });
}

function move(i, d) {
  const j = i + d;
  if (j < 0 || j >= S.enabled.length) return;
  [S.enabled[i], S.enabled[j]] = [S.enabled[j], S.enabled[i]];
  renderEnabled(); save();
}

function setOverride(id, key, value) {
  S.overrides[id] = { ...(S.overrides[id] || {}), [key]: value };
  save();
}

function toggle(id) {
  const i = S.enabled.indexOf(id);
  if (i >= 0) S.enabled.splice(i, 1);
  else {
    const g = groupOf(id);
    const last = S.enabled.map(groupOf).lastIndexOf(g);
    if (last >= 0) S.enabled.splice(last + 1, 0, id); else S.enabled.push(id);
  }
  renderEnabled(); renderCatalog(); save();
}

// ── Catalog ─────────────────────────────────────────────────────
function renderCatalog() {
  const q = $('#search').value.trim().toLowerCase();
  const groups = {};
  for (const a0 of allAgencies()) {
    const a = agency(a0.id);
    if (q && !`${a.name} ${a.region} ${LANGS[a.lang] || ''}`.toLowerCase().includes(q)) continue;
    (groups[a.region] = groups[a.region] || []).push(a);
  }
  const cat = $('#catalog');
  cat.replaceChildren();
  // One-ticker consolidated feeds are listed first.
  const ordered = Object.entries(groups).sort((x, y) => (CONSOLIDATED[y[0]] ? 1 : 0) - (CONSOLIDATED[x[0]] ? 1 : 0));
  for (const [region, list] of ordered) {
    const cards = el('div', { class: 'cards' });
    for (const a of list) {
      const on = S.enabled.includes(a.id);
      const kids = [
        el('span', { class: 'chip' }),
        el('span', { class: 'nm' }, a.name),
        el('span', { class: 'lang', title: LANGS[a.lang] || '' }, (a.lang || 'auto').toUpperCase()),
        el('span', { class: 'check' }, on ? '✓' : '+')
      ];
      if (a.region === 'Custom') {
        kids.splice(3, 0, el('button', {
          class: 'icon-btn', title: 'Delete custom feed',
          onclick: e => { e.stopPropagation(); deleteCustom(a.id); }
        }, '🗑'));
      }
      const t = TESTED[a.id];
      const tCls = t ? ` ${t.state === 'ok' ? 'test-ok' : t.state === 'bad' ? 'test-bad' : 'testing'}` : '';
      const tip = t && t.msg ? `${a.url}\n${t.msg}` : a.url;
      cards.append(el('div', {
        class: `agency${on ? ' on' : ''}${tCls}`, style: `--c:${a.color}`, title: tip, onclick: () => toggle(a.id)
      }, kids));
    }
    const ids = list.map(a => a.id);
    const onCount = ids.filter(id => S.enabled.includes(id)).length;
    const note = CONSOLIDATED[region];
    const head = el('div', { class: 'region-head' },
      el('h3', {}, region),
      note ? el('span', { class: 'region-note' }, note) : null,
      el('span', { class: 'region-count' }, `${onCount} of ${ids.length} on`),
      el('button', { class: 'btn ghost small', disabled: onCount === ids.length ? '' : null, onclick: () => selectGroup(ids, true) }, 'Select all'),
      el('button', { class: 'btn ghost small', disabled: onCount === 0 ? '' : null, onclick: () => selectGroup(ids, false) }, 'Deselect all'));
    cat.append(el('div', { class: 'region' }, head, cards));
  }
  if (!cat.children.length) cat.append(el('div', { class: 'empty' }, 'No agencies match your search.'));
}

// Turn a whole group on or off (keeps the order of what's already on).
function selectGroup(ids, on) {
  if (on) ids.forEach(id => { if (!S.enabled.includes(id)) S.enabled.push(id); });
  else S.enabled = S.enabled.filter(id => !ids.includes(id));
  renderEnabled(); renderCatalog(); save();
}

function deleteCustom(id) {
  S.custom = S.custom.filter(c => c.id !== id);
  S.enabled = S.enabled.filter(x => x !== id);
  delete S.overrides[id];
  renderEnabled(); renderCatalog(); save();
}

$('#search').addEventListener('input', renderCatalog);

// Test every agency (6 at a time) and outline each card green or red.
$('#testAll').addEventListener('click', async () => {
  const btn = $('#testAll'), out = $('#testAllResult');
  btn.disabled = true;
  const list = allAgencies();
  list.forEach(a => { TESTED[a.id] = { state: 'testing' }; });
  renderCatalog();
  let i = 0, ok = 0, bad = 0;
  async function worker() {
    while (i < list.length) {
      const a = list[i++];
      const r = await window.news.testFeed(a.url);
      TESTED[a.id] = r.ok && r.count ? { state: 'ok', msg: `✓ ${r.count} headlines${r.backup ? ' (its own feed failed — using Google News headlines from the site)' : ''}` } : { state: 'bad', msg: `✕ ${r.error || 'no headlines'}` };
      r.ok && r.count ? ok++ : bad++;
      out.className = 'test-result';
      out.textContent = `Testing… ${ok + bad} of ${list.length}`;
      renderCatalog();
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  out.className = `test-result ${bad ? 'bad' : 'ok'}`;
  out.textContent = `${ok} working, ${bad} not responding. Green outline = working, red = not working (hover a card for the reason).`;
  btn.disabled = false;
});

// ── Custom feed ─────────────────────────────────────────────────
async function testUrl(url, out) {
  out.className = 'test-result'; out.textContent = 'Testing…';
  const r = await window.news.testFeed(url);
  if (r.ok) {
    out.className = 'test-result ok';
    out.textContent = `✓ ${r.title || 'Feed'} — ${r.count} headlines${r.language ? ` (${r.language})` : ''}. Latest: “${r.sample[0] || ''}”`;
  } else {
    out.className = 'test-result bad';
    out.textContent = `✕ ${r.error}`;
  }
  return r;
}

$('#cTest').addEventListener('click', () => {
  const url = $('#cUrl').value.trim();
  if (url) testUrl(url, $('#cResult'));
});

$('#cAdd').addEventListener('click', async () => {
  const url = $('#cUrl').value.trim();
  const out = $('#cResult');
  if (!/^https?:\/\//i.test(url)) { out.className = 'test-result bad'; out.textContent = 'Enter a feed address starting with http:// or https://'; return; }
  const r = await testUrl(url, out);
  if (!r.ok) return;
  let lang = $('#cLang').value;
  if (lang === 'auto' && r.language && LANGS[r.language]) lang = r.language;
  const name = $('#cName').value.trim() || r.title || 'Custom feed';
  const id = 'custom-' + Date.now().toString(36);
  S.custom.push({ id, name, url, lang, color: $('#cColor').value });
  S.enabled.push(id);
  $('#cName').value = ''; $('#cUrl').value = '';
  out.textContent += ' — added.';
  renderEnabled(); renderCatalog(); save();
});

// ── Display & updates ───────────────────────────────────────────
const fmt = {
  barHeight: v => `${v}px`, fontSize: v => `${v}px`, speed: v => `${v} px/s`, gap: v => `${v}px`,
  opacity: v => `${Math.round(v * 100)}%`, newMinutes: v => (+v ? `${v} min` : 'off (30 min when showing only NEW)'),
  chimeVolume: v => `${Math.round(v * 100)}%`,
  maxHeightPct: v => `${v}%`,
  glowPasses: v => (+v ? `${v} pass${+v === 1 ? '' : 'es'}` : 'off'),
  refreshMinutes: v => `${v} min`, maxPerAgency: v => `${v}`, maxAgeHours: v => (+v ? `${v} h` : 'no limit')
};

function bindRange(id, section) {
  const input = $('#' + id);
  input.value = S[section][id];
  $(`#${id}V`).textContent = fmt[id](input.value);
  input.addEventListener('input', () => {
    S[section][id] = Number(input.value);
    $(`#${id}V`).textContent = fmt[id](input.value);
    save();
  });
}

function bindCheck(id, get, set) {
  const input = $('#' + id);
  input.checked = !!get();
  input.addEventListener('change', () => { set(input.checked); save(); });
}

// Monitor, screen share and click-through only apply to tickers docked at the
// top or bottom of a screen — dim them when the tickers are in a window.
function dimForWindowMode() {
  const win = S.display.position === 'window';
  const parts = [$('#monitor').closest('.field'), $('#maxHeightPct').closest('.field'), $('#clickThrough').closest('label')];
  for (const p of parts) {
    if (!p) continue;
    p.classList.toggle('dimmed', win);
    p.title = win ? 'Not used when the tickers are in a window' : '';
    p.querySelectorAll('input, select').forEach(i => { i.disabled = win; });
  }
}

function initDisplay(displays) {
  $$('#position button').forEach(b => {
    b.classList.toggle('on', b.dataset.v === S.display.position);
    b.addEventListener('click', () => {
      S.display.position = b.dataset.v;
      $$('#position button').forEach(x => x.classList.toggle('on', x === b));
      dimForWindowMode();
      save();
    });
  });
  const mon = $('#monitor');
  mon.replaceChildren(...displays.map(d => el('option', { value: d.index }, d.label)));
  mon.value = Math.min(S.display.monitor, displays.length - 1);
  mon.addEventListener('change', () => { S.display.monitor = Number(mon.value); save(); });

  ['barHeight', 'fontSize', 'speed', 'opacity', 'gap', 'newMinutes', 'maxHeightPct'].forEach(id => bindRange(id, 'display'));
  dimForWindowMode();
  ['refreshMinutes', 'maxPerAgency', 'maxAgeHours'].forEach(id => bindRange(id, 'updates'));
  ['onlyNew', 'showLabel', 'showTime', 'pauseOnHover', 'clickThrough'].forEach(id =>
    bindCheck(id, () => S.display[id], v => { S.display[id] = v; }));
  bindCheck('alwaysOnTop', () => S.display.alwaysOnTop !== false, v => { S.display.alwaysOnTop = v; });
  bindCheck('startWithWindows', () => S.startWithWindows, v => { S.startWithWindows = v; });

  $('#refreshNow').addEventListener('click', () => window.news.refresh());
}

// ── Translation ─────────────────────────────────────────────────
function initTranslation() {
  bindCheck('trEnabled', () => S.translation.enabled, v => { S.translation.enabled = v; });
  bindCheck('trHover', () => S.translation.showOriginalOnHover, v => { S.translation.showOriginalOnHover = v; });

  const tgt = $('#trTarget');
  tgt.value = S.translation.target;
  tgt.addEventListener('change', () => { S.translation.target = tgt.value; save(); });

  const prov = $('#trProvider');
  const showProv = () => $$('.prov').forEach(p => p.classList.toggle('show', p.classList.contains(`prov-${prov.value}`)));
  prov.value = S.translation.provider;
  showProv();
  prov.addEventListener('change', () => { S.translation.provider = prov.value; showProv(); save(); });

  ['mymemoryEmail', 'libreUrl', 'libreKey', 'deeplKey'].forEach(id => {
    const i = $('#' + id);
    i.value = S.translation[id] || '';
    i.addEventListener('change', () => { S.translation[id] = i.value.trim(); save(); });
  });

  $('#trTest').addEventListener('click', async () => {
    const out = $('#trResult');
    out.className = 'test-result'; out.textContent = 'Translating “Guten Morgen, die Nachrichten des Tages”…';
    const r = await window.news.testTranslate(S.translation);
    out.className = `test-result ${r.ok ? 'ok' : 'bad'}`;
    out.textContent = r.ok ? `✓ ${r.text}` : `✕ ${r.error}`;
  });
}

// ── Alerts ──────────────────────────────────────────────────────
function initAlerts() {
  const lines = v => v.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  $('#keywords').value = (S.alerts.keywords || []).join('\n');
  $('#keywords').addEventListener('change', () => { S.alerts.keywords = lines($('#keywords').value); save(); });
  $('#breakingWords').value = (S.alerts.breakingWords || []).join('\n');
  $('#breakingWords').addEventListener('change', () => { S.alerts.breakingWords = lines($('#breakingWords').value); save(); });

  ['highlight', 'notifyKeywords', 'breaking', 'breakingFront', 'notifyBreaking', 'chime', 'quietHours'].forEach(id =>
    bindCheck(id, () => S.alerts[id], v => { S.alerts[id] = v; }));
  bindRange('chimeVolume', 'alerts');
  bindRange('glowPasses', 'alerts');
  ['quietFrom', 'quietTo'].forEach(id => {
    $('#' + id).value = S.alerts[id];
    $('#' + id).addEventListener('change', () => { S.alerts[id] = $('#' + id).value; save(); });
  });

  const out = $('#alertTestResult');
  // Save right away so the preview plays the sound that is picked.
  const saveNow = async () => { clearTimeout(saveTimer); S = await window.news.saveSettings(S); $('#saveState').textContent = 'All changes saved'; $('#saveState').classList.remove('dirty'); };
  const play = async kind => {
    await saveNow();
    const r = await window.news.testAlert(kind);
    out.className = 'test-result';
    out.textContent = r.off ? 'The chime is switched off — turn on “Play a chime” to hear it'
      : r.quiet ? 'Played (it is quiet hours now, so real alerts stay silent until they end)' : '';
  };
  $('#chimeSound').value = S.alerts.chimeSound || 'bell';
  $('#chimeSound').addEventListener('change', () => { S.alerts.chimeSound = $('#chimeSound').value; play('chime'); });
  $('#testChime').addEventListener('click', () => play('chime'));
  $('#testChimeBreaking').addEventListener('click', () => play('chime-breaking'));
  $$('#notifyStyle button').forEach(b => {
    b.classList.toggle('on', b.dataset.v === (S.alerts.notifyStyle || 'popup'));
    b.addEventListener('click', () => {
      S.alerts.notifyStyle = b.dataset.v;
      $$('#notifyStyle button').forEach(x => x.classList.toggle('on', x === b));
      save();
    });
  });
  $('#testNotify').addEventListener('click', async () => {
    const nout = $('#notifyResult');
    nout.className = 'test-result'; nout.textContent = 'Sending…';
    await new Promise(r => setTimeout(r, 400));          // let a just-changed style save first
    const r = await window.news.testAlert('notify');
    const msgs = [];
    if (r.style !== 'windows') msgs.push('Pop-up shown at the bottom-right of your screen.');
    if (r.windows) {
      if (r.windows.blocked) msgs.push(r.windows.error);
      else if (!r.windows.ok) msgs.push(`Windows refused the notification: ${r.windows.error}`);
      else if (r.windows.unconfirmed) msgs.push('Sent to Windows, but Windows did not confirm it was shown — check that Do Not Disturb is off and TickerSec is allowed in Windows Settings → System → Notifications.');
      else msgs.push('Windows notification shown. If you did not see it, Do Not Disturb or Focus may be hiding it — look in the notification center (Win + N).');
    }
    const bad = r.windows && !r.windows.ok;
    nout.className = `test-result ${bad ? 'bad' : 'ok'}`;
    nout.textContent = msgs.join(' ');
    if (r.windows && r.windows.blocked) {
      nout.append(' ', el('button', { class: 'btn ghost small', onclick: () => window.news.openNotifySettings() }, 'Open Windows notification settings'));
    }
  });
}

// ── App updates ─────────────────────────────────────────────────
function showUpdate(st) {
  $('#updVersion').textContent = `Installed: ${st.current}`;
  const out = $('#updStatus');
  const msg = {
    idle: '',
    checking: 'Checking…',
    current: `You have the latest version (${st.current}).`,
    available: `Version ${st.version} is available${st.notes ? ' — ' + st.notes : ''}.`,
    downloading: `Downloading update… ${st.progress || 0}% — the app will close, update and reopen.`,
    signin: `${st.error ? st.error.charAt(0).toUpperCase() + st.error.slice(1) : 'Couldn’t reach the update folder'} — TickerSec will try again later.`,
    error: st.error || 'Something went wrong.'
  }[st.status] || '';
  out.className = `test-result ${st.status === 'error' || st.status === 'signin' ? 'bad' : st.status === 'available' || st.status === 'current' ? 'ok' : ''}`;
  out.textContent = msg;
  $('#updInstall').style.display = st.status === 'available' ? '' : 'none';
  $('#updInstall').textContent = st.version ? `Install ${st.version}` : 'Install update';
}

async function initUpdates() {
  const st0 = await window.news.getUpdateState();
  bindCheck('autoCheck', () => S.updates.autoCheck, v => { S.updates.autoCheck = v; });
  $('#updCheck').addEventListener('click', async () => { await new Promise(r => setTimeout(r, 400)); window.news.checkUpdate(); });
  $('#updInstall').addEventListener('click', () => window.news.installUpdate());
  window.news.onUpdateState(showUpdate);
  showUpdate(st0);
}

// ── Preview buttons ─────────────────────────────────────────────
function initDemo() {
  const out = $('#demoResult');
  $$('.demo').forEach(b => b.addEventListener('click', async () => {
    const k = b.dataset.k;
    const r = await window.news.demo(k);
    let msg = '', bad = false;
    if (!r.ok) { msg = r.error; bad = true; }
    else if (r.off) { msg = 'The chime is switched off — turn on “Play a chime” below to hear it.'; }
    else if (r.windows) {
      if (!r.windows.ok) { msg = `Windows refused the notification: ${r.windows.error}`; bad = true; }
      else if (r.windows.unconfirmed) msg = 'Sent to Windows, but Windows did not confirm it — check that Do Not Disturb is off and TickerSec is allowed in Windows Settings → System → Notifications.';
      else msg = 'Windows notification sent. Not seeing it? Do Not Disturb may be hiding it — check the notification center (Win + N).';
    }
    else if (r.bar) msg = `Watch the ${r.bar} bar — the sample slides in from the right.${r.hidden ? ' (Your tickers are hidden — press Ctrl + Alt + N to show them.)' : ''}${r.chimeOff ? ' The chime is off, so no sound.' : ''}`;
    else if (k.startsWith('popup')) msg = 'Look at the bottom-right corner of your screen.';
    else if (r.quiet) msg = 'Played — note it is quiet hours, so real alerts stay silent right now.';
    out.className = `test-result ${bad ? 'bad' : 'ok'}`;
    out.textContent = msg;
  }));
}

// ── Start ───────────────────────────────────────────────────────
(async () => {
  const data = await window.news.getSettings();
  S = data.settings; PRESETS = data.presets; STATUS = data.status || {}; VERSION = data.version;
  showMaster(S.active !== false);
  $('.brand-sub').textContent = `Breaking News feeds · v${data.version}`;

  $$('.lang-select').forEach(sel => {
    const opts = Object.entries(LANGS).filter(([k]) => !(sel.classList.contains('no-auto') && k === 'auto'));
    sel.replaceChildren(...opts.map(([k, v]) => el('option', { value: k }, v)));
  });

  renderEnabled();
  renderCatalog();
  initDisplay(data.displays);
  initTranslation();
  initAlerts();
  initDemo();
  initUpdates();
  initStatus();
  pushPreview();

  window.news.onStatus(st => { STATUS = st; renderEnabled(); renderStatus(); });
  window.news.onSettingsChanged(next => { S = next; showMaster(S.active !== false); $('#onlyNew').checked = !!S.display.onlyNew; $('#alwaysOnTop').checked = S.display.alwaysOnTop !== false; });
})();
