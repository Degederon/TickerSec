// Groups the ticker bars on screen.
//  - General news (regions and custom feeds): one plain bar each, no title.
//  - Topic categories (Cybersecurity, Technology, …): a thin title strip, then
//    one bar per source. Collapsed, the category becomes a single bar that
//    mixes the headlines of all its sources.

const CATEGORIES = {
  'United States':       { icon: '🇺🇸', color: '#3b82f6', label: 'U.S. News' },
  'Cybersecurity':       { icon: '🛡️', color: '#22c55e' },
  'Government Cyber Alerts': { icon: '🏛️', color: '#3b82f6' },
  // One ticker watching many sources: starts as a single bar, newest first.
  'Power Related News': { icon: '⚡', color: '#facc15', consolidated: true, defaultCollapsed: true, newestFirst: true },
  'Internet & Telecom News': { icon: '📶', color: '#a855f7', consolidated: true, defaultCollapsed: true, newestFirst: true },
  'Service Outages': { icon: '⚠️', color: '#f59e0b', consolidated: true, defaultCollapsed: true, newestFirst: true },
  'Vendor Security Advisories': { icon: '🧩', color: '#38bdf8', consolidated: true, defaultCollapsed: true, newestFirst: true },
  'Threat Intelligence': { icon: '🔬', color: '#a78bfa' },
  'Data Breaches': { icon: '🔓', color: '#f87171' },
  'Cyber Breaking News': { icon: '⚡', color: '#22d3ee', consolidated: true, defaultCollapsed: true, newestFirst: true },
  'Breaking Across the U.S.': { icon: '🚨', color: '#ef4444', consolidated: true, defaultCollapsed: true, newestFirst: true },
  'Technology':          { icon: '💻', color: '#a259ff' },
  'Science & Space':     { icon: '🔭', color: '#4c6ef5' },
  'Health':              { icon: '🩺', color: '#ef4444' },
  'Business & Markets':  { icon: '📈', color: '#27ae60' },
  'Sports':              { icon: '🏈', color: '#f59e0b' },
  'Weather & Disasters': { icon: '🌪️', color: '#38bdf8' },
  'Gaming':              { icon: '🎮', color: '#ec4899' }
};

const HEADER_H = 22;

const isCategory = region => Object.prototype.hasOwnProperty.call(CATEGORIES, region);

// Collapsed if the user said so; otherwise the category's default.
// Consolidated categories are always one ticker: they can't be expanded.
const isConsolidated = cat => !!(CATEGORIES[cat] && CATEGORIES[cat].consolidated);
function isCollapsed(cat, collapsed = {}) {
  if (isConsolidated(cat)) return true;
  if (collapsed[cat] === true || collapsed[cat] === false) return collapsed[cat];
  return !!(CATEGORIES[cat] && CATEGORIES[cat].defaultCollapsed);
}

// Rows in display order. A category appears where its first source is in the list.
function layoutRows(agencies, collapsed = {}) {
  const rows = [];
  const placed = new Set();
  for (const a of agencies) {
    if (!isCategory(a.region)) { rows.push({ kind: 'bar', id: a.id }); continue; }
    if (placed.has(a.region)) continue;
    placed.add(a.region);
    const members = agencies.filter(x => x.region === a.region).map(x => x.id);
    const collapsedNow = isCollapsed(a.region, collapsed);
    // Collapsed: one combined bar whose label is the title. Expanded: title strip + a bar per source.
    if (collapsedNow) rows.push({ kind: 'merged', cat: a.region, id: `cat:${a.region}`, ids: members });
    else {
      rows.push({ kind: 'header', cat: a.region, count: members.length, collapsed: false });
      members.forEach(id => rows.push({ kind: 'bar', id, cat: a.region }));
    }
  }
  return rows;
}

function rowsHeight(rows, display) {
  if (!rows.length) return display.barHeight;
  const h = rows.reduce((sum, r) => sum + (r.kind === 'header' ? HEADER_H : display.barHeight), 0);
  return h + (rows.length - 1) * display.gap;
}

// Mix headlines from several sources: one from each in turn, newest first.
function interleave(bars) {
  const lists = bars.map(b => (b.items || []).map(it => ({ ...it, source: { name: it.publisher || b.name, color: b.color } })));
  const out = [];
  for (let i = 0; lists.some(l => i < l.length); i++) lists.forEach(l => { if (i < l.length) out.push(l[i]); });
  return out;
}

// All sources' headlines, newest first, the same story only once.
function newest(bars) {
  const seen = new Set();
  return bars.flatMap(b => (b.items || []).map(it => ({ ...it, source: { name: it.publisher || b.name, color: b.color } })))
    .sort((a, b) => (b.date || 0) - (a.date || 0))
    .filter(it => { const k = it.title.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim(); if (seen.has(k)) return false; seen.add(k); return true; });
}

// Turn the per-agency payload into what the ticker draws.
function toView(payload, agencies, collapsed) {
  const byId = new Map((payload.bars || []).map(b => [b.id, b]));
  const rows = layoutRows(agencies, collapsed).map(r => {
    if (r.kind === 'header') return { ...r, ...CATEGORIES[r.cat], title: CATEGORIES[r.cat].label || r.cat };
    if (r.kind === 'bar') return { kind: 'bar', cat: r.cat, bar: byId.get(r.id) };
    const members = r.ids.map(id => byId.get(id)).filter(Boolean);
    const withItems = members.filter(m => (m.items || []).length);
    const meta = CATEGORIES[r.cat];
    return {
      kind: 'bar', cat: r.cat, merged: true, fixed: !!meta.consolidated,
      bar: {
        id: r.id, name: meta.consolidated ? `${meta.icon} ${meta.label || r.cat}` : `▸ ${meta.icon} ${meta.label || r.cat} · ${r.ids.length}`, fixed: !!meta.consolidated, title: meta.newestFirst ? `${meta.label || r.cat} — one ticker, consolidated feed of ${r.ids.length} sources` : `${meta.label || r.cat} sources`, color: meta.color, cat: r.cat,
        // Keep the combined bar a sensible length: newest 40 across its sources.
        items: (meta.newestFirst ? newest(withItems) : interleave(withItems)).slice(0, 40),
        loaded: members.some(m => m.loaded),
        error: withItems.length ? null : (members.find(m => m.error) || {}).error || null
      }
    };
  }).filter(r => r.kind === 'header' || r.bar);

  // A forced (preview) bar inside a collapsed category forces the merged bar.
  const force = (payload.force || []).map(id => {
    const a = agencies.find(x => x.id === id);
    return a && isCategory(a.region) && isCollapsed(a.region, collapsed) ? `cat:${a.region}` : id;
  });
  return { rows, fetchedAt: payload.fetchedAt, force };
}

module.exports = { CATEGORIES, HEADER_H, isCategory, isConsolidated, isCollapsed, layoutRows, rowsHeight, toView };
