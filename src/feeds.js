// Fetches RSS 2.0, RSS 1.0 (RDF) and Atom feeds and turns them into a
// plain list of headlines: { title, link, date (ms or null) }.

const { XMLParser } = require('fast-xml-parser');
const httpFetch = require('./http');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  removeNSPrefix: true,      // dc:date -> date, atom:link -> link
  // Entities are decoded by our own code below. The parser's built-in decoder
  // caps a feed at 1,000 entities, and big feeds (Fox News carries full
  // articles: 6,000+ entities) would be rejected outright.
  processEntities: false,
  htmlEntities: false,
  stopNodes: ['*.encoded'],  // skip full-article bodies, we only need headlines
  trimValues: true
});

// Look like a normal browser: some news sites (Fox, CNN…) block unusual clients.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const HEADERS = [
  { 'User-Agent': UA, 'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5', 'Accept-Language': 'en-US,en;q=0.9' },
  // Second try: exactly what a browser sends when opening a page.
  { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9', 'Cache-Control': 'no-cache' }
];

function asArray(v) {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

function text(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) return text(v[0]);
  if (typeof v === 'object') return text(v['#text'] ?? v['@_href'] ?? '');
  return '';
}

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”' };

function decodeEntities(s) {
  // Run twice for feeds that double-escape (&amp;amp;).
  for (let i = 0; i < 2; i++) {
    s = s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
      if (e[0] === '#') {
        const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : m;
      }
      return NAMED[e.toLowerCase()] ?? m;
    });
  }
  return s;
}

function cleanTitle(s) {
  return decodeEntities(String(s)
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, ''))           // stray HTML
    .replace(/<\/?[a-z][^>]*>/gi, '')   // HTML that was escaped in the feed
    .replace(/\s+/g, ' ')
    .trim();
}

function atomLink(link) {
  const links = asArray(link);
  if (!links.length) return '';
  const alt = links.find(l => typeof l === 'object' && (!l['@_rel'] || l['@_rel'] === 'alternate'));
  const pick = alt || links[0];
  return typeof pick === 'string' ? pick : (pick['@_href'] || text(pick));
}

function cleanLink(s) {
  return decodeEntities(String(s || '')).trim();
}

function parseDate(...candidates) {
  for (const c of candidates) {
    const s = text(c);
    if (!s) continue;
    const t = Date.parse(s);
    // Ignore impossible dates (some feeds publish years like 3524).
    if (!Number.isNaN(t) && t < Date.now() + 2 * 86400e3 && t > Date.UTC(1995, 0, 1)) return t;
  }
  return null;
}

// Parse a feed XML string. Returns { title, language, items: [...] }.
function parseFeed(xml) {
  const doc = parser.parse(xml);

  // RSS 2.0
  if (doc.rss && doc.rss.channel) {
    const ch = Array.isArray(doc.rss.channel) ? doc.rss.channel[0] : doc.rss.channel;
    return {
      title: cleanTitle(text(ch.title)),
      language: text(ch.language).slice(0, 2).toLowerCase() || null,
      items: asArray(ch.item).map(it => ({
        title: cleanTitle(text(it.title)),
        link: cleanLink(text(it.link) || atomLink(it.link) || text(it.guid)),
        date: parseDate(it.pubDate, it.date, it.updated, it.published)
      }))
    };
  }

  // RSS 1.0 / RDF
  if (doc.RDF) {
    const ch = doc.RDF.channel || {};
    return {
      title: cleanTitle(text(ch.title)),
      language: text(ch.language).slice(0, 2).toLowerCase() || null,
      items: asArray(doc.RDF.item).map(it => ({
        title: cleanTitle(text(it.title)),
        link: cleanLink(text(it.link) || text(it['@_about'])),
        date: parseDate(it.date, it.pubDate)
      }))
    };
  }

  // Atom
  if (doc.feed) {
    const f = doc.feed;
    return {
      title: cleanTitle(text(f.title)),
      language: (text(f['@_lang']) || '').slice(0, 2).toLowerCase() || null,
      items: asArray(f.entry).map(e => ({
        title: cleanTitle(text(e.title)),
        link: cleanLink(atomLink(e.link)),
        date: parseDate(e.updated, e.published)
      }))
    };
  }

  throw new Error('Not an RSS or Atom feed');
}

// Optional fallback that loads the feed in a hidden real browser window
// (set by main.js). Used when a site answers plain requests with a block or
// bot-check page instead of the feed.
let browserFetcher = null;
function setBrowserFetcher(fn) { browserFetcher = fn; }

function looksLikeFeed(xml) {
  return /<(rss|feed|rdf:RDF|RDF)[\s>]/i.test(xml.slice(0, 5000)) || isKevJson(xml);
}

// CISA Known Exploited Vulnerabilities catalog (JSON, not RSS).
function isKevJson(text) {
  return /^\s*\{/.test(text) && /"vulnerabilities"\s*:/.test(text.slice(0, 5000));
}
function parseKev(text) {
  const doc = JSON.parse(text);
  const items = (doc.vulnerabilities || []).map(v => ({
    title: `${v.cveID}: ${v.vulnerabilityName || `${v.vendorProject} ${v.product}`} — actively exploited`,
    link: `https://nvd.nist.gov/vuln/detail/${v.cveID}`,
    date: v.dateAdded ? Date.parse(v.dateAdded + 'T12:00:00Z') : null
  }));
  return { title: doc.title || 'CISA KEV', items };
}

async function directFetch(url, timeoutMs) {
  let res;
  for (const headers of HEADERS) {
    res = await httpFetch(url, { headers, redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) });
    if (res.ok) {
      const xml = await res.text();
      if (looksLikeFeed(xml)) return xml;
      res = { ok: false, status: 200, webPage: true };   // try the next header set
      continue;
    }
    if (![401, 403, 406, 429, 503].includes(res.status)) break;
  }
  const e = new Error(res.webPage ? 'site sent a web page instead of a feed'
    : `HTTP ${res.status}${res.status === 403 ? ' (site blocked the request)' : ''}`);
  e.retryInBrowser = res.webPage || [401, 403, 406, 429, 503].includes(res.status);
  throw e;
}

async function fetchFeed(url, { timeoutMs = 15000 } = {}) {
  let xml;
  try {
    xml = await directFetch(url, timeoutMs);
  } catch (err) {
    if (!browserFetcher || !(err.retryInBrowser || err.name === 'TypeError')) throw err;
    xml = await browserFetcher(url);
    if (!xml || !looksLikeFeed(xml)) throw new Error(`${err.message}; browser fallback also failed`);
  }
  const feed = isKevJson(xml) ? parseKev(xml) : parseFeed(xml);
  // Drop blanks and duplicates, keep newest first when dates exist.
  const seen = new Set();
  feed.items = feed.items.filter(i => {
    if (!i.title || seen.has(i.title)) return false;
    seen.add(i.title);
    return true;
  });
  if (feed.items.some(i => i.date)) {
    feed.items.sort((a, b) => (b.date || 0) - (a.date || 0));
  }
  return feed;
}

module.exports = { fetchFeed, parseFeed, setBrowserFetcher };
