# Pawcade Organic Growth & Discovery Priority Roadmap (US Market)

**Domain:** `https://pawcadegames.com/`  
**Market:** United States (`en-US`)  
**Lead Architect:** Queen Agent  
**Collaborators:** Organic Discovery Strategist, SEO Agent, Counter Agent  
**Last Updated:** 2026-10-23  
**Status:** Approved for Implementation Staging  

---

## Roadmap Overview & Prioritization Matrix

Initiatives are prioritized using the **ICE Scoring Framework** (Impact, Confidence, Effort) calibrated against the findings of `/growth/INITIAL_AUDIT.md`:

```
Score = (Impact [1-10] * Confidence [1-10]) / Effort [1-10]
```

- **P0: Technical Blockers** (Must fix immediately; eliminates critical crawl budget waste, canonical dilution, and social sharing defects).
- **P1: High-Impact Content & Discoverability** (Expands indexable keyword coverage and improves engagement loops).
- **P2: Research, Ecosystem & Outreach** (Fast-tracks search engine ingestion and earns authoritative editorial references).
- **P3: Speculative Experiments** (Data-driven optimizations to be tested once steady traffic is established).

---

## 🚨 P0: Critical Technical Blockers

| ID | Initiative & Description | Owner | Dependencies | Acceptance Criteria | Impact (1-10) | Confidence (1-10) | Effort (1-10) | ICE Score | Measurement Method |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **P0-1** | **Eliminate Soft 404 via Cloudflare `404-page` Config**<br>Replace SPA fallback with a true `404.html` returning HTTP 404 for invalid paths. | SEO Agent / Queen Agent | `wrangler.json`, `dist/404.html` | `curl -sI https://pawcadegames.com/non-existent-random-route` returns `HTTP/2 404 Not Found` with a styled 404 page. | **9** | **10** | **2** (1 hr) | **45.0** | HTTP response header check via curl & GSC Crawl Stats report. |
| **P0-2** | **Enforce WWW to Apex Permanent 301 Redirect**<br>Configure Cloudflare edge rule redirecting `www.pawcadegames.com/*` to `pawcadegames.com/*`. | DevOps / Queen Agent | Cloudflare Dashboard / DNS | `curl -sI https://www.pawcadegames.com/` returns `HTTP/2 301 Moved Permanently` with `Location: https://pawcadegames.com/`. | **8** | **10** | **1** (15 min) | **80.0** | HTTP header curl inspection on both apex and www. |
| **P0-3** | **Deploy Branded Root OG Image & Game-Specific Social Meta**<br>Create 1200x630 `public/og-pawcade.png` and update `scripts/prerender.ts` to inject each game's thumbnail into `og:image` and `twitter:image`. | Creative / SEO Agent | `public/assets/thumbnails/`, `scripts/prerender.ts` | 1. `curl -sI https://pawcadegames.com/og-pawcade.png` returns HTTP 200 with `image/png`.<br>2. Each pre-rendered game page references its specific thumbnail in `og:image`. | **8** | **10** | **2** (1 hr) | **40.0** | OpenGraph image MIME inspection and Discord/Twitter link preview rendering. |

---

## ⚡ P1: High-Impact Content & Discoverability Improvements

| ID | Initiative & Description | Owner | Dependencies | Acceptance Criteria | Impact (1-10) | Confidence (1-10) | Effort (1-10) | ICE Score | Measurement Method |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **P1-1** | **Create & Pre-render Static Category Landing Pages**<br>Deploy dedicated pre-rendered routes for `/category/puzzle/`, `/category/farm/`, `/category/arcade/`, and `/category/pets/` with filtered bento grids and semantic copy. | Fullstack / SEO Agent | `App.tsx`, `scripts/prerender.ts`, `sitemap.xml` | `curl -sI https://pawcadegames.com/category/puzzle/` returns HTTP 200 with pre-rendered semantic HTML and `CollectionPage` Schema. | **9** | **9** | **4** (3 hrs) | **20.3** | GSC impression share for broad US genre queries (`puzzle games online`, `farm games browser`). |
| **P1-2** | **Activate Semantic Breadcrumb Internal Links**<br>Convert plain text `<span>` category breadcrumbs into active crawlable links (`<a href="/category/[cat]/">`). | SEO Agent | P1-1 (Category pages), `scripts/prerender.ts` | All 18 pre-rendered game pages contain clickable category breadcrumb links. | **7** | **10** | **1** (30 min) | **70.0** | Schema.org BreadcrumbList validation in Google Rich Results Test. |
| **P1-3** | **Inject Structured Q&A (GEO/AEO) & `FAQPage` Schema**<br>Add 3 concise, natural-language question-answer pairs per game page answering common US search queries (free status, school safety, controls) with JSON-LD. | Discovery Strategist / SEO Agent | `scripts/prerender.ts` | Google Rich Results Test validates `FAQPage` schema on all 18 game pages; text is visible in raw HTML for `OAI-SearchBot`. | **8** | **9** | **3** (2 hrs) | **24.0** | OpenAI `OAI-SearchBot` crawl log verification and Google AI Overview citations. |
| **P1-4** | **Post-Game "Play Next" Discovery Loop**<br>Embed a 3-game recommendation carousel into the Victory and Game Over dialogs across all 18 games. | Game Designer / Frontend | Game Container Modals | Players finishing any level can click a related game and start playing with zero navigation back to the homepage. | **8** | **9** | **3** (2 hrs) | **24.0** | GA4 `game_start` events per session (target: >= 2.5 games per visit). |

