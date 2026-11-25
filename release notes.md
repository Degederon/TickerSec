# TickerSec release notes

## 2.8.7
- **New: Watchlist** — add the companies you care about (or one-click starter lists: banks, credit bureaus & payments, cloud & SaaS, carriers, airlines, retail, healthcare, crypto exchanges). Any ticker flags a headline that mentions one with a cyan highlight and a 👁 tag, plus an optional alert pop-up. *Only security news* keeps it to breaches, hacks, ransomware, leaks and outages.
- **New: Industry tickers** — eight tickers of cyber incidents by industry (Finance & Crypto, Tech & SaaS, Healthcare & Pharma, Retail & Hospitality, Telecom & Media, Travel & Logistics, Industrial, Energy & Automotive, Education, Government & Nonprofit).
- Both are in Settings → Industries & Watchlist, off until you choose. The industry list (industries.json in this repository) refreshes itself between versions.
- Feeds used by several tickers are now fetched once and shared.

## 2.8.6
- **New: Local TV** — about 400 local TV news stations across the U.S. in Settings → Local TV. Pick a whole state, a TV market (it covers neighbouring states too) or single stations; they scroll in one Local TV ticker, newest first, or one ticker per state. Optional *Breaking only* filter.
- The list opens on the states in your time zone, and *Test all stations* checks every feed (results can be saved as a CSV).
- The station list (local-tv.json in this repository) refreshes itself between versions — new and fixed stations arrive without a new install.

## 2.8.5
- Update test: same as 2.8.4 — confirms automatic updates from this repository work.

## 2.8.4
- **Updates now come straight from this GitHub repository.**
- **New Settings** — a Status page (feed health, quick actions), a Headlines page, and a live preview on Display and Alerts.
- **Fixed: headlines that stop opening** after TickerSec has run for a while.
- The tickers stay full after a self-refresh.

> If TickerSec 2.7.6 – 2.8.2 says it can't check for updates, download **TickerSec-Setup.exe** from this repository once — it updates itself from then on.
