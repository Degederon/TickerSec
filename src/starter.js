// Categories offered on the first-run welcome screen.
// Each one installs a small, ready-picked set of sources.
// Chosen categories start expanded (title strip + one bar per source); click the strip to collapse.

const PRESETS = require('./presets');
// Every source in a group, in catalog order (stays complete if sources are added).
const all = region => PRESETS.filter(p => p.region === region).map(p => p.id);

module.exports = [
  { id: 'cyberbreaking', icon: '⚡', name: 'Cyber Breaking News', desc: 'One ticker, consolidated feed: zero-days, breaches, ransomware and CISA/FBI warnings from top security sources', sources: all('Cyber Breaking News'), category: 'Cyber Breaking News' },
  { id: 'usbreaking', icon: '🚨', name: 'Breaking Across the U.S.', desc: 'One ticker, consolidated feed: explosions, fires, evacuations and disasters from local TV stations nationwide', sources: all('Breaking Across the U.S.'), category: 'Breaking Across the U.S.' },
  { id: 'power', icon: '⚡', name: 'Power Related News', desc: 'One ticker, consolidated feed: power outage news, ERCOT/CenterPoint and major utilities, local restoration updates and outage counts', sources: all('Power Related News'), category: 'Power Related News' },
  { id: 'telecom', icon: '📶', name: 'Internet & Telecom News', desc: 'One ticker, consolidated feed: Xfinity, Spectrum, AT&T, Verizon, T-Mobile, Starlink and more, 911 outages and Downdetector user-report news', sources: all('Internet & Telecom News'), category: 'Internet & Telecom News' },
  { id: 'outages', icon: '⚠️', name: 'Service Outages', desc: 'One ticker, consolidated feed: outages at AWS, Azure, Microsoft 365, Google Cloud, Cloudflare, GitHub and more', sources: all('Service Outages'), category: 'Service Outages' },
  { id: 'advisories', icon: '🧩', name: 'Vendor Security Advisories', desc: 'One ticker, consolidated feed: Microsoft, Cisco, Fortinet, Palo Alto, Chrome and other patch-now advisories', sources: all('Vendor Security Advisories'), category: 'Vendor Security Advisories' },
  { id: 'us',       icon: '🇺🇸', name: 'U.S. News',              desc: 'All the major U.S. news agencies',            sources: all('United States'), category: 'United States' },
  { id: 'threatintel', icon: '🔬', name: 'Threat Intelligence', desc: 'Research from Talos, Unit 42, Google/Mandiant, Check Point, SentinelLabs and more', sources: all('Threat Intelligence'), category: 'Threat Intelligence' },
  { id: 'breaches', icon: '🔓', name: 'Data Breaches', desc: 'New breaches from Have I Been Pwned, DataBreaches.net, Ransomware.live and the news', sources: all('Data Breaches'), category: 'Data Breaches' },
  { id: 'world',    icon: '🌍', name: 'World News',             desc: 'What is happening around the globe',         sources: ['bbcworld', 'aljazeera'] },
  { id: 'cyber',    icon: '🛡️', name: 'Cybersecurity',          desc: 'Every cybersecurity source: hacks, breaches and research', sources: all('Cybersecurity'), category: 'Cybersecurity' },
  { id: 'govcyber', icon: '🏛️', name: 'Government Cyber Alerts', desc: 'Every government source: CISA, FBI & IC3, UK, Canada, Australia', sources: all('Government Cyber Alerts'), category: 'Government Cyber Alerts' },
  { id: 'tech',     icon: '💻', name: 'Technology',             desc: 'Gadgets, software and the tech industry',    sources: ['ars', 'verge', 'techcrunch'], category: 'Technology' },
  { id: 'science',  icon: '🔭', name: 'Science & Space',        desc: 'Discoveries, NASA and the night sky',        sources: ['nasa', 'spacecom', 'bbcsci'], category: 'Science & Space' },
  { id: 'health',   icon: '🩺', name: 'Health',                 desc: 'Medicine, wellness and public health',       sources: ['nprhealth', 'bbchealth', 'who'], category: 'Health' },
  { id: 'business', icon: '📈', name: 'Business & Markets',     desc: 'Markets, money and the economy',             sources: ['cnbc', 'marketwatch', 'bbcbiz'], category: 'Business & Markets' },
  { id: 'sports',   icon: '🏈', name: 'Sports',                 desc: 'Scores, trades and big games',               sources: ['espn', 'cbssports', 'bbcsport'], category: 'Sports' },
  { id: 'weather',  icon: '🌪️', name: 'Weather & Disasters',    desc: 'Hurricanes, earthquakes and alerts',         sources: ['nhc', 'usgs', 'gdacs'], category: 'Weather & Disasters' },
  { id: 'gaming',   icon: '🎮', name: 'Gaming',                 desc: 'Game news, reviews and releases',            sources: ['pcgamer', 'ign', 'polygon'], category: 'Gaming' }
];