---

## 🔍 P2: Research, Ecosystem & Outreach Opportunities

| ID | Initiative & Description | Owner | Dependencies | Acceptance Criteria | Impact (1-10) | Confidence (1-10) | Effort (1-10) | ICE Score | Measurement Method |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **P2-1** | **Automated IndexNow Push Script for Bing & Copilot**<br>Create a lightweight CLI script (`scripts/indexnow.ts`) that pings the IndexNow API on build with all 19+ canonical URLs. | SEO Agent | `public/4a9b2c8d7e1f4095a123bc456def789a.txt` | `bun run seo:indexnow` returns HTTP 200 from `api.indexnow.org`. | **7** | **9** | **1** (30 min) | **63.0** | Bing Webmaster Tools IndexNow URL status dashboard. |
| **P2-2** | **White-Hat Indie Game Hub Listings & Showcases**<br>Publish curated game profiles on legitimate indie hubs (itch.io HTML5 collection, Newgrounds, WebGameHub, ProductHunt). | Discovery Strategist | Queen Agent approval on copy/assets | 4-5 verified external listings with dofollow/canonical brand attribution links. | **8** | **8** | **5** (Ongoing) | **12.8** | Referring domains count in GSC and GA4 Referral traffic. |
| **P2-3** | **School Chromebook & Classroom Safety Verification**<br>Audit games against school firewall filters (zero violence, zero user chat, COPPA compliant, ad-free) and register on classroom webgame indexes. | Discovery Strategist | Mobile QA audit | Verified accessible across standard restricted school district network profiles. | **8** | **7** | **4** (Ongoing) | **14.0** | GA4 device breakdown (% Chrome OS) and weekday school-hour traffic spikes. |

---

## 🧪 P3: Speculative Experiments

| ID | Initiative & Description | Owner | Dependencies | Acceptance Criteria | Impact (1-10) | Confidence (1-10) | Effort (1-10) | ICE Score | Measurement Method |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **P3-1** | **Title Tag Formula CTR Split Test ("No Download" vs "Play Free")**<br>A/B test CTR differential in US Google SERPs across two title formulas over a 28-day window. | Growth Strategist | GSC baseline data (>= 500 impressions/mo) | Pre-registered experiment logged in `EXPERIMENT_LOG.md` with statistically significant CTR delta measured. | **6** | **7** | **2** (1 hr) | **21.0** | Google Search Console Performance Report (US filter). |
| **P3-2** | **Progressive Web App (PWA) Offline Manifest & Service Worker**<br>Implement service worker caching to allow instant launch and offline play from mobile/desktop home screens. | Fullstack Dev | `public/manifest.json`, Service Worker | Lighthouse PWA audit passes with 100%; "Install App" prompt appears on Chrome/Edge/Safari. | **6** | **8** | **5** (5 hrs) | **9.6** | PWA install conversions and 30-day user retention rates in GA4. |

---

## 🛡️ Implementation Governance & Approval Gates

1. **Read-Only Gate:** Current status is Phase 1/Phase 2 read-only audit. No production files or DNS rules are touched without Queen Agent and Owner sign-off.
2. **Phase 1 Implementation Batch (Recommended for Immediate Approval):**
   - **Ticket P0-1:** Generate `dist/404.html` and configure `wrangler.json` `not_found_handling: "404-page"`.
   - **Ticket P0-2:** Cloudflare Page Rule for `www` to apex 301 redirect.
   - **Ticket P0-3:** Create `public/og-pawcade.png` and update `scripts/prerender.ts` for thumbnail social previews.
3. **Phase 2 Implementation Batch:**
   - **Ticket P1-1 & P1-2:** Category routing and static pre-rendering.
   - **Ticket P2-1:** IndexNow automated push script.
