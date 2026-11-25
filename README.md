<p align="center">
  <img src="icon.svg" width="96" alt="TickerSec icon">
</p>

<h1 align="center">TickerSec</h1>

<p align="center"><b>Breaking news and cybersecurity alerts right on your Windows desktop — live, scrolling, and impossible to miss.</b></p>

<p align="center">
  <img src="https://img.shields.io/badge/Windows-10%20%7C%2011-0078D6?logo=windows&logoColor=white" alt="Windows 10 | 11">
  <img src="https://img.shields.io/badge/Electron-33-47848F?logo=electron&logoColor=white" alt="Electron 33">
  <img src="https://img.shields.io/badge/version-2.8.7-8A2BE2" alt="Version 2.8.7">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License MIT">
</p>

## What it does

| Area | Items |
|---|---|
| 📰 **News agencies** | 186 built-in sources in 22 groups — world news by region (BBC, NPR, NYT, Fox, Al Jazeera, DW, Le Monde, NHK…), Cybersecurity, Government Cyber Alerts (CISA, FBI & IC3, UK NCSC, Canada, Australia), Threat Intelligence, Data Breaches, Vendor Security Advisories, Service Outages, Power and Internet & Telecom news, Technology, Science & Space, Health, Business & Markets, Sports, Weather & Disasters and Gaming — and any RSS or Atom feed you add |
| 👁 **Watchlist** | Name the companies you care about — your bank, employer, vendors — or add one-click starter lists, and any ticker flags them the moment they're in a breach, hack or outage |
| 🏢 **Industry tickers** | Eight tickers of cyber incidents by industry: Finance & Crypto, Tech & SaaS, Healthcare & Pharma, Retail & Hospitality, Telecom & Media, Travel & Logistics, Industrial, Energy & Automotive, Education, Government & Nonprofit |
| 📡 **Local TV** | About 400 local TV news stations in 190+ markets across the U.S. — pick a whole state, a TV market or single stations, in one ticker or one per state |
| 📺 **Tickers** | One scrolling bar per agency, stacked at the top or bottom of the screen or in a window; topic categories get a title strip and collapse into one combined bar; consolidated tickers (Cyber Breaking News, Breaking Across the U.S., Local TV, industries…) merge many sources into one bar, newest first |
| 🔔 **Alerts** | Keyword and watchlist alerts, BREAKING detection, a one-time glow for new alert headlines, alert pop-ups or Windows notifications and an optional chime (5 sounds) with quiet hours |
| 🌐 **Translation** | Headlines from other languages translated into yours, with the original shown on hover |
| ⚙️ **Settings page** | A Status page with the health of every feed, quick actions and a live preview; News agencies, Local TV and Industries & Watchlist pages; drag to reorder, rename and recolor bars, tune size, speed, opacity and refresh timing |

## Features

- **CISA KEV** — actively exploited vulnerabilities straight from CISA's catalog
- **Power & telecom news** — two consolidated tickers: power outage news (news, ERCOT/CenterPoint and major utilities) and internet & phone outage news (Xfinity, Spectrum, AT&T, Verizon, T-Mobile, Starlink, 911), plus local restoration news, outage counts and Downdetector user-report news
- **Security operations** — Service Outages (one consolidated ticker from AWS, Azure, Microsoft 365, Google Cloud, Cloudflare, GitHub and more), Vendor Security Advisories, Threat Intelligence and Data Breaches
- **Cyber Breaking News** — one ticker, consolidated feed, for zero-days, breaches, ransomware and CISA/FBI warnings from Google News, top security outlets and government feeds, newest first
- **Breaking Across the U.S.** — one ticker, consolidated feed, watching Google News and 36 local TV stations nationwide for explosions, fires, evacuations, hazmat and disasters, newest first, each headline tagged with its station
- **Watchlist** — add companies and organizations (or one-click starter lists: big U.S. banks, credit bureaus & payments, cloud & SaaS, carriers, airlines, retail, healthcare, crypto exchanges). A headline that mentions one — in any ticker — gets a cyan highlight and a 👁 tag, with an optional alert pop-up. *Only security news* (on by default) keeps it to breaches, hacks, ransomware, leaks and outages
- **Industry tickers** — eight tickers of cyber incidents (breaches, ransomware, hacks, leaks and outages) by industry, each built from a news search plus ten security news sites, newest first. Tick only the industries you follow; the industry list refreshes itself from this repository between versions:
  - 🏦 **Finance & Crypto** — Banks, credit unions, payments, credit bureaus, insurers, brokers and crypto exchanges
  - ☁️ **Tech & SaaS** — Cloud and SaaS providers, software makers and developer platforms
  - 🏥 **Healthcare & Pharma** — Hospitals, health systems, clinics, insurers, pharmacies and pharma
  - 🛍️ **Retail & Hospitality** — Retailers, online stores, restaurants, hotels and casinos
  - 📡 **Telecom & Media** — Mobile carriers, ISPs and broadband, broadcasters, streaming and publishers
  - ✈️ **Travel & Logistics** — Airlines, airports, travel and booking, rail, shipping, freight and couriers
  - 🏭 **Industrial, Energy & Automotive** — Manufacturing, factories and OT/ICS, utilities, oil & gas, water, automakers and dealers
  - 🎓 **Education, Government & Nonprofit** — Schools and universities, cities, counties and agencies, charities and nonprofits
