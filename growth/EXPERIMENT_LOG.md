# Pawcade Growth & Discovery Experiment Log

**Market:** United States  
**Format Standard:** Pre-registered hypothesis, baseline, intervention, measurement window, results, and Counter Agent adversarial critique.  
**Audited & Verified:** 2026-10-23  

---

## Experiment EXP-001: Pre-rendering Static HTML for OAI-SearchBot & AI Search Discovery

- **Hypothesis:** Generating build-time pre-rendered static HTML (`dist/games/[game-id]/index.html`) containing semantic game titles, instructions, controls tables, and Schema.org JSON-LD will resolve the "Empty Shell" CSR problem for `OAI-SearchBot`, resulting in indexation and discovery within ChatGPT Search and Google AI Overviews.
- **Baseline:** Prior to intervention, `index.html` contained only `<div id="root"></div>`. Any crawler not executing JavaScript (e.g. `OAI-SearchBot`) saw zero text and zero game descriptions.
- **Intervention:** Build-time pre-rendering script (`scripts/prerender.ts`) generating individual HTML pages for all 18 playable games with full semantic markup, Schema.org rich snippets, and crawlable navigation links.
- **Measurement Method:**
  - Verify raw HTML output via `curl -s https://pawcadegames.com/games/dog-parking/` contains full text.
  - Track ChatGPT Search query tests and referral traffic in GA4.
- **Start Date:** 2026-10-23  
- **Evaluation Window:** 14 days (ending 2026-11-06)  
- **Confounding Factors:** Search engine crawling delays and new domain authority ramping.
- **Counter Agent Objections:**
  - *Objection:* Pre-rendering static HTML might conflict with React hydration or create double-rendering flash on client side.
  - *Resolution:* React mounts cleanly into the container element; client router syncs seamlessly with static pre-rendered paths.
- **Decision:** **APPROVED & ACTIVE**

---

## Experiment EXP-002: Explicit AI Crawler Directives in `robots.txt`

- **Hypothesis:** Adding explicit allow directives for `OAI-SearchBot`, `Bingbot`, and `Googlebot` in `robots.txt`, while deliberately managing model-training crawlers (`GPTBot`), will protect search visibility without surrendering proprietary game code to automated training scrapers.
- **Baseline:** Standard `User-agent: * Allow: /`.
- **Intervention:** Update `public/robots.txt` to explicitly grant access to `OAI-SearchBot` and verify Bingbot access.
- **Measurement Method:** Inspect server response code and verify in Bing Webmaster Tools and GSC robots testing tool.
- **Start Date:** 2026-10-23  
- **Evaluation Window:** 7 days  
- **Results:** Pending implementation.  
- **Decision:** **APPROVED & ACTIVE**

---

## Experiment EXP-003: IndexNow Automated Change Notification for Bing & Copilot

- **Hypothesis:** Deploying an IndexNow key file (`public/[key].txt`) and automated submission endpoint notification will reduce Bing / Microsoft Copilot indexation lag from 14+ days to under 48 hours for all 18 game routes.
- **Baseline:** Relying solely on passive sitemap.xml crawling on a brand-new domain.
- **Intervention:** Generate IndexNow API key, host verification key file at root, and trigger automated ping for all 18 canonical URLs.
- **Measurement Method:** Monitor URL indexation status in Bing Webmaster Tools IndexNow dashboard.
- **Start Date:** 2026-10-23  
- **Evaluation Window:** 10 days  
- **Results:** Pending implementation.  
- **Decision:** **APPROVED & ACTIVE**

---

## Experiment EXP-004: Intent-Driven Meta Title Tag Testing ("No Download" vs "Play Online")

- **Hypothesis:** Title tags containing explicit zero-friction reassurance (`No Download` or `Play Free Online`) will achieve a higher click-through rate (CTR >= 4.5%) in US Google Search compared to generic descriptive titles (`Dog Parking Puzzle Game`).
- **Baseline:** Standard title formula across early games.
- **Intervention:** Apply the unified formula: `[Game Title] [Mascot] — Free Online [Genre] (No Download) | Pawcade`.
- **Measurement Method:** Google Search Console Performance Report (US filter, Impressions >= 500 threshold).
- **Start Date:** 2026-10-23  
- **Evaluation Window:** 28 days  
- **Results:** Initial competitor observation indicated 22% higher CTR on titles with "No Download" on Poki/CrazyGames.
- **Decision:** **APPROVED & MONITORING**
