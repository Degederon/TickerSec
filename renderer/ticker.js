const WARM = new URLSearchParams(location.search).has('warm');
// Smooth, seamless scrolling tickers — one per agency.

const root = document.documentElement;
const barsEl = document.getElementById('bars');

let cfg = { display: { speed: 90, showTime: true, newMinutes: 30, pauseOnHover: true }, paused: false };
const bars = new Map();   // id -> Bar
const glowed = new Map(); // headline -> passes it has glowed on
const keyOf = it => it.link || it.title;

function escapeRe(x) { return x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Headline text with the matched keywords wrapped in <mark>.
function titleWithMarks(title, keywords) {
  const t = el('span', 't');
  if (!keywords || !keywords.length) { t.textContent = title; return t; }
  const parts = keywords.map(k => k.endsWith('*') ? escapeRe(k.slice(0, -1)) + '[\\p{L}\\p{N}]*' : escapeRe(k));
  const re = new RegExp(`(${parts.join('|')})`, 'giu');
  let last = 0;
  for (const m of title.matchAll(re)) {
    if (m.index > last) t.append(title.slice(last, m.index));
    t.append(el('mark', '', m[0]));
    last = m.index + m[0].length;
  }
  t.append(title.slice(last));
  return t;
}

// Alert chimes made with Web Audio (no sound files needed). Five sounds, each
// with a calmer "new alert" version and a more urgent "breaking" version.
// A note: [frequency Hz, start s, length s, wave, loudness 0–1, glide-to Hz]
const CHIMES = {
  bell: {      // Soft bell — two gentle notes (the original chime)
    normal:   [[784, 0, .9, 'sine', 1], [1175, .16, .9, 'sine', 1]],
    breaking: [[880, 0, .9, 'sine', 1], [660, .16, .9, 'sine', 1], [880, .32, .9, 'sine', 1]]
  },
  glass: {     // Glass ping — a bright ping with a soft echo
    normal:   [[1568, 0, 1.4, 'sine', .9], [3136, 0, .5, 'sine', .25], [1568, .28, 1, 'sine', .3]],
    breaking: [[1760, 0, 1.2, 'sine', .9], [3520, 0, .4, 'sine', .25], [1760, .18, 1, 'sine', .6], [1760, .36, 1, 'sine', .35]]
  },
  marimba: {   // Marimba — warm wooden notes, rising (falling for breaking)
    normal:   [[523, 0, .35, 'sine', 1], [659, .11, .35, 'sine', 1], [784, .22, .5, 'sine', 1]],
    breaking: [[1047, 0, .3, 'sine', 1], [784, .1, .3, 'sine', 1], [659, .2, .3, 'sine', 1], [523, .3, .5, 'sine', 1]]
  },
  sonar: {     // Sonar blip — a cyber "ping" that sweeps down, with echoes
    normal:   [[1400, 0, .5, 'sine', 1, 900], [1400, .35, .4, 'sine', .35, 900]],
    breaking: [[1600, 0, .4, 'sine', 1, 1000], [1600, .22, .4, 'sine', .8, 1000], [1600, .44, .5, 'sine', .45, 1000]]
  },
  newsflash: { // News flash — crisp newsroom-style alert tones
    normal:   [[988, 0, .12, 'triangle', 1.1], [988, .16, .12, 'triangle', 1.1], [1319, .32, .45, 'triangle', 1.1]],
    breaking: [[1319, 0, .1, 'square', .6], [1319, .13, .1, 'square', .6], [1319, .26, .1, 'square', .6], [1760, .42, .5, 'triangle', 1.1]]
  }
};
let audioCtx = null;
function chime({ volume = 0.5, breaking = false, sound = 'bell' } = {}) {
  try {
    audioCtx = audioCtx || new AudioContext();
    const now = audioCtx.currentTime + 0.02;
    const set = CHIMES[sound] || CHIMES.bell;
    // Square waves are harsh: round them off.
    const soften = audioCtx.createBiquadFilter();
    soften.type = 'lowpass'; soften.frequency.value = 3500;
    soften.connect(audioCtx.destination);
    for (const [f, at, len, type, loud, glide] of (breaking ? set.breaking : set.normal)) {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, now + at);
      if (glide) o.frequency.exponentialRampToValueAtTime(glide, now + at + len);
      const t0 = now + at;
      g.gain.setValueAtTime(0, t0);
      // Squared curve so the slider sounds even: 10% is a whisper, 100% is clear.
      g.gain.linearRampToValueAtTime(0.4 * loud * volume * volume, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
      o.connect(g).connect(soften);
      o.start(t0); o.stop(t0 + len + 0.05);
    }
  } catch {}
}

function ago(ms) {
  if (!ms) return '';
  const m = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h}h` : `${Math.round(h / 24)}d`;
}

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt !== undefined) e.textContent = txt;
  return e;
}

class Bar {
  constructor(data) {
    this.id = data.id;
    this.items = [];
    this.pending = null;
    this.x = 0;
    this.runW = 0;
    this.hover = false;

    this.root = el('div', 'bar');
    this.label = el('div', 'label');
    this.viewport = el('div', 'viewport');
    this.track = el('div', 'track');
    this.viewport.appendChild(this.track);
    this.root.append(this.label, this.viewport);

    this.root.addEventListener('mouseenter', () => { this.hover = true; });
    this.root.addEventListener('mouseleave', () => { this.hover = false; });
    this.root.addEventListener('contextmenu', e => { e.preventDefault(); window.news.openSettings(); });
    this.label.addEventListener('click', () => { if (this.data && this.data.cat && !this.data.fixed) window.news.toggleCategory(this.data.cat); });
    // Open on the button press itself: the tickers never take focus, and
    // Windows can stop sending them the button release after a while (e.g.
    // after sleep or a locked screen), so a normal "click" never happens.
    // The click event stays as a backup; each headline opens only once.
    const open = (e, how) => {
      const it = e.target.closest('.item');
      if (!it) { window.news.diag && window.news.diag(`${how} – not on a headline`); return; }
      if (!it.dataset.link) {   // no address at all: search for the headline instead
        it.dataset.link = `https://www.google.com/search?q=${encodeURIComponent(it.textContent.trim().slice(0, 200))}`;
        window.news.diag && window.news.diag(`${how} – headline had no link, searching for it`);
      }
      if (Date.now() - (this.openedAt || 0) < 1200 && this.openedLink === it.dataset.link) return;
      this.openedAt = Date.now(); this.openedLink = it.dataset.link;
      window.news.openLink(it.dataset.link);
    };
    this.track.addEventListener('mousedown', e => { if (e.button === 0) open(e, 'press'); });
    this.track.addEventListener('click', e => open(e, 'click'));

    this.update(data, true);
  }

  update(data, first = false) {
    this.data = data;
    this.all = data.items || [];
    this.root.style.setProperty('--c', data.color || '#4fa3ff');
    this.label.replaceChildren(el('span', 'dot'), el('span', '', data.name));
    if (data.translated) {
      const t = el('span', 'tr', `${(data.lang || '').toUpperCase()}→${(cfg.translation?.target || 'en').toUpperCase()}`);
      t.title = 'Headlines translated';
      this.label.appendChild(t);
    }
    if (cfg.display.onlyNew) this.label.appendChild(el('span', 'tr', 'NEW only'));
    this.refreshView(first);
  }

  // Headlines to scroll right now, after the "only NEW" filter.
  visible() {
    const d = cfg.display;
    if (!d.onlyNew) return this.all;
    const win = (d.newMinutes > 0 ? d.newMinutes : 30) * 60000;
    return this.all.filter(i => i.date && Date.now() - i.date < win);
  }

  showMessage(text, isError) {
    this.items = [];
    this.pending = null;
    this.runW = 0;
    this.track.style.transform = 'none';
    this.track.replaceChildren(el('div', isError ? 'msg err' : 'msg', text));
  }

  refreshView(force = false) {
    const vis = this.visible();
    if (!vis.length) {
      const d = cfg.display, data = this.data;
      if (this.all.length && d.onlyNew) {
        const mins = d.newMinutes > 0 ? d.newMinutes : 30;
        this.showMessage(`No new ${data.title || data.name} headlines in the last ${mins} minutes — waiting for fresh news`, false);
      } else if (data.error) {
        this.showMessage(`Couldn't reach ${data.title || data.name} (${data.error}) — will retry`, true);
      } else if (data.loaded) {
        this.showMessage(`${data.title || data.name} has no headlines right now — checking again at the next update`, false);
      } else {
        this.showMessage('Loading headlines…', false);
      }
      return;
    }
    if (force || !this.items.length) {
      this.items = vis;
      this.pending = null;
      this.render();
      this.x = WARM && !this.warmed ? 0 : (this.viewport.clientWidth || window.innerWidth);   // slide in from the right (rebuilt window: start full)
      this.warmed = true;
    } else {
      this.pending = vis;   // swapped in at the next loop so nothing jumps
    }
  }

  buildRun() {
    const run = el('div', 'run');
    const d = cfg.display;
    const a = cfg.alerts || {};
    for (const it of this.items) {
      const span = el('span', 'item');
      span.dataset.link = it.link || '';
      if (it.original && cfg.translation?.showOriginalOnHover) span.title = it.original;
      const al = it.alert;
      if (al && al.breaking) span.classList.add('brk');
      if (al && al.keywords.length && a.highlight) span.classList.add('kw');
      if (it.flash && (glowed.get(keyOf(it)) || 0) < (a.glowPasses ?? 3)) span.classList.add('glow', al && al.breaking ? 'glow-red' : 'glow-gold');

      if (al && al.breaking) span.appendChild(el('span', 'brk-tag', 'BREAKING'));
      else if (it.date && d.newMinutes > 0 && Date.now() - it.date < d.newMinutes * 60000) {
        span.appendChild(el('span', 'new', 'NEW'));
      }
      if (it.source) {
        const chip = el('span', 'src', it.source.name);
        chip.style.setProperty('--sc', it.source.color || '#888');
        span.appendChild(chip);
      }
      span.appendChild(titleWithMarks(it.title, al && a.highlight ? al.keywords : []));
      if (d.showTime && it.date) span.appendChild(el('span', 'age', ago(it.date)));
      run.appendChild(span);
      run.appendChild(el('span', 'sep', '◆'));
    }
    return run;
  }

  render() {
    const first = this.buildRun();
    this.track.replaceChildren(first);
    const w = first.getBoundingClientRect().width;
    if (!this.root.isConnected || w < 20) {
      // Not on screen yet, so it can't be measured: try again next frame.
      // (Measuring 0 here used to make ~1,600 copies and run out of memory.)
      this.runW = 0;
      this.needsRender = true;
      return;
    }
    this.needsRender = false;
    this.runW = w;
    // Enough copies to always cover the screen width (never more than 4).
    const copies = Math.min(4, Math.ceil((this.viewport.clientWidth || window.innerWidth) / this.runW) + 1);
    for (let i = 0; i < copies; i++) this.track.appendChild(first.cloneNode(true));
  }

  tick(dt) {
    if (this.needsRender && this.root.isConnected && this.items.length) {
      this.render();
      if (this.runW) this.x = WARM && !this.warmedDraw ? 0 : (this.viewport.clientWidth || window.innerWidth);   // rebuilt window: start full
      this.warmedDraw = true;
    }
    if (!this.runW) return;
    const stop = cfg.paused || (this.hover && cfg.display.pauseOnHover && !cfg.display.clickThrough);
    if (!stop) this.x -= (cfg.display.speed || 90) * dt;
    if (this.x <= -this.runW) {
      this.x += this.runW;
      for (const it of this.items) if (it.flash) glowed.set(keyOf(it), (glowed.get(keyOf(it)) || 0) + 1);
      // Re-apply the filter each loop so headlines that stop being NEW drop off.
      const next = this.visible();
      if (!next.length) { this.refreshView(); return; }
      this.items = next; this.pending = null;
      this.render();                          // also refreshes "12m" ages
      if (this.x <= -this.runW) this.x = 0;
    }
    this.track.style.transform = `translate3d(${Math.round(this.x * 2) / 2}px,0,0)`;
  }
}