- **Local TV** — about 400 local TV news stations across the U.S., grouped by state and TV market. Tick a whole state, a market (a city and the area it covers, even across state lines — New Jersey, for example, gets New York and Philadelphia) or single stations; the list opens on the states in your time zone. They scroll in one Local TV ticker, newest first — or one ticker per state — with an optional *Breaking only* filter. A whole state or market also picks up stations added later, and the station list refreshes itself from this repository between versions
- **Window mode** — show the tickers in a normal window you can move, resize and minimize; docked tickers scroll when there are more than fit
- **On/Off switch** — turn TickerSec off (no tickers, headlines or alerts) and back on from Settings, the tray, or Ctrl + Alt + T; remembered after a restart
- **Status page** — Settings opens on a live overview: feeds working, headline count, last refresh and memory, every feed with a green / amber (backup) / red dot and the reason it failed, plus quick actions (refresh, hide, refresh the tickers, open the log, click report)
- **Live preview** — the Display and Alerts pages show sample tickers that change as you move the sliders
- **Automatic updates** — every install checks this repository; when a newer version is out, a small panel slides up once and installs it in one click (also from the tray and Settings), with the download verified against its checksum
- **Stays responsive** — the ticker window quietly rebuilds itself every few hours and after sleep, and old data is trimmed, so a TickerSec left running for days stays quick
- **Collapsible categories** — Cybersecurity, Technology and other topic groups get a slim title strip; click it to combine the group into one bar (each headline tagged with its source), click the bar's label to expand again — also in the tray menu
- **Select all / Deselect all** — turn a whole region or category on or off in one click
- **Seamless scrolling** — smooth, continuous ticker loop; new headlines are swapped in at the end of a pass so nothing jumps
- **NEW tags** — fresh headlines get a red **NEW** tag, and each one shows its age (e.g. 12m)
- **Keyword alerts** — list words or phrases ("Steelers", "Oak Creek", "hurrican*"); matching headlines are highlighted in gold and can raise an alert pop-up even while the tickers are hidden
- **Breaking detection** — headlines starting with BREAKING, LIVE, WATCH LIVE, URGENT, JUST IN or DEVELOPING turn red and jump to the front of their bar
- **Alert pop-ups** — a glass pop-up slides in at the bottom-right (always shows), or use Windows notifications, or both
- **Preview buttons** — see exactly what a NEW, keyword or breaking headline, the glow, each pop-up and the chime look and sound like
- **glow (0–10 passes)** — a brand-new alert headline pulses the first time it scrolls by
- **Soft chime** — optional sound for new alerts, with quiet hours for the night
- **Cybersecurity sources** — CISA advisories, Krebs on Security, The Hacker News, BleepingComputer, Dark Reading, SecurityWeek, The Record, SANS ISC and more
- **Test all agencies** — one click checks every source and outlines it green or red
- **Only NEW filter** — scroll just the fresh headlines (switch it on in Settings or straight from the tray menu)
- **Click to read** — click any headline to open the full story in your browser; hover pauses the bar
- **On top or behind** — by default the files and programs you open come in front of the tickers; switch on "Keep tickers on top" to keep them above everything
- **Click-through mode** — make the bars ignore the mouse so you can work underneath them
- **Four translation services** — Google (free, no key), MyMemory (free), LibreTranslate (self-hosted or hosted) and DeepL (API key)
- **Browser fallback** — if a site answers with a block or bot-check page, the feed is read through a hidden built-in browser instead
- **Feed tester** — check any feed address before adding it, and see a live status dot for every agency
- **Multi-monitor** — choose which screen the tickers sit on
- **Tray app** — hide/show, pause, refresh now and Settings from the tray icon; **Ctrl + Alt + N** hides or shows the tickers
- **Start with Windows** option

## Install

1. Download **[TickerSec-Setup.exe](https://github.com/Degederon/TickerSec/raw/main/TickerSec-Setup.exe)** from this repository.
2. Run it. It's one click: no questions. If an older version is installed or running, Setup closes it, uninstalls it and installs the new one — your settings and agencies are kept.
3. On a new install, a short welcome greets you, explains what TickerSec does, and lets you pick up to 4 categories (U.S. News, World News, Cybersecurity, Government Cyber Alerts, Technology, Science & Space, Health, Business & Markets, Sports, Weather & Disasters, Gaming) and whether the tickers sit at the top or bottom. TickerSec is then set up with exactly that. Fine-tune any time in Settings. Upgrading keeps your current setup — no questions.

> Windows SmartScreen may say "Windows protected your PC" because the installer isn't code-signed — click **More info → Run anyway**.

### Uninstall

Windows Settings → Apps → TickerSec → Uninstall. TickerSec asks once whether to keep your settings: **Yes** keeps your news services, alerts and other settings for a future reinstall; **No** removes everything — settings, saved sign-ins, caches and leftover update downloads — as if it was never installed; **Cancel** keeps it installed.

### Open Settings any time

Right-click a ticker, click the tray icon, or start the app again.

## Privacy

TickerSec talks only to the feed addresses you choose, to GitHub to check for updates (and for newer Local TV and industry lists) and, if translation is turned on, to the translation service you pick (headlines only). Settings stay on your PC in `%APPDATA%\TickerSec\settings.json`. No accounts, no tracking.

## Formerly Breaking News

TickerSec was called **Breaking News** up to version 1.6.1. Installed copies upgrade to TickerSec automatically and keep their settings.

## License

[MIT](LICENSE) © 2026 Degederon · [EPOMD Training Labs, EZ Tools and More](https://www.youtube.com/@epomd)
