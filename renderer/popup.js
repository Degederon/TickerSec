// TickerSec alert pop-up. Data arrives in the page's query string.
const d = JSON.parse(new URLSearchParams(location.search).get('d') || '{}');
const card = document.getElementById('card');
card.style.setProperty('--c', d.color || '#4fa3ff');
if (d.breaking) card.classList.add('brk');
document.getElementById('agency').textContent = d.agency || 'TickerSec';
document.getElementById('why').textContent = d.why || '';
document.getElementById('title').textContent = d.title || '';
document.getElementById('foot').textContent = d.foot || 'Click to read the full story';

const LIFE = (d.seconds || 10) * 1000;
const timer = document.getElementById('timer');
let left = LIFE, last = performance.now(), hover = false, closing = false;

function close() {
  if (closing) return;
  closing = true;
  card.classList.add('out');
  setTimeout(() => window.news.closePopup(), 280);
}
card.addEventListener('mouseenter', () => { hover = true; });
card.addEventListener('mouseleave', () => { hover = false; });
document.getElementById('close').addEventListener('click', e => { e.stopPropagation(); close(); });
card.addEventListener('click', () => {
  if (d.action) window.news.popupAction();
  else if (d.link) window.news.openLink(d.link);
  close();
});

// Sticky pop-ups (update available) stay until the user closes them.
if (d.sticky) timer.style.display = 'none';
else (function tick(now) {
  if (!hover) left -= now - last;
  last = now;
  timer.style.transform = `scaleX(${Math.max(0, left / LIFE)})`;
  if (left <= 0) close(); else requestAnimationFrame(tick);
})(performance.now());