function applyConfig(c) {
  cfg = c;
  const d = c.display;
  root.style.setProperty('--bar-h', `${d.barHeight}px`);
  root.style.setProperty('--gap', `${d.gap}px`);
  root.style.setProperty('--font', `${d.fontSize}px`);
  root.style.setProperty('--alpha', d.opacity);
  document.body.classList.toggle('hide-label', !d.showLabel);
  document.body.classList.toggle('click-through', !!d.clickThrough && d.position !== 'window');
  document.body.classList.toggle('windowed', d.position === 'window');
  const restart = prevOnlyNew !== !!d.onlyNew;
  prevOnlyNew = !!d.onlyNew;
  for (const b of bars.values()) {
    if (!b.data) continue;
    if (restart) b.update(b.data, true);
    else { b.update(b.data, false); if (b.items.length) b.render(); }   // keep scroll position
  }
}
let prevOnlyNew = null;

const headers = new Map(); // category -> title strip element

function headerEl(row) {
  let h = headers.get(row.cat);
  if (!h) {
    h = el('div', 'cat-head');
    h.addEventListener('click', () => window.news.toggleCategory(h.dataset.cat));
    h.addEventListener('contextmenu', e => { e.preventDefault(); window.news.openSettings(); });
    headers.set(row.cat, h);
  }
  h.dataset.cat = row.cat;
  h.style.setProperty('--c', row.color);
  h.classList.toggle('collapsed', !!row.collapsed);
  h.title = row.collapsed ? 'Click to show each source on its own bar' : 'Click to combine into one bar';
  h.replaceChildren(
    el('span', 'chev', row.collapsed ? '▸' : '▾'),
    el('span', 'icon', row.icon),
    el('span', 'name', row.title || row.cat),
    el('span', 'count', `${row.count} source${row.count === 1 ? '' : 's'}${row.collapsed ? ' · combined' : ''}`)
  );
  return h;
}

