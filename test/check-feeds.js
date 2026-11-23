// Checks every built-in news agency feed and reports which ones work.
// Run from the project folder:   npm run check-feeds
// Or check one address:          node test/check-feeds.js https://example.com/rss.xml

const PRESETS = require('../src/presets');
const { fetchFeed } = require('../src/feeds');

const G = s => `\x1b[32m${s}\x1b[0m`;
const R = s => `\x1b[31m${s}\x1b[0m`;
const Y = s => `\x1b[33m${s}\x1b[0m`;
const D = s => `\x1b[2m${s}\x1b[0m`;

function ago(ms) {
  if (!ms) return 'no dates';
  const m = Math.round((Date.now() - ms) / 60000);
  return m < 60 ? `${m}m ago` : m < 2880 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
}

async function check(a) {
  const t0 = Date.now();
  try {
    const f = await fetchFeed(a.url, { timeoutMs: 20000 });
    const newest = f.items.find(i => i.date)?.date;
    const stale = newest && Date.now() - newest > 3 * 86400e3;   // nothing in 3 days
    return { a, ok: f.items.length > 0, stale, count: f.items.length, newest, first: f.items[0]?.title, ms: Date.now() - t0 };
  } catch (err) {
    return { a, ok: false, error: String(err.cause?.code || err.message || err), ms: Date.now() - t0 };
  }
}

(async () => {
  const arg = process.argv[2];
  const list = arg ? [{ id: 'custom', name: arg, region: 'Custom', url: arg }] : PRESETS;
  console.log(`\nChecking ${list.length} feed${list.length > 1 ? 's' : ''}…\n`);

  const results = [];
  let i = 0;
  async function worker() {
    while (i < list.length) {
      const r = await check(list[i++]);
      results.push(r);
      const name = r.a.name.padEnd(26);
      if (!r.ok) console.log(`${R('✕ FAIL ')} ${name} ${R(r.error || 'no headlines')}  ${D(r.a.url)}`);
      else if (r.stale) console.log(`${Y('! STALE')} ${name} ${r.count} headlines, newest ${Y(ago(r.newest))}  ${D(r.a.url)}`);
      else console.log(`${G('✓ OK   ')} ${name} ${String(r.count).padStart(3)} headlines, newest ${ago(r.newest).padEnd(9)} ${D('“' + (r.first || '').slice(0, 60) + '”')}`);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));

  const ok = results.filter(r => r.ok && !r.stale).length;
  const stale = results.filter(r => r.ok && r.stale).length;
  const bad = results.filter(r => !r.ok);
  console.log(`\n${G(ok + ' working')}, ${Y(stale + ' stale')}, ${R(bad.length + ' failed')} out of ${results.length}`);
  if (bad.length) console.log(`Failed: ${bad.map(r => r.a.id).join(', ')}`);
  console.log('');
  process.exitCode = bad.length ? 1 : 0;
})();
