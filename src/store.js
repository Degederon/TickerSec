// Settings are kept in settings.json inside the app's user-data folder
// (on Windows: %APPDATA%\TickerSec\settings.json).

const fs = require('fs');
const path = require('path');

const DEFAULTS = {
  // Which agencies are on, in display order (top bar first).
  enabled: ['bbc', 'npr', 'aljazeera'],
  // Per-agency overrides: { [id]: { color, label } }
  overrides: {},
  // User-added feeds: [{ id, name, url, lang, color, region: 'Custom' }]
  custom: [],

  display: {
    position: 'bottom',      // 'top' | 'bottom' | 'window' (a normal window you can move and resize)
    maxHeightPct: 50,        // docked tickers use at most this much of the screen height, then scroll
    windowBounds: null,      // remembered size/place of the ticker window
    monitor: 0,              // index in the monitor list
    barHeight: 38,
    gap: 2,
    fontSize: 17,
    speed: 90,               // pixels per second
    opacity: 0.82,           // bar background opacity
    showLabel: true,
    showTime: true,          // "12m ago" after each headline
    newMinutes: 30,          // headlines younger than this get a NEW tag
    onlyNew: false,          // true = scroll only headlines that are NEW
    collapsed: {},           // { 'Cybersecurity': true } = category shown as one combined bar
    clickThrough: false,     // true = bars ignore the mouse
    alwaysOnTop: false,      // true = tickers stay above every window
    pauseOnHover: true
  },

  updates: {
    refreshMinutes: 5,
    maxPerAgency: 15,
    maxAgeHours: 24,         // 0 = no limit
    autoCheck: true,         // check for app updates by itself
    checkHours: 3
  },

  translation: {
    enabled: false,
    target: 'en',
    provider: 'google',      // google | mymemory | libre | deepl
    showOriginalOnHover: true,
    mymemoryEmail: '',
    libreUrl: 'https://libretranslate.com',
    libreKey: '',
    deeplKey: ''
  },

  alerts: {
    keywords: [],            // words or phrases, e.g. "Steelers", "Oak Creek", "hurrican*"
    highlight: true,         // gold highlight on matching headlines
    glowPasses: 3,           // brand-new alert headlines glow on this many passes (0 = off)
    notifyKeywords: true,    // alert pop-up for keyword headlines
    notifyStyle: 'popup',    // popup (TickerSec pop-up) | windows | both
    breaking: true,          // detect BREAKING / LIVE / URGENT headlines
    breakingWords: ['BREAKING', 'LIVE', 'WATCH LIVE', 'URGENT', 'JUST IN', 'DEVELOPING'],
    breakingFront: true,     // move breaking headlines to the front of their bar
    notifyBreaking: false,   // Windows notification for breaking headlines
    chime: false,            // soft sound when a new alert arrives
    chimeVolume: 0.5,
    chimeSound: 'bell',      // bell | glass | marimba | sonar | newsflash
    quietHours: true,
    quietFrom: '22:00',
    quietTo: '07:00'
  },

  active: true,              // master switch: false = TickerSec is off (no tickers, fetching or alerts)

  startWithWindows: false
};

function merge(base, extra) {
  if (Array.isArray(base)) return Array.isArray(extra) ? extra : base;
  if (base && typeof base === 'object') {
    const out = { ...base };
    for (const k of Object.keys(extra || {})) {
      out[k] = k in base ? merge(base[k], extra[k]) : extra[k];
    }
    return out;
  }
  return extra === undefined ? base : extra;
}

class Store {
  constructor(dir) {
    this.file = path.join(dir, 'settings.json');
    const saved = this.read();
    // Older versions had an on/off "Glow once" switch: off stays off.
    if (saved.alerts && saved.alerts.glow === false && saved.alerts.glowPasses === undefined) saved.alerts.glowPasses = 0;
    if (saved.alerts) delete saved.alerts.glow;
    // 2.7.3: the Reddit sources were replaced by news sources — swap them in place.
    const SWAP = { 'po-reddit': ['po-local', 'po-counts'], 'nt-reddit': ['nt-dd'] };
    if (Array.isArray(saved.enabled) && saved.enabled.some(id => SWAP[id])) {
      saved.enabled = saved.enabled.flatMap(id => SWAP[id] || [id]).filter((id, i, a) => a.indexOf(id) === i);
    }
    this.data = merge(DEFAULTS, saved);
  }
  read() {
    try { return JSON.parse(fs.readFileSync(this.file, 'utf8')); } catch { return {}; }
  }
  save(next) {
    this.data = merge(DEFAULTS, next);
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
    return this.data;
  }
  get() { return this.data; }
}

module.exports = { Store, DEFAULTS };
