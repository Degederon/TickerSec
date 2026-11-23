// "Update available" panel: slides up, stays a minute (paused while the mouse
// is over it), then slides back down out of sight.
const d = JSON.parse(new URLSearchParams(location.search).get('d') || '{}');
const panel = document.getElementById('panel');
const bar = document.getElementById('bar');
document.getElementById('title').textContent = `TickerSec ${d.version} is ready to install`;
document.getElementById('notes').textContent = d.notes || 'Takes about 10 seconds — your settings are kept.';

const LIFE = (d.seconds || 60) * 1000;
let left = LIFE, last = performance.now(), hover = false, leaving = false;

function lower(action) {
  if (leaving) return;
  leaving = true;
  panel.classList.remove('up');
  panel.classList.add('down');
  setTimeout(() => window.news.updatePanelDone(action), 480);
}
panel.addEventListener('mouseenter', () => { hover = true; });
panel.addEventListener('mouseleave', () => { hover = false; });
document.getElementById('install').addEventListener('click', () => lower('install'));
document.getElementById('later').addEventListener('click', () => lower('later'));

// Install started elsewhere (tray / Settings): slide away.
window.news.onUpdatePanelLower(() => lower('elsewhere'));

requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('up')));
(function tick(now) {
  if (leaving) return;
  if (!hover) left -= now - last;
  last = now;
  bar.style.transform = `scaleX(${Math.max(0, left / LIFE)})`;
  if (left <= 0) lower('timeout'); else requestAnimationFrame(tick);
})(performance.now());
