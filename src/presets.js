// Built-in news agencies. Each one is an RSS/Atom feed.
// lang = the language the feed is written in (used for translation).
// Add your own from the Settings page with "Add custom feed".

// Words a local-station headline must contain to show in Breaking Across the U.S.
const INCIDENT = ['explosion','explode*','blast','fire','fires','wildfire','blaze','burn*','evacuat*','shelter in place','shelter-in-place','hazmat','gas leak','chemical','earthquake','tornado','derail*','collapse*','plane crash','mass casualty','active shooter','lockdown','bomb','flood*','breaking'];

// Words a cyber headline must contain to show in Cyber Breaking News.
const CYBER_BREAKING = ['zero-day','0-day','zeroday','actively exploited','exploited in the wild','under attack','emergency','emergency directive','urgent','critical','patch now','breach','breached','data breach','leak*','ransomware','cyberattack','cyber attack','hack','hacked','hackers','compromise*','supply chain','backdoor*','outage','down','disrupt*','wiper','botnet','ddos','extortion','stolen','steal*','spyware','exposed','CVE','RCE','remote code execution','KEV','known exploited','warn*','breaking'];

// Status-page notices that aren't outages.
const NOT_OUTAGE = ['maintenance', 'scheduled', 'planned'];

module.exports = [
  // ── United States ──────────────────────────────────────────────
  { id: 'npr',        name: 'NPR',               region: 'United States', lang: 'en', color: '#2f80ed', url: 'https://feeds.npr.org/1001/rss.xml' },
  { id: 'nyt',        name: 'New York Times',    region: 'United States', lang: 'en', color: '#e0e0e0', url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml' },
  { id: 'wapo',       name: 'Washington Post',   region: 'United States', lang: 'en', color: '#9aa5b1', url: 'https://feeds.washingtonpost.com/rss/world' },
  { id: 'cbs',        name: 'CBS News',          region: 'United States', lang: 'en', color: '#3d7bd9', url: 'https://www.cbsnews.com/latest/rss/main' },
  { id: 'abcus',      name: 'ABC News',          region: 'United States', lang: 'en', color: '#f5c518', url: 'https://abcnews.go.com/abcnews/topstories' },
  { id: 'fox',        name: 'Fox News',          region: 'United States', lang: 'en', color: '#d62d20', url: 'https://moxie.foxnews.com/google-publisher/latest.xml' },
  { id: 'cnn',        name: 'CNN',               region: 'United States', lang: 'en', color: '#cc0000', url: 'https://news.google.com/rss/search?q=site%3Acnn.com+when%3A1d&hl=en-US&gl=US&ceid=US:en' },
  { id: 'pbs',        name: 'PBS NewsHour',      region: 'United States', lang: 'en', color: '#5b8def', url: 'https://www.pbs.org/newshour/feeds/rss/headlines' },

  // ── United Kingdom & Ireland ───────────────────────────────────
  { id: 'bbc',        name: 'BBC News',          region: 'United Kingdom', lang: 'en', color: '#bb1919', url: 'https://feeds.bbci.co.uk/news/rss.xml' },
  { id: 'bbcworld',   name: 'BBC World',         region: 'United Kingdom', lang: 'en', color: '#e8473b', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { id: 'guardian',   name: 'The Guardian',      region: 'United Kingdom', lang: 'en', color: '#3d8fd1', url: 'https://www.theguardian.com/world/rss' },
  { id: 'sky',        name: 'Sky News',          region: 'United Kingdom', lang: 'en', color: '#22b0e8', url: 'https://feeds.skynews.com/feeds/rss/world.xml' },

  // ── Canada & Oceania ───────────────────────────────────────────
  { id: 'cbc',        name: 'CBC News',          region: 'Canada & Oceania', lang: 'en', color: '#e2231a', url: 'https://www.cbc.ca/webfeed/rss/rss-topstories' },
  { id: 'abcau',      name: 'ABC Australia',     region: 'Canada & Oceania', lang: 'en', color: '#41c0e8', url: 'https://www.abc.net.au/news/feed/51120/rss.xml' },

  // ── Europe ─────────────────────────────────────────────────────
  { id: 'dw',         name: 'Deutsche Welle',    region: 'Europe', lang: 'en', color: '#2fa4e7', url: 'https://rss.dw.com/rdf/rss-en-all' },
  { id: 'france24',   name: 'France 24',         region: 'Europe', lang: 'en', color: '#00a0e3', url: 'https://www.france24.com/en/rss' },
  { id: 'euronews',   name: 'Euronews',          region: 'Europe', lang: 'en', color: '#3b6fd8', url: 'https://www.euronews.com/rss' },
  { id: 'spiegel',    name: 'Der Spiegel',       region: 'Europe', lang: 'de', color: '#e64415', url: 'https://www.spiegel.de/schlagzeilen/index.rss' },
  { id: 'tagesschau', name: 'Tagesschau',        region: 'Europe', lang: 'de', color: '#1f5ea8', url: 'https://www.tagesschau.de/xml/rss2/' },
  { id: 'lemonde',    name: 'Le Monde',          region: 'Europe', lang: 'fr', color: '#f0f0f0', url: 'https://www.lemonde.fr/rss/une.xml' },
  { id: 'france24fr', name: 'France 24 (FR)',    region: 'Europe', lang: 'fr', color: '#00a0e3', url: 'https://www.france24.com/fr/rss' },
  { id: 'elpais',     name: 'El País',           region: 'Europe', lang: 'es', color: '#d8d8d8', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada' },
  { id: 'ansa',       name: 'ANSA',              region: 'Europe', lang: 'it', color: '#0e7ac4', url: 'https://www.ansa.it/sito/notizie/topnews/topnews_rss.xml' },

  // ── Middle East, Asia & Africa ─────────────────────────────────
  { id: 'aljazeera',  name: 'Al Jazeera',        region: 'Middle East, Asia & Africa', lang: 'en', color: '#fa9000', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { id: 'toi',        name: 'Times of India',    region: 'Middle East, Asia & Africa', lang: 'en', color: '#ec2027', url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms' },
  { id: 'nhk',        name: 'NHK (Japanese)',    region: 'Middle East, Asia & Africa', lang: 'ja', color: '#d9d9d9', url: 'https://www3.nhk.or.jp/rss/news/cat0.xml' },
  { id: 'scmp',       name: 'South China Morning Post', region: 'Middle East, Asia & Africa', lang: 'en', color: '#ffca05', url: 'https://www.scmp.com/rss/91/feed' },
  { id: 'news24',     name: 'News24 (South Africa)', region: 'Middle East, Asia & Africa', lang: 'en', color: '#1e88e5', url: 'https://feeds.news24.com/articles/news24/TopStories/rss' },

  // ── Cybersecurity ──────────────────────────────────────────────
  { id: 'krebs',      name: 'Krebs on Security', region: 'Cybersecurity', lang: 'en', color: '#c53030', url: 'https://krebsonsecurity.com/feed/' },
  { id: 'thn',        name: 'The Hacker News',   region: 'Cybersecurity', lang: 'en', color: '#e53e3e', url: 'https://feeds.feedburner.com/TheHackersNews' },
  { id: 'bleeping',   name: 'BleepingComputer',  region: 'Cybersecurity', lang: 'en', color: '#3182ce', url: 'https://www.bleepingcomputer.com/feed/' },
  { id: 'darkreading',name: 'Dark Reading',      region: 'Cybersecurity', lang: 'en', color: '#805ad5', url: 'https://www.darkreading.com/rss.xml' },
  { id: 'securityweek',name: 'SecurityWeek',     region: 'Cybersecurity', lang: 'en', color: '#dd6b20', url: 'https://www.securityweek.com/feed/' },
  { id: 'therecord',  name: 'The Record',        region: 'Cybersecurity', lang: 'en', color: '#38a169', url: 'https://therecord.media/feed' },
  { id: 'helpnet',    name: 'Help Net Security', region: 'Cybersecurity', lang: 'en', color: '#00a3c4', url: 'https://www.helpnetsecurity.com/feed/' },
  { id: 'sansisc',    name: 'SANS Internet Storm Center', region: 'Cybersecurity', lang: 'en', color: '#d69e2e', url: 'https://isc.sans.edu/rssfeed_full.xml' },
  { id: 'schneier',   name: 'Schneier on Security', region: 'Cybersecurity', lang: 'en', color: '#718096', url: 'https://www.schneier.com/feed/atom/' },
  { id: 'cyberscoop', name: 'CyberScoop', region: 'Cybersecurity', lang: 'en', color: '#06b6d4', url: 'https://cyberscoop.com/feed/' },
  { id: 'secaffairs', name: 'Security Affairs', region: 'Cybersecurity', lang: 'en', color: '#06b6d4', url: 'https://securityaffairs.com/feed' },
  { id: 'regsec', name: 'The Register – Security', region: 'Cybersecurity', lang: 'en', color: '#06b6d4', url: 'https://www.theregister.com/security/headlines.atom' },
  { id: 'cybernews', name: 'Cybernews', region: 'Cybersecurity', lang: 'en', color: '#06b6d4', url: 'https://news.google.com/rss/search?q=site%3Acybernews.com+when%3A2d&hl=en-US&gl=US&ceid=US:en' },

  // ── Government Cyber Alerts ────────────────────────────────────
  { id: 'cisa',       name: 'CISA Advisories',   region: 'Government Cyber Alerts', lang: 'en', color: '#2b6cb0', url: 'https://www.cisa.gov/cybersecurity-advisories/all.xml' },
  { id: 'cisaalerts', name: 'CISA Alerts',       region: 'Government Cyber Alerts', lang: 'en', color: '#3b82f6', url: 'https://www.cisa.gov/cybersecurity-advisories/alerts.xml' },
  { id: 'cisaics',    name: 'CISA ICS Advisories', region: 'Government Cyber Alerts', lang: 'en', color: '#0ea5e9', url: 'https://www.cisa.gov/cybersecurity-advisories/ics-advisories.xml' },
  { id: 'cisakev', name: 'CISA KEV (actively exploited)', region: 'Government Cyber Alerts', lang: 'en', color: '#3b82f6', url: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json' },
  { id: 'cisanews',   name: 'CISA News',         region: 'Government Cyber Alerts', lang: 'en', color: '#1d4ed8', url: 'https://www.cisa.gov/news.xml' },
  { id: 'ic3psa',     name: 'FBI IC3 Public Alerts', region: 'Government Cyber Alerts', lang: 'en', color: '#b91c1c', url: 'https://www.ic3.gov/PSA/RSS' },
  { id: 'ic3csa',     name: 'FBI IC3 Industry Alerts', region: 'Government Cyber Alerts', lang: 'en', color: '#dc2626', url: 'https://www.ic3.gov/CSA/RSS' },
  { id: 'fbipress',   name: 'FBI Press Releases', region: 'Government Cyber Alerts', lang: 'en', color: '#a16207', url: 'https://www.fbi.gov/feeds/national-press-releases/rss.xml' },
  { id: 'fbitop',     name: 'FBI Top Stories',   region: 'Government Cyber Alerts', lang: 'en', color: '#ca8a04', url: 'https://www.fbi.gov/feeds/fbi-top-stories/rss.xml' },
  { id: 'fbinews',    name: 'FBI in the News',   region: 'Government Cyber Alerts', lang: 'en', color: '#eab308', url: 'https://www.fbi.gov/feeds/fbi-in-the-news/rss.xml' },
  { id: 'ncsc',       name: 'UK NCSC (all)',     region: 'Government Cyber Alerts', lang: 'en', color: '#7c3aed', url: 'https://www.ncsc.gov.uk/api/1/services/v1/all-rss-feed.xml' },
  { id: 'ncscnews',   name: 'UK NCSC News',      region: 'Government Cyber Alerts', lang: 'en', color: '#8b5cf6', url: 'https://www.ncsc.gov.uk/api/1/services/v1/news-rss-feed.xml' },
  { id: 'cccs',       name: 'Canada Cyber Centre Alerts', region: 'Government Cyber Alerts', lang: 'en', color: '#e11d48', url: 'https://www.cyber.gc.ca/api/cccs/rss/v1/get?feed=alerts_advisories&lang=en' },
  { id: 'acscalerts', name: 'Australia ACSC Alerts', region: 'Government Cyber Alerts', lang: 'en', color: '#059669', url: 'https://www.cyber.gov.au/rss/alerts' },
  { id: 'acscadv',    name: 'Australia ACSC Advisories', region: 'Government Cyber Alerts', lang: 'en', color: '#10b981', url: 'https://www.cyber.gov.au/rss/advisories' },
  { id: 'msftsec', name: 'Microsoft Security', region: 'Government Cyber Alerts', lang: 'en', color: '#3b82f6', url: 'https://www.microsoft.com/en-us/security/blog/feed/' },
  { id: 'cfsec', name: 'Cloudflare Security', region: 'Government Cyber Alerts', lang: 'en', color: '#3b82f6', url: 'https://blog.cloudflare.com/tag/security/rss/' },

  // ── Technology ─────────────────────────────────────────────────
  { id: 'bbctech',    name: 'BBC Technology',    region: 'Technology', lang: 'en', color: '#a259ff', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
  { id: 'ars',        name: 'Ars Technica',      region: 'Technology', lang: 'en', color: '#ff4e00', url: 'https://feeds.arstechnica.com/arstechnica/index' },
  { id: 'verge',      name: 'The Verge',         region: 'Technology', lang: 'en', color: '#e2127a', url: 'https://www.theverge.com/rss/index.xml' },
  { id: 'techcrunch', name: 'TechCrunch',        region: 'Technology', lang: 'en', color: '#0a9e01', url: 'https://techcrunch.com/feed/' },
  { id: 'wired',      name: 'Wired',             region: 'Technology', lang: 'en', color: '#bfbfbf', url: 'https://www.wired.com/feed/rss' },

  // ── Science & Space ────────────────────────────────────────────
  { id: 'bbcsci',     name: 'BBC Science',       region: 'Science & Space', lang: 'en', color: '#16c79a', url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml' },
  { id: 'nasa',       name: 'NASA',              region: 'Science & Space', lang: 'en', color: '#0b3d91', url: 'https://www.nasa.gov/news-release/feed/' },
  { id: 'spacecom',   name: 'Space.com',         region: 'Science & Space', lang: 'en', color: '#4c6ef5', url: 'https://www.space.com/feeds/all' },
  { id: 'sciencedaily',name: 'ScienceDaily',     region: 'Science & Space', lang: 'en', color: '#2f855a', url: 'https://www.sciencedaily.com/rss/all.xml' },

  // ── Health ─────────────────────────────────────────────────────
  { id: 'nprhealth',  name: 'NPR Health',        region: 'Health', lang: 'en', color: '#2f80ed', url: 'https://feeds.npr.org/1128/rss.xml' },
  { id: 'bbchealth',  name: 'BBC Health',        region: 'Health', lang: 'en', color: '#e8473b', url: 'https://feeds.bbci.co.uk/news/health/rss.xml' },
  { id: 'who',        name: 'World Health Organization', region: 'Health', lang: 'en', color: '#0093d5', url: 'https://www.who.int/rss-feeds/news-english.xml' },

  // ── Business & Markets ─────────────────────────────────────────
  { id: 'bbcbiz',     name: 'BBC Business',      region: 'Business & Markets', lang: 'en', color: '#27ae60', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
  { id: 'cnbc',       name: 'CNBC',              region: 'Business & Markets', lang: 'en', color: '#0b6fb8', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' },
  { id: 'marketwatch',name: 'MarketWatch',       region: 'Business & Markets', lang: 'en', color: '#3cb371', url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories' },
  { id: 'yahoofin',   name: 'Yahoo Finance',     region: 'Business & Markets', lang: 'en', color: '#7e1fff', url: 'https://news.google.com/rss/search?q=site%3Afinance.yahoo.com+when%3A1d&hl=en-US&gl=US&ceid=US:en' },   // Yahoo ended its finance news feeds (Oct 2026)

  // ── Sports ─────────────────────────────────────────────────────
  { id: 'espn',       name: 'ESPN',              region: 'Sports', lang: 'en', color: '#e8352e', url: 'https://www.espn.com/espn/rss/news' },
  { id: 'bbcsport',   name: 'BBC Sport',         region: 'Sports', lang: 'en', color: '#ffd230', url: 'https://feeds.bbci.co.uk/sport/rss.xml' },
  { id: 'cbssports',  name: 'CBS Sports',        region: 'Sports', lang: 'en', color: '#1e5bc6', url: 'https://www.cbssports.com/rss/headlines/' },
  { id: 'yahoosports',name: 'Yahoo Sports',      region: 'Sports', lang: 'en', color: '#6001d2', url: 'https://sports.yahoo.com/rss/' },

  // ── Power Related News (one consolidated ticker) ──────────────────────
  // Outage news, utilities by name, local restoration updates and outage counts.
  { id: 'po-news', name: 'Google News: Power outages', region: 'Power Related News', lang: 'en', color: '#facc15', url: 'https://news.google.com/rss/search?q=intitle%3A%28%22without+power%22+OR+%22power+outage%22+OR+%22power+outages%22+OR+blackout+OR+%22power+restored%22%29+when%3A1d&hl=en-US&gl=US&ceid=US:en' },
  { id: 'po-texas', name: 'Google News: Texas grid & utilities', region: 'Power Related News', lang: 'en', color: '#bf0a30', url: 'https://news.google.com/rss/search?q=%28intitle%3AERCOT+OR+intitle%3ACenterPoint+OR+intitle%3AOncor+OR+intitle%3AEntergy+OR+intitle%3A%22Texas+power+grid%22%29+%28outage+OR+outages+OR+%22without+power%22+OR+%22power+outage%22+OR+blackout+OR+%22lost+power%22%29+when%3A1d&hl=en-US&gl=US&ceid=US:en' },
  { id: 'po-utils', name: 'Google News: Major U.S. utilities', region: 'Power Related News', lang: 'en', color: '#0ea5e9', url: 'https://news.google.com/rss/search?q=%28intitle%3A%22Duke+Energy%22+OR+intitle%3A%22FPL%22+OR+intitle%3A%22Georgia+Power%22+OR+intitle%3A%22Dominion+Energy%22+OR+intitle%3A%22PG%26E%22+OR+intitle%3A%22Southern+California+Edison%22+OR+intitle%3A%22Con+Edison%22+OR+intitle%3A%22ConEd%22+OR+intitle%3A%22PSE%26G%22+OR+intitle%3A%22ComEd%22+OR+intitle%3A%22Xcel+Energy%22+OR+intitle%3A%22DTE%22+OR+intitle%3A%22Consumers+Energy%22+OR+intitle%3A%22AEP%22+OR+intitle%3A%22Pepco%22+OR+intitle%3A%22BGE%22%29+%28outage+OR+outages+OR+%22without+power%22+OR+%22power+outage%22+OR+blackout+OR+%22lost+power%22%29+when%3A1d&hl=en-US&gl=US&ceid=US:en' },
  { id: 'po-local', name: 'Google News: Local outage & restoration', region: 'Power Related News', lang: 'en', color: '#f97316', url: 'https://news.google.com/rss/search?q=intitle%3A%28%22outage+map%22+OR+%22restoring+power%22+OR+%22power+restored%22+OR+%22restore+power%22+OR+%22crews+working%22+OR+%22customers+without%22%29+when%3A1d&hl=en-US&gl=US&ceid=US:en' },
  { id: 'po-counts', name: 'Google News: Outage counts (PowerOutage.us)', region: 'Power Related News', lang: 'en', color: '#eab308', url: 'https://news.google.com/rss/search?q=%22PowerOutage.us%22+OR+%22poweroutage.us%22+when%3A1d&hl=en-US&gl=US&ceid=US:en' },

  // ── Internet & Telecom News (one consolidated ticker) ──────────
  // ISPs and carriers by name, 911/phone outages, and news citing Downdetector user reports.
  { id: 'nt-isp', name: 'Google News: ISP & carrier outages', region: 'Internet & Telecom News', lang: 'en', color: '#a855f7', url: 'https://news.google.com/rss/search?q=%28intitle%3A%22Xfinity%22+OR+intitle%3A%22Comcast%22+OR+intitle%3A%22Spectrum%22+OR+intitle%3A%22AT%26T%22+OR+intitle%3A%22Verizon%22+OR+intitle%3A%22T-Mobile%22+OR+intitle%3A%22Cox%22+OR+intitle%3A%22Optimum%22+OR+intitle%3A%22Frontier%22+OR+intitle%3A%22CenturyLink%22+OR+intitle%3A%22Lumen%22+OR+intitle%3A%22Starlink%22+OR+intitle%3A%22Google+Fiber%22%29+%28outage+OR+outages+OR+down+OR+%22not+working%22+OR+%22no+service%22+OR+disruption%29+when%3A1d&hl=en-US&gl=US&ceid=US:en' },
  { id: 'nt-911', name: 'Google News: 911, phone & internet outages', region: 'Internet & Telecom News', lang: 'en', color: '#ef4444', url: 'https://news.google.com/rss/search?q=intitle%3A%28%22911+outage%22+OR+%22internet+outage%22+OR+%22phone+outage%22+OR+%22cell+outage%22+OR+%22cellular+outage%22+OR+%22network+outage%22+OR+%22fiber+cut%22%29+when%3A1d&hl=en-US&gl=US&ceid=US:en' },
  { id: 'nt-dd', name: 'Google News: Downdetector user reports', region: 'Internet & Telecom News', lang: 'en', color: '#f43f5e', url: 'https://news.google.com/rss/search?q=Downdetector+%28outage+OR+down+OR+%22not+working%22%29+when%3A1d&hl=en-US&gl=US&ceid=US:en' },

  // ── Service Outages (one consolidated ticker) ─────────────────────
  // Official status pages of big cloud/SaaS services + outage news.
  { id: 'so-aws', name: 'AWS', region: 'Service Outages', lang: 'en', color: '#ff9900', url: 'https://status.aws.amazon.com/rss/all.rss', exclude: NOT_OUTAGE },
  { id: 'so-azure', name: 'Microsoft Azure', region: 'Service Outages', lang: 'en', color: '#0078d4', url: 'https://rssfeed.azure.status.microsoft/en-us/status/feed/', exclude: NOT_OUTAGE },
  { id: 'so-m365', name: 'Microsoft 365', region: 'Service Outages', lang: 'en', color: '#d83b01', url: 'https://status.cloud.microsoft/api/feed/mac', exclude: NOT_OUTAGE },
  { id: 'so-gcp', name: 'Google Cloud', region: 'Service Outages', lang: 'en', color: '#4285f4', url: 'https://status.cloud.google.com/en/feed.atom', exclude: NOT_OUTAGE },
  { id: 'so-cloudflare', name: 'Cloudflare', region: 'Service Outages', lang: 'en', color: '#f38020', url: 'https://www.cloudflarestatus.com/history.atom', exclude: NOT_OUTAGE },
  { id: 'so-github', name: 'GitHub', region: 'Service Outages', lang: 'en', color: '#8b949e', url: 'https://www.githubstatus.com/history.rss', exclude: NOT_OUTAGE },
  { id: 'so-slack', name: 'Slack', region: 'Service Outages', lang: 'en', color: '#4a154b', url: 'https://status.slack.com/feed/rss', exclude: NOT_OUTAGE },
  { id: 'so-zoom', name: 'Zoom', region: 'Service Outages', lang: 'en', color: '#2d8cff', url: 'https://status.zoom.us/history.rss', exclude: NOT_OUTAGE },
  { id: 'so-webex', name: 'Webex', region: 'Service Outages', lang: 'en', color: '#00bceb', url: 'https://status.webex.com/history.rss', exclude: NOT_OUTAGE },
  { id: 'so-openai', name: 'OpenAI', region: 'Service Outages', lang: 'en', color: '#10a37f', url: 'https://status.openai.com/feed.rss', exclude: NOT_OUTAGE },
  { id: 'so-discord', name: 'Discord', region: 'Service Outages', lang: 'en', color: '#5865f2', url: 'https://discordstatus.com/history.rss', exclude: NOT_OUTAGE },
  { id: 'so-news', name: 'Google News: Outages', region: 'Service Outages', lang: 'en', color: '#f59e0b', url: 'https://news.google.com/rss/search?q=intitle%3A%28outage+OR+outages+OR+%22is+down%22+OR+%22went+down%22%29+when%3A1d&hl=en-US&gl=US&ceid=US:en' },

  // ── Vendor Security Advisories ───────────────────────────────────
  { id: 'va-msrc', name: 'Microsoft (MSRC)', region: 'Vendor Security Advisories', lang: 'en', color: '#0078d4', url: 'https://api.msrc.microsoft.com/update-guide/rss' },
  { id: 'va-cisco', name: 'Cisco PSIRT', region: 'Vendor Security Advisories', lang: 'en', color: '#049fd9', url: 'https://sec.cloudapps.cisco.com/security/center/psirtrss20/CiscoSecurityAdvisory.xml', alt: ['https://tools.cisco.com/security/center/psirtrss20/CiscoSecurityAdvisory.xml', 'https://sec.cloudapps.cisco.com/security/center/psirtrss10/CiscoSecurityAdvisory.xml', 'https://news.google.com/rss/search?q=Cisco+intitle%3A(vulnerability+OR+vulnerabilities+OR+advisory+OR+patches)+when%3A2d&hl=en-US&gl=US&ceid=US:en'] },
  { id: 'va-fortinet', name: 'Fortinet PSIRT', region: 'Vendor Security Advisories', lang: 'en', color: '#ee3124', url: 'https://filestore.fortinet.com/fortiguard/rss/ir.xml' },
  { id: 'va-paloalto', name: 'Palo Alto Networks', region: 'Vendor Security Advisories', lang: 'en', color: '#fa582d', url: 'https://security.paloaltonetworks.com/rss.xml' },
  { id: 'va-chrome', name: 'Chrome Releases', region: 'Vendor Security Advisories', lang: 'en', color: '#34a853', url: 'https://chromereleases.googleblog.com/feeds/posts/default' },
  { id: 'va-zdi', name: 'Zero Day Initiative', region: 'Vendor Security Advisories', lang: 'en', color: '#a855f7', url: 'https://www.zerodayinitiative.com/rss/published/' },
  { id: 'va-msisac', name: 'MS-ISAC (CIS) Advisories', region: 'Vendor Security Advisories', lang: 'en', color: '#2563eb', url: 'https://www.cisecurity.org/feed/advisories' },
  { id: 'va-certeu', name: 'CERT-EU Advisories', region: 'Vendor Security Advisories', lang: 'en', color: '#1d4ed8', url: 'https://cert.europa.eu/publications/security-advisories-rss' },

  // ── Threat Intelligence (vendor research teams) ─────────────────
  { id: 'ti-talos', name: 'Cisco Talos', region: 'Threat Intelligence', lang: 'en', color: '#049fd9', url: 'https://blog.talosintelligence.com/rss/' },
  { id: 'ti-unit42', name: 'Unit 42', region: 'Threat Intelligence', lang: 'en', color: '#fa582d', url: 'https://unit42.paloaltonetworks.com/feed/' },
  { id: 'ti-gti', name: 'Google Threat Intelligence', region: 'Threat Intelligence', lang: 'en', color: '#4285f4', url: 'https://cloudblog.withgoogle.com/topics/threat-intelligence/rss/' },
  { id: 'ti-cpr', name: 'Check Point Research', region: 'Threat Intelligence', lang: 'en', color: '#e6007e', url: 'https://research.checkpoint.com/feed/' },
  { id: 'ti-s1', name: 'SentinelLabs', region: 'Threat Intelligence', lang: 'en', color: '#6b21a8', url: 'https://www.sentinelone.com/labs/feed/' },
  { id: 'ti-securelist', name: 'Securelist (Kaspersky)', region: 'Threat Intelligence', lang: 'en', color: '#00a88e', url: 'https://securelist.com/feed/' },
  { id: 'ti-dfir', name: 'The DFIR Report', region: 'Threat Intelligence', lang: 'en', color: '#ef4444', url: 'https://thedfirreport.com/feed/' },

  // ── Data Breaches ───────────────────────────────────────────────
  { id: 'db-hibp', name: 'Have I Been Pwned', region: 'Data Breaches', lang: 'en', color: '#2a6379', url: 'https://feeds.feedburner.com/HaveIBeenPwnedLatestBreaches' },
  { id: 'db-databreaches', name: 'DataBreaches.net', region: 'Data Breaches', lang: 'en', color: '#b91c1c', url: 'https://databreaches.net/feed/' },
  { id: 'db-ransomlive', name: 'Ransomware.live', region: 'Data Breaches', lang: 'en', color: '#dc2626', url: 'https://www.ransomware.live/rss.xml' },
  { id: 'db-news', name: 'Google News: Data breaches', region: 'Data Breaches', lang: 'en', color: '#f97316', url: 'https://news.google.com/rss/search?q=intitle%3A%28%22data+breach%22+OR+%22data+leak%22+OR+breached+OR+%22exposed+data%22%29+when%3A1d&hl=en-US&gl=US&ceid=US:en' },

  // ── Cyber Breaking News ──────────────────────────────────────────
  // One ticker: Google News cyber searches + top security outlets and
  // government feeds, filtered to breaking incidents (zero-days, breaches…).
  { id: 'cb-zeroday', name: 'Google News: Zero-days', region: 'Cyber Breaking News', lang: 'en', color: '#22d3ee', url: 'https://news.google.com/rss/search?q=intitle%3A%28%22zero-day%22+OR+%220-day%22+OR+%22actively+exploited%22+OR+%22exploited+in+the+wild%22+OR+%22emergency+patch%22%29+when%3A1d&hl=en-US&gl=US&ceid=US:en' },
  { id: 'cb-ransom', name: 'Google News: Ransomware', region: 'Cyber Breaking News', lang: 'en', color: '#22d3ee', url: 'https://news.google.com/rss/search?q=intitle%3A%28ransomware%29+when%3A1d&hl=en-US&gl=US&ceid=US:en' },
  { id: 'cb-breach', name: 'Google News: Data breaches', region: 'Cyber Breaking News', lang: 'en', color: '#22d3ee', url: 'https://news.google.com/rss/search?q=intitle%3A%28%22data+breach%22+OR+breached+OR+%22hacked%22+OR+%22cyberattack%22+OR+%22cyber+attack%22%29+when%3A1d&hl=en-US&gl=US&ceid=US:en' },
  { id: 'cb-outage', name: 'Google News: Cyber outages', region: 'Cyber Breaking News', lang: 'en', color: '#22d3ee', url: 'https://news.google.com/rss/search?q=intitle%3A%28cyberattack+OR+%22cyber+incident%22%29+intitle%3A%28outage+OR+down+OR+disrupts+OR+shut+OR+halts%29+when%3A1d&hl=en-US&gl=US&ceid=US:en' },
  { id: 'cb-gov', name: 'Google News: CISA / FBI warnings', region: 'Cyber Breaking News', lang: 'en', color: '#22d3ee', url: 'https://news.google.com/rss/search?q=intitle%3A%28CISA+OR+FBI+OR+NSA%29+intitle%3A%28warns+OR+warning+OR+urges+OR+%22emergency+directive%22+OR+advisory%29+when%3A1d&hl=en-US&gl=US&ceid=US:en' },
  { id: 'cb-bleeping', name: 'BleepingComputer', region: 'Cyber Breaking News', lang: 'en', color: '#0ea5e9', url: 'https://www.bleepingcomputer.com/feed/', filter: CYBER_BREAKING },
  { id: 'cb-thn', name: 'The Hacker News', region: 'Cyber Breaking News', lang: 'en', color: '#0ea5e9', url: 'https://feeds.feedburner.com/TheHackersNews', filter: CYBER_BREAKING },
  { id: 'cb-record', name: 'The Record', region: 'Cyber Breaking News', lang: 'en', color: '#0ea5e9', url: 'https://therecord.media/feed', filter: CYBER_BREAKING },
  { id: 'cb-secweek', name: 'SecurityWeek', region: 'Cyber Breaking News', lang: 'en', color: '#0ea5e9', url: 'https://www.securityweek.com/feed/', filter: CYBER_BREAKING },
  { id: 'cb-darkreading', name: 'Dark Reading', region: 'Cyber Breaking News', lang: 'en', color: '#0ea5e9', url: 'https://www.darkreading.com/rss.xml', filter: CYBER_BREAKING },
  { id: 'cb-krebs', name: 'Krebs on Security', region: 'Cyber Breaking News', lang: 'en', color: '#0ea5e9', url: 'https://krebsonsecurity.com/feed/', filter: CYBER_BREAKING },
  { id: 'cb-helpnet', name: 'Help Net Security', region: 'Cyber Breaking News', lang: 'en', color: '#0ea5e9', url: 'https://www.helpnetsecurity.com/feed/', filter: CYBER_BREAKING },
  { id: 'cb-cybernews', name: 'Cybernews', region: 'Cyber Breaking News', lang: 'en', color: '#0ea5e9', url: 'https://news.google.com/rss/search?q=site%3Acybernews.com+when%3A1d&hl=en-US&gl=US&ceid=US:en', filter: CYBER_BREAKING },
  { id: 'cb-sans', name: 'SANS ISC', region: 'Cyber Breaking News', lang: 'en', color: '#0ea5e9', url: 'https://isc.sans.edu/rssfeed_full.xml', filter: CYBER_BREAKING },
  { id: 'cb-cisaalerts', name: 'CISA Alerts', region: 'Cyber Breaking News', lang: 'en', color: '#3b82f6', url: 'https://www.cisa.gov/cybersecurity-advisories/alerts.xml', filter: CYBER_BREAKING },
  { id: 'cb-cisanews', name: 'CISA News', region: 'Cyber Breaking News', lang: 'en', color: '#3b82f6', url: 'https://www.cisa.gov/news.xml', filter: CYBER_BREAKING },
  { id: 'cb-ic3', name: 'FBI IC3 Public Alerts', region: 'Cyber Breaking News', lang: 'en', color: '#3b82f6', url: 'https://www.ic3.gov/PSA/RSS', filter: CYBER_BREAKING },
  { id: 'cb-kev', name: 'CISA KEV', region: 'Cyber Breaking News', lang: 'en', color: '#3b82f6', url: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json' },
  { id: 'cb-cyberscoop', name: 'CyberScoop', region: 'Cyber Breaking News', lang: 'en', color: '#0ea5e9', url: 'https://cyberscoop.com/feed/', filter: CYBER_BREAKING },
  { id: 'cb-secaffairs', name: 'Security Affairs', region: 'Cyber Breaking News', lang: 'en', color: '#0ea5e9', url: 'https://securityaffairs.com/feed', filter: CYBER_BREAKING },
  { id: 'cb-ncsc', name: 'UK NCSC News', region: 'Cyber Breaking News', lang: 'en', color: '#3b82f6', url: 'https://www.ncsc.gov.uk/api/1/services/v1/news-rss-feed.xml', filter: CYBER_BREAKING },

  // ── Breaking Across the U.S. ──────────────────────────────────
  // Google News searches + local TV stations nationwide. Stations only pass
  // incident headlines (explosions, fires, evacuations, hazmat, disasters…).
  { id: 'gn-explosion', name: 'Google News: Explosions', region: 'Breaking Across the U.S.', lang: 'en', color: '#ef4444', url: 'https://news.google.com/rss/search?q=intitle%3A%28explosion+OR+explosions+OR+blast+OR+exploded%29+when%3A1d&hl=en-US&gl=US&ceid=US:en' },
  { id: 'gn-fire', name: 'Google News: Fires', region: 'Breaking Across the U.S.', lang: 'en', color: '#ef4444', url: 'https://news.google.com/rss/search?q=intitle%3A%28%22house+fire%22+OR+%22apartment+fire%22+OR+%22warehouse+fire%22+OR+%22plant+fire%22+OR+%22massive+fire%22+OR+%22multi-alarm%22+OR+%22brush+fire%22+OR+wildfire+OR+blaze%29+when%3A1d&hl=en-US&gl=US&ceid=US:en' },
  { id: 'gn-evac', name: 'Google News: Evacuations & Hazmat', region: 'Breaking Across the U.S.', lang: 'en', color: '#ef4444', url: 'https://news.google.com/rss/search?q=intitle%3A%28evacuation+OR+evacuated+OR+%22shelter+in+place%22+OR+hazmat+OR+%22gas+leak%22+OR+%22chemical+leak%22+OR+%22chemical+spill%22%29+when%3A1d&hl=en-US&gl=US&ceid=US:en' },
  { id: 'gn-disaster', name: 'Google News: Disasters', region: 'Breaking Across the U.S.', lang: 'en', color: '#ef4444', url: 'https://news.google.com/rss/search?q=intitle%3A%28earthquake+OR+tornado+OR+derailment+OR+derails+OR+%22building+collapse%22+OR+%22bridge+collapse%22+OR+%22plane+crash%22%29+when%3A1d&hl=en-US&gl=US&ceid=US:en' },
  { id: 'gn-breaking', name: 'Google News: Breaking (U.S.)', region: 'Breaking Across the U.S.', lang: 'en', color: '#ef4444', url: 'https://news.google.com/rss/search?q=intitle%3A%22breaking+news%22+when%3A1d&hl=en-US&gl=US&ceid=US:en' },
  { id: 'abc7ny', name: 'ABC7 New York', region: 'Breaking Across the U.S.', lang: 'en', color: '#1d4ed8', url: 'https://abc7ny.com/feed/', filter: INCIDENT },
  { id: 'abc7la', name: 'ABC7 Los Angeles', region: 'Breaking Across the U.S.', lang: 'en', color: '#1d4ed8', url: 'https://abc7.com/feed/', filter: INCIDENT },
  { id: 'abc7chi', name: 'ABC7 Chicago', region: 'Breaking Across the U.S.', lang: 'en', color: '#1d4ed8', url: 'https://abc7chicago.com/feed/', filter: INCIDENT },
  { id: '6abc', name: '6abc Philadelphia', region: 'Breaking Across the U.S.', lang: 'en', color: '#1d4ed8', url: 'https://6abc.com/feed/', filter: INCIDENT },
  { id: 'abc13', name: 'ABC13 Houston', region: 'Breaking Across the U.S.', lang: 'en', color: '#1d4ed8', url: 'https://abc13.com/feed/', filter: INCIDENT },
  { id: 'abc7sf', name: 'ABC7 San Francisco', region: 'Breaking Across the U.S.', lang: 'en', color: '#1d4ed8', url: 'https://abc7news.com/feed/', filter: INCIDENT },
  { id: 'abc11', name: 'ABC11 Raleigh-Durham', region: 'Breaking Across the U.S.', lang: 'en', color: '#1d4ed8', url: 'https://abc11.com/feed/', filter: INCIDENT },
  { id: 'abc30', name: 'ABC30 Fresno', region: 'Breaking Across the U.S.', lang: 'en', color: '#1d4ed8', url: 'https://abc30.com/feed/', filter: INCIDENT },
  { id: 'nbcdfw', name: 'NBC 5 Dallas-Fort Worth', region: 'Breaking Across the U.S.', lang: 'en', color: '#7c3aed', url: 'https://www.nbcdfw.com/?rss=y', filter: INCIDENT },
  { id: 'nbcmia', name: 'NBC 6 Miami', region: 'Breaking Across the U.S.', lang: 'en', color: '#7c3aed', url: 'https://www.nbcmiami.com/?rss=y', filter: INCIDENT },
  { id: 'nbcdc', name: 'NBC4 Washington', region: 'Breaking Across the U.S.', lang: 'en', color: '#7c3aed', url: 'https://www.nbcwashington.com/?rss=y', filter: INCIDENT },
  { id: 'nbcbos', name: 'NBC10 Boston', region: 'Breaking Across the U.S.', lang: 'en', color: '#7c3aed', url: 'https://www.nbcboston.com/?rss=y', filter: INCIDENT },
  { id: 'nbcsd', name: 'NBC 7 San Diego', region: 'Breaking Across the U.S.', lang: 'en', color: '#7c3aed', url: 'https://www.nbcsandiego.com/?rss=y', filter: INCIDENT },
  { id: 'nbcct', name: 'NBC Connecticut', region: 'Breaking Across the U.S.', lang: 'en', color: '#7c3aed', url: 'https://www.nbcconnecticut.com/?rss=y', filter: INCIDENT },
  { id: 'cbsden', name: 'CBS Colorado (Denver)', region: 'Breaking Across the U.S.', lang: 'en', color: '#0f766e', url: 'https://www.cbsnews.com/colorado/latest/rss/main', filter: INCIDENT },
  { id: 'cbsmn', name: 'WCCO Minnesota', region: 'Breaking Across the U.S.', lang: 'en', color: '#0f766e', url: 'https://www.cbsnews.com/minnesota/latest/rss/main', filter: INCIDENT },
  { id: 'cbspit', name: 'KDKA Pittsburgh', region: 'Breaking Across the U.S.', lang: 'en', color: '#0f766e', url: 'https://www.cbsnews.com/pittsburgh/latest/rss/main', filter: INCIDENT },
  { id: 'cbsbal', name: 'WJZ Baltimore', region: 'Breaking Across the U.S.', lang: 'en', color: '#0f766e', url: 'https://www.cbsnews.com/baltimore/latest/rss/main', filter: INCIDENT },
  { id: 'cbsdet', name: 'WWJ Detroit', region: 'Breaking Across the U.S.', lang: 'en', color: '#0f766e', url: 'https://www.cbsnews.com/detroit/latest/rss/main', filter: INCIDENT },
  { id: 'cbssac', name: 'KOVR Sacramento', region: 'Breaking Across the U.S.', lang: 'en', color: '#0f766e', url: 'https://www.cbsnews.com/sacramento/latest/rss/main', filter: INCIDENT },
  { id: 'khou', name: 'KHOU 11 Houston', region: 'Breaking Across the U.S.', lang: 'en', color: '#dc2626', url: 'https://www.khou.com/feeds/syndication/rss/news', filter: INCIDENT },
  { id: 'wfaa', name: 'WFAA Dallas', region: 'Breaking Across the U.S.', lang: 'en', color: '#dc2626', url: 'https://www.wfaa.com/feeds/syndication/rss/news', filter: INCIDENT },
  { id: '11alive', name: '11Alive Atlanta', region: 'Breaking Across the U.S.', lang: 'en', color: '#dc2626', url: 'https://www.11alive.com/feeds/syndication/rss/news', filter: INCIDENT },
  { id: '9news', name: '9News Denver', region: 'Breaking Across the U.S.', lang: 'en', color: '#dc2626', url: 'https://www.9news.com/feeds/syndication/rss/news', filter: INCIDENT },
  { id: 'king5', name: 'KING 5 Seattle', region: 'Breaking Across the U.S.', lang: 'en', color: '#dc2626', url: 'https://www.king5.com/feeds/syndication/rss/news', filter: INCIDENT },
  { id: 'ksdk', name: 'KSDK St. Louis', region: 'Breaking Across the U.S.', lang: 'en', color: '#dc2626', url: 'https://www.ksdk.com/feeds/syndication/rss/news', filter: INCIDENT },
  { id: 'wkyc', name: 'WKYC Cleveland', region: 'Breaking Across the U.S.', lang: 'en', color: '#dc2626', url: 'https://www.wkyc.com/feeds/syndication/rss/news', filter: INCIDENT },
  { id: '12news', name: '12News Phoenix', region: 'Breaking Across the U.S.', lang: 'en', color: '#dc2626', url: 'https://www.12news.com/feeds/syndication/rss/news', filter: INCIDENT },
  { id: 'kens5', name: 'KENS 5 San Antonio', region: 'Breaking Across the U.S.', lang: 'en', color: '#dc2626', url: 'https://www.kens5.com/feeds/syndication/rss/news', filter: INCIDENT },
  { id: 'wwl', name: 'WWL New Orleans', region: 'Breaking Across the U.S.', lang: 'en', color: '#dc2626', url: 'https://www.wwltv.com/feeds/syndication/rss/news', filter: INCIDENT },
  { id: 'wtsp', name: '10 Tampa Bay', region: 'Breaking Across the U.S.', lang: 'en', color: '#dc2626', url: 'https://www.wtsp.com/feeds/syndication/rss/news', filter: INCIDENT },
  { id: 'kgw', name: 'KGW Portland', region: 'Breaking Across the U.S.', lang: 'en', color: '#dc2626', url: 'https://www.kgw.com/feeds/syndication/rss/news', filter: INCIDENT },
  { id: 'wbir', name: 'WBIR Knoxville', region: 'Breaking Across the U.S.', lang: 'en', color: '#dc2626', url: 'https://www.wbir.com/feeds/syndication/rss/news', filter: INCIDENT },
  { id: 'fox26', name: 'FOX 26 Houston', region: 'Breaking Across the U.S.', lang: 'en', color: '#0b3b8f', url: 'https://www.fox26houston.com/rss/category/news', filter: INCIDENT },
  { id: 'fox5atl', name: 'FOX 5 Atlanta', region: 'Breaking Across the U.S.', lang: 'en', color: '#0b3b8f', url: 'https://www.fox5atlanta.com/rss/category/news', filter: INCIDENT },
  { id: 'fox10phx', name: 'FOX 10 Phoenix', region: 'Breaking Across the U.S.', lang: 'en', color: '#0b3b8f', url: 'https://www.fox10phoenix.com/rss/category/news', filter: INCIDENT },

  // ── Weather & Disasters ────────────────────────────────────────
  { id: 'usgs',       name: 'USGS Earthquakes (M4.5+)', region: 'Weather & Disasters', lang: 'en', color: '#c05621', url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.atom' },
  { id: 'gdacs',      name: 'Global Disaster Alerts (GDACS)', region: 'Weather & Disasters', lang: 'en', color: '#e53e3e', url: 'https://www.gdacs.org/xml/rss.xml' },
  { id: 'nhc',        name: 'National Hurricane Center', region: 'Weather & Disasters', lang: 'en', color: '#3182ce', url: 'https://www.nhc.noaa.gov/index-at.xml' },

  // ── Gaming ─────────────────────────────────────────────────────
  { id: 'pcgamer',    name: 'PC Gamer',          region: 'Gaming', lang: 'en', color: '#d4202c', url: 'https://www.pcgamer.com/rss/' },
  { id: 'ign',        name: 'IGN',               region: 'Gaming', lang: 'en', color: '#bf1313', url: 'https://feeds.ign.com/ign/all' },
  { id: 'polygon',    name: 'Polygon',           region: 'Gaming', lang: 'en', color: '#ff0a7a', url: 'https://www.polygon.com/rss/index.xml' },
  { id: 'rps',        name: 'Rock Paper Shotgun',region: 'Gaming', lang: 'en', color: '#e2231a', url: 'https://www.rockpapershotgun.com/feed' }
];
