// First-run welcome: greeting → pick up to 4 categories → set up and start.
const MAX = 4;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let CATS = [], NAMES = {}, picked = [], position = 'bottom';

function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; }

function show(n) {
  $$('.step').forEach((s, i) => s.classList.toggle('on', i === n - 1));
  $$('.steps .dot').forEach((d, i) => d.classList.toggle('on', i === n - 1));
}

function greeting() {
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  $('#greeting').textContent = `${part}, and welcome to TickerSec!`;
}

function renderCats() {
  const full = picked.length >= MAX;
  const box = $('#cats');
  box.replaceChildren();
  for (const c of CATS) {
    const on = picked.includes(c.id);
    const card = el('div', `cat${on ? ' on' : ''}${!on && full ? ' locked' : ''}`);
    card.title = !on && full ? 'You can choose 4 — remove one to pick this' : '';
    const tx = el('div', 'tx');
    tx.append(el('div', 'nm', c.name), el('div', 'ds', c.desc), el('div', 'src', c.sources.map(id => NAMES[id] || id).join(' · ')));
    card.append(el('div', 'ic', c.icon), tx, el('div', 'tick', on ? String(picked.indexOf(c.id) + 1) : '+'));
    card.addEventListener('click', () => {
      const i = picked.indexOf(c.id);
      if (i >= 0) picked.splice(i, 1); else if (picked.length < MAX) picked.push(c.id);
      renderCats();
    });
    box.append(card);
  }
  $('#count').textContent = `${picked.length} of ${MAX} chosen`;
  $('#count').classList.toggle('full', full);
  $('#go3').disabled = !picked.length;
}

async function setUp() {
  show(3);
  const list = $('#setupList');
  const chosen = picked.map(id => CATS.find(c => c.id === id));
  for (const c of chosen) {
    const li = el('li');
    li.append(`${c.icon}  Adding `, Object.assign(el('b'), { textContent: c.name }), ` — ${c.sources.map(id => NAMES[id] || id).join(', ')}`);
    list.append(li);
    await new Promise(r => setTimeout(r, 450));
  }
  const li = el('li'); li.textContent = `📍  Tickers at the ${position} of the screen`; list.append(li);
  await new Promise(r => setTimeout(r, 450));
  $('#spinner').classList.add('done');
  $('#doneTitle').textContent = "You're all set!";
  $('#tips').style.display = '';
  $('#finish').style.visibility = 'visible';
}

document.querySelectorAll('a.credit-line').forEach(a => a.addEventListener('click', e => { e.preventDefault(); window.news.openLink('https://www.youtube.com/@epomd'); }));
$('#go2').addEventListener('click', () => show(2));
$('#back1').addEventListener('click', () => show(1));
$('#go3').addEventListener('click', setUp);
$('#finish').addEventListener('click', () => window.news.welcomeDone({ categories: picked, position }));
$$('#position button').forEach(b => b.addEventListener('click', () => {
  position = b.dataset.v;
  $$('#position button').forEach(x => x.classList.toggle('on', x === b));
}));

(async () => {
  greeting();
  const d = await window.news.getWelcomeData();
  CATS = d.categories;
  NAMES = d.names;
  renderCats();
})();
