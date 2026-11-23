const assert = require('assert');
const { classify, inQuietHours } = require('../src/alerts');
const cfg = { keywords: ['Steelers', 'hurricane', 'Oak Creek', 'recall'], breaking: true, breakingFront: true,
  breakingWords: ['BREAKING', 'LIVE', 'WATCH LIVE', 'URGENT', 'JUST IN', 'DEVELOPING'] };
const items = [
  { title: 'Steelers beat Ravens in overtime' },
  { title: 'Live Nation shares rise after earnings' },          // not breaking
  { title: 'WATCH LIVE: Senate hearing on Navy secretary' },    // breaking
  { title: 'Hurricanes are getting stronger, study says' },     // "hurricane" whole word -> no
  { title: 'Hurricane Delta nears Florida coast' },              // keyword
  { title: 'Water main break in Oak Creek closes roads' },       // phrase
  { title: 'Carmaker issues recall of 50,000 SUVs' },
  { title: 'BREAKING Earthquake shakes Japan' },                 // caps breaking
  { title: 'Live updates: election night results' },             // sep breaking
  { title: 'Breakingviews: markets look ahead' },                // not breaking
  { title: 'Urgently needed: blood donors' }                     // not breaking
];
const r = classify(items, cfg);
const by = t => r.find(i => i.title === t);
assert.deepEqual(by('Steelers beat Ravens in overtime').alert.keywords, ['Steelers']);
assert.equal(by('Live Nation shares rise after earnings').alert, null);
assert.equal(by('WATCH LIVE: Senate hearing on Navy secretary').alert.breaking, true);
assert.equal(by('Hurricanes are getting stronger, study says').alert, null);
assert.deepEqual(by('Hurricane Delta nears Florida coast').alert.keywords, ['hurricane']);
assert.deepEqual(by('Water main break in Oak Creek closes roads').alert.keywords, ['Oak Creek']);
assert.deepEqual(by('Carmaker issues recall of 50,000 SUVs').alert.keywords, ['recall']);
assert.equal(by('BREAKING Earthquake shakes Japan').alert.breaking, true);
assert.equal(by('Live updates: election night results').alert.breaking, true);
assert.equal(by('Breakingviews: markets look ahead').alert, null);
assert.equal(by('Urgently needed: blood donors').alert, null);
// breaking moved to front, original order kept
assert.deepEqual(r.slice(0, 3).map(i => i.title), ['WATCH LIVE: Senate hearing on Navy secretary', 'BREAKING Earthquake shakes Japan', 'Live updates: election night results']);
assert.equal(r[3].title, 'Steelers beat Ravens in overtime');
// translated original also matches
assert.deepEqual(classify([{ title: 'Storm warning', original: 'Hurricane-Warnung für Kuba' }], cfg)[0].alert.keywords, ['hurricane']);
// quiet hours wrap past midnight
const q = { quietHours: true, quietFrom: '22:00', quietTo: '07:00' };
const at = (h, m) => { const d = new Date(2026, 10, 17, h, m); return d; };
assert.equal(inQuietHours(q, at(23, 30)), true);
assert.equal(inQuietHours(q, at(6, 59)), true);
assert.equal(inQuietHours(q, at(7, 0)), false);
assert.equal(inQuietHours(q, at(14, 0)), false);
assert.equal(inQuietHours({ ...q, quietFrom: '13:00', quietTo: '15:00' }, at(14, 0)), true);
assert.equal(inQuietHours({ ...q, quietHours: false }, at(23, 0)), false);
assert.deepEqual(classify([{ title: 'Hurricanes are getting stronger' }], { keywords: ['hurrican*'] })[0].alert.keywords, ['hurrican*']);
console.log('All alert tests passed');
