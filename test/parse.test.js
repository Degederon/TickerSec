const assert = require('assert');
const { parseFeed } = require('../src/feeds');

const rss = `<?xml version="1.0"?><rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel>
<title>BBC News</title><language>en-gb</language>
<item><title><![CDATA[Storm hits coast &amp; towns]]></title><link>https://bbc.co.uk/1</link><pubDate>Tue, 17 Nov 2026 14:00:00 GMT</pubDate></item>
<item><title>Second &#8216;story&#8217;</title><link>https://bbc.co.uk/2</link><dc:date>2026-11-17T13:00:00Z</dc:date></item>
</channel></rss>`;
const r = parseFeed(rss);
assert.equal(r.title, 'BBC News');
assert.equal(r.language, 'en');
assert.equal(r.items.length, 2);
assert.equal(r.items[0].title, 'Storm hits coast & towns');
assert.equal(r.items[0].link, 'https://bbc.co.uk/1');
assert.ok(r.items[0].date > 0 && r.items[1].date > 0);
assert.equal(r.items[1].title, 'Second ‘story’');

const single = parseFeed(`<rss><channel><title>One</title><item><title>Only</title><link>x</link></item></channel></rss>`);
assert.equal(single.items.length, 1);

const rdf = `<?xml version="1.0"?><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://purl.org/rss/1.0/" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel rdf:about="x"><title>DW</title><dc:language>de</dc:language></channel>
<item rdf:about="https://dw.com/a"><title>Nachricht eins</title><link>https://dw.com/a</link><dc:date>2026-11-17T12:00:00Z</dc:date></item>
</rdf:RDF>`;
const d = parseFeed(rdf);
assert.equal(d.title, 'DW');
assert.equal(d.language, 'de');
assert.equal(d.items[0].title, 'Nachricht eins');
assert.ok(d.items[0].date);

const atom = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom" xml:lang="fr"><title>Le Flux</title>
<entry><title type="html">Titre &lt;b&gt;un&lt;/b&gt;</title><link rel="alternate" href="https://ex.fr/1"/><link rel="enclosure" href="https://ex.fr/img.jpg"/><updated>2026-11-17T11:00:00Z</updated></entry>
<entry><title>Deux</title><link href="https://ex.fr/2"/><published>2026-11-17T10:00:00Z</published></entry></feed>`;
const a = parseFeed(atom);
assert.equal(a.title, 'Le Flux');
assert.equal(a.language, 'fr');
assert.equal(a.items[0].title, 'Titre un');
assert.equal(a.items[0].link, 'https://ex.fr/1');
assert.equal(a.items[1].link, 'https://ex.fr/2');

assert.throws(() => parseFeed('<html><body>nope</body></html>'));
console.log('All feed parser tests passed');
