// Headline translation. Four providers:
const httpFetch = require('./http');
//   google     – free Google Translate web endpoint, no key (unofficial, may rate-limit)
//   mymemory   – free MyMemory API, no key (≈5,000 chars/day; 50,000 with an email)
//   libre      – LibreTranslate (your own server or a hosted one, optional key)
//   deepl      – DeepL API (free or pro key)
// Results are cached so each headline is only translated once.

const cache = new Map();          // key: provider|from|to|text  -> translated text
const MAX_CACHE = 5000;

function remember(key, value) {
  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
  cache.set(key, value);
}

async function getJSON(url, opts = {}) {
  const res = await httpFetch(url, { ...opts, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const providers = {
  async google(q, from, to) {
    const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&dt=t'
      + `&sl=${encodeURIComponent(from || 'auto')}&tl=${encodeURIComponent(to)}&q=${encodeURIComponent(q)}`;
    const data = await getJSON(url);
    return (data[0] || []).map(seg => seg[0]).join('');
  },

  async mymemory(q, from, to, cfg) {
    const src = from && from !== 'auto' ? from : 'Autodetect';
    let url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${src}|${to}`;
    if (cfg.mymemoryEmail) url += `&de=${encodeURIComponent(cfg.mymemoryEmail)}`;
    const data = await getJSON(url);
    if (data.responseStatus && Number(data.responseStatus) !== 200) throw new Error(data.responseDetails || 'MyMemory error');
    return data.responseData.translatedText;
  },

  async libre(q, from, to, cfg) {
    const base = (cfg.libreUrl || 'https://libretranslate.com').replace(/\/+$/, '');
    const data = await getJSON(`${base}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q, source: from || 'auto', target: to, format: 'text', api_key: cfg.libreKey || undefined })
    });
    return data.translatedText;
  },

  async deepl(q, from, to, cfg) {
    if (!cfg.deeplKey) throw new Error('DeepL key missing');
    const host = cfg.deeplKey.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com';
    const body = new URLSearchParams({ text: q, target_lang: to.toUpperCase() });
    if (from && from !== 'auto') body.set('source_lang', from.toUpperCase());
    const data = await getJSON(`${host}/v2/translate`, {
      method: 'POST',
      headers: { Authorization: `DeepL-Auth-Key ${cfg.deeplKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    return data.translations[0].text;
  }
};

async function translateOne(textIn, from, cfg) {
  const to = cfg.target || 'en';
  const key = `${cfg.provider}|${from}|${to}|${textIn}`;
  if (cache.has(key)) return cache.get(key);
  const fn = providers[cfg.provider] || providers.google;
  const out = (await fn(textIn, from, to, cfg) || '').trim();
  if (out) remember(key, out);
  return out || textIn;
}

// Translate a list of headlines with a little concurrency.
// Never throws: on failure the original headline is kept.
async function translateItems(items, from, cfg) {
  let failures = 0;
  const out = items.map(i => ({ ...i }));
  let next = 0;
  async function worker() {
    while (next < out.length) {
      const idx = next++;
      try {
        const t = await translateOne(out[idx].title, from, cfg);
        if (t && t !== out[idx].title) {
          out[idx].original = out[idx].title;
          out[idx].title = t;
        }
      } catch {
        failures++;
      }
    }
  }
  await Promise.all([worker(), worker(), worker()]);
  return { items: out, failures };
}

module.exports = { translateItems, translateOne };
