// Live preview for Settings: two sample bars drawn with the real ticker styles.
// Settings sends the current display/alert settings with postMessage.
const SAMPLE = [
  { name: 'Breaking Across the U.S.', color: '#ef4444', items: [
    { t: 'Firefighters contain warehouse blaze near downtown', m: 3, glow: 'red', brk: true },
    { t: 'Highway reopens after overnight crash cleanup', m: 26 },
    { t: 'Power restored to most homes after storm', m: 75 },
    { t: 'City council approves new emergency alert system', m: 140 }] },
  { name: 'BBC News', color: '#bb1919', items: [
    { t: 'Global markets steady ahead of central bank decision', m: 8, glow: 'gold' },
    { t: 'Scientists map deepest part of the ocean floor', m: 44 },
    { t: 'New rail link opens between two major cities', m: 95 },
    { t: 'Museum returns artefacts to country of origin', m: 180 }] }
];
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const ago = m => m < 60 ? `${m}m` : `${Math.round(m / 60)}h`;
let cfg = null, tracks = [], last = 0;

function build() {
  const d = cfg.display, root = document.documentElement;
  root.style.setProperty('--bar-h', `${d.barHeight}px`);
  root.style.setProperty('--gap', `${d.gap}px`);
  root.style.setProperty('--font', `${d.fontSize}px`);
  root.style.setProperty('--alpha', d.opacity);
  document.body.classList.toggle('hide-label', !d.showLabel);
  const bars = document.getElementById('bars');
  bars.replaceChildren();
  tracks = [];
  for (const b of SAMPLE) {
    const bar = el('div', 'bar'); bar.style.setProperty('--c', b.color);
    const label = el('div', 'label'); label.append(el('span', 'dot'), el('span', '', b.name));
    const vp = el('div', 'viewport'), track = el('div', 'track');
    vp.appendChild(track); bar.append(label, vp); bars.appendChild(bar);
    const run = el('div', 'run');
    const items = d.onlyNew ? b.items.filter(i => i.m < d.newMinutes) : b.items;
    for (const it of items.length ? items : b.items.slice(0, 1)) {
      const s = el('span', 'item');
      if (it.glow && (cfg.alerts?.glowPasses ?? 3) > 0) s.classList.add('glow', it.glow === 'red' ? 'glow-red' : 'glow-gold');
      if (it.brk) { s.classList.add('brk'); s.appendChild(el('span', 'brk-tag', 'BREAKING')); }
      else if (d.newMinutes > 0 && it.m < d.newMinutes) s.appendChild(el('span', 'new', 'NEW'));
      s.appendChild(el('span', '', it.t));
      if (d.showTime) s.appendChild(el('span', 'age', ago(it.m)));
      run.append(s, el('span', 'sep', '◆'));
    }
    track.append(run, run.cloneNode(true));
    tracks.push({ track, run, x: tracks.length ? -180 : 0 });
  }
  parent.postMessage({ previewHeight: bars.getBoundingClientRect().height }, '*');
}
function loop(t) {
  const dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
  if (cfg) for (const k of tracks) {
    const w = k.run.getBoundingClientRect().width || 1;
    k.x -= cfg.display.speed * dt;
    if (k.x <= -w) k.x += w;
    k.track.style.transform = `translateX(${k.x}px)`;
  }
  requestAnimationFrame(loop);
}
window.addEventListener('message', e => { if (e.data && e.data.display) { cfg = e.data; build(); } });
requestAnimationFrame(loop);
parent.postMessage({ previewReady: true }, '*');
