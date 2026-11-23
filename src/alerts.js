// Keyword alerts and "breaking" detection.
// classify() marks each headline:  item.alert = { breaking: bool, keywords: [..] }
// and (optionally) moves breaking headlines to the front of their bar.

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Whole-word, case-insensitive match for each keyword or phrase.
function keywordMatchers(keywords) {
  return (keywords || [])
    .map(k => String(k).trim())
    .filter(Boolean)
    .map(k => {
      // "hurrican*" = any word starting with "hurrican"
      const prefix = k.endsWith('*');
      const body = escapeRe(prefix ? k.slice(0, -1) : k);
      const end = prefix ? '' : '(?=$|[^\\p{L}\\p{N}])';
      return { word: k, re: new RegExp(`(^|[^\\p{L}\\p{N}])${body}${end}`, 'iu') };
    });
}

// A headline is "breaking" when it starts with one of the words and either
//  - the word is followed by a separator ("Live: …", "Breaking — …", "LIVE UPDATES: …"), or
//  - the word is written in capitals ("BREAKING Senate votes …").
function breakingMatchers(words) {
  return (words || [])
    .map(w => String(w).trim())
    .filter(Boolean)
    .map(w => ({
      sep: new RegExp(`^\\s*[\\[(]?${escapeRe(w)}(\\s+(UPDATES?|NEWS|ALERT|NOW))?[\\])]?\\s*[:|–—-]`, 'i'),
      caps: new RegExp(`^\\s*${escapeRe(w.toUpperCase())}\\b`)
    }));
}

function classify(items, cfg) {
  const a = cfg || {};
  const kws = keywordMatchers(a.keywords);
  const brk = a.breaking ? breakingMatchers(a.breakingWords) : [];

  const out = items.map(it => {
    const text = `${it.title} ${it.original || ''}`;
    const keywords = kws.filter(k => k.re.test(text)).map(k => k.word);
    const breaking = brk.some(b => b.sep.test(it.title) || b.caps.test(it.title) ||
      (it.original && (b.sep.test(it.original) || b.caps.test(it.original))));
    return (keywords.length || breaking) ? { ...it, alert: { breaking, keywords } } : { ...it, alert: null };
  });

  if (a.breaking && a.breakingFront) {
    // Stable: breaking first, everything else keeps its order.
    return [...out.filter(i => i.alert && i.alert.breaking), ...out.filter(i => !(i.alert && i.alert.breaking))];
  }
  return out;
}

// "22:00" -> minutes after midnight
function toMinutes(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ''));
  return m ? (+m[1]) * 60 + (+m[2]) : null;
}

function inQuietHours(cfg, now = new Date()) {
  if (!cfg || !cfg.quietHours) return false;
  const from = toMinutes(cfg.quietFrom), to = toMinutes(cfg.quietTo);
  if (from === null || to === null || from === to) return false;
  const t = now.getHours() * 60 + now.getMinutes();
  return from < to ? (t >= from && t < to) : (t >= from || t < to);   // may wrap past midnight
}

module.exports = { classify, inQuietHours, keywordMatchers };