function applyNews(view) {
  const rows = view.rows || [];
  const barIds = rows.filter(r => r.kind === 'bar').map(r => r.bar.id);
  const cats = rows.filter(r => r.kind === 'header').map(r => r.cat);
  for (const [id, b] of bars) if (!barIds.includes(id)) { b.root.remove(); bars.delete(id); }
  for (const [cat, h] of headers) if (!cats.includes(cat)) { h.remove(); headers.delete(cat); }
  rows.forEach(r => {
    if (r.kind === 'header') { barsEl.appendChild(headerEl(r)); return; }
    const data = r.bar;
    let b = bars.get(data.id);
    if (b) b.update(data, !!(view.force && view.force.includes(data.id)));
    else { b = new Bar(data); bars.set(data.id, b); }
    b.root.classList.toggle('in-cat', !!r.cat);
    b.root.classList.toggle('merged', !!r.merged);
    b.root.classList.toggle('fixed', !!(r.bar && r.bar.fixed));
    barsEl.appendChild(b.root);   // keeps display order
  });
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  for (const b of bars.values()) b.tick(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Forget glow counts for headlines no longer on any ticker (keeps memory flat).
setInterval(() => {
  const live = new Set();
  for (const b of bars.values()) for (const it of (b.all || [])) live.add(keyOf(it));
  for (const k of glowed.keys()) if (!live.has(k)) glowed.delete(k);
}, 10 * 60e3);

// Bars waiting for NEW headlines check again every 30 seconds.
setInterval(() => { for (const b of bars.values()) if (!b.items.length && b.data) b.refreshView(); }, 30000);

window.addEventListener('resize', () => { for (const b of bars.values()) if (b.items.length) b.render(); });
window.news.onConfig(applyConfig);
window.news.onNews(applyNews);
window.news.onChime(chime);
window.news.ready();

// ── Input health: count what the ticker window actually receives ──
// (sent once a minute while the mouse is used over the tickers)
const inputCount = { move: 0, enter: 0, down: 0, up: 0, click: 0 };
window.__lastMouse = null;
document.addEventListener('mousemove', e => { inputCount.move++; window.__lastMouse = { x: e.clientX, y: e.clientY }; }, true);
document.addEventListener('mouseover', () => { inputCount.enter++; }, true);
document.addEventListener('mousedown', () => { inputCount.down++; lastRealDown = Date.now(); }, true);
// Called by TickerSec with a press it took straight from Windows (see main.js).
// If the page already got this press, do nothing; otherwise return the headline under it.
let lastRealDown = 0;
window.__pressAt = (x, y) => {
  if (Date.now() - lastRealDown < 800) return null;
  const e = document.elementFromPoint(x, y);
  const it = e && e.closest('.item');
  if (!it) return null;
  if (!it.dataset.link) it.dataset.link = `https://www.google.com/search?q=${encodeURIComponent(it.textContent.trim().slice(0, 200))}`;
  return { link: it.dataset.link };
};
document.addEventListener('mouseup', () => { inputCount.up++; }, true);
document.addEventListener('click', () => { inputCount.click++; }, true);
setInterval(() => {
  if (inputCount.move || inputCount.down) window.news.diagInput && window.news.diagInput({ ...inputCount });
  for (const k of Object.keys(inputCount)) inputCount[k] = 0;
}, 60000);
