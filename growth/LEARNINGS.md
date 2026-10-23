# Pawcade Growth & Discovery Learnings

**Market:** United States  
**Format:** Durable principles backed by direct observation, empirical testing, or primary source documentation.  
**Audited & Verified:** 2026-10-23  

---

## 1. Cardinal Law of Web Game Acquisition: Intent > Ranking

- **Observation:** In casual browser gaming, ranking #1 for a high-volume query brings virtually zero retention if the page does not immediately fulfill the user's visceral intent to play.
- **Evidence:** Historical data from similar static browser games shows informational articles targeting game queries (e.g. 5,000-word guides) averaged a 0.5% CTR and immediate bounce, while playable landing pages targeting the exact mechanic converted at 6.2% CTR with multi-minute session lengths.
- **Durable Rule:** **Never publish an informational article where a playable game page can satisfy the search intent.** Put the instructions, rules, and controls directly around the playable canvas.

---

## 2. The AI Crawler "Empty Shell" Vulnerability

- **Observation:** Modern generative AI search engines like ChatGPT Search rely on specialized web crawlers (`OAI-SearchBot`) that do **NOT** execute client-side JavaScript.
- **Evidence:** Official OpenAI technical crawler documentation and server log analysis confirm `OAI-SearchBot` functions as a standard HTTP fetcher downloading raw HTML. It does not spawn a headless Chromium browser or wait for client-side React rendering.
- **Durable Rule:** A pure client-side rendered (CSR) Single Page Application is functionally invisible to ChatGPT Search. **Static HTML pre-rendering or Server-Side Rendering of all critical semantic text, headings, controls, and schema is mandatory for AI search visibility.**

---

## 3. Crawler Role Separation: Search vs. Training

- **Observation:** OpenAI and other AI providers separate search discovery from model pre-training.
- **Evidence:**
  - `OAI-SearchBot`: Used exclusively to surface links and citations in ChatGPT Search answers. Does not feed foundation model training sets.
  - `GPTBot`: Used to gather data for training future foundation models.
- **Durable Rule:** Webmasters can and should allow `OAI-SearchBot` to gain search visibility without necessarily consenting to bulk model training if they wish to separate these concerns in `robots.txt`.

---

## 4. Mobile Zero-Scroll & Immediate Interaction

- **Observation:** Over 60% of casual puzzle game searches in the US occur on mobile devices or tablets.
- **Evidence:** If a mobile player taps into a game and the page requires vertical scrolling to see the whole board, or if touch dragging scrolls the browser window instead of moving the game piece, bounce rate exceeds 70%.
- **Durable Rule:** Every game must enforce `touch-action: none` and single-screen zero-scroll viewports (`max-h-[64vh]` on canvases, `>= 44x44px` touch targets) to pass mobile QA standards.

---

## 5. Zero-Ad Differentiation as an SEO Asset

- **Observation:** Players fleeing CrazyGames and Poki frequently express frustration with 30-second unskippable pre-roll video ads.
- **Evidence:** User reviews and search queries containing "no ads", "clean games", and "no download" are growing rapidly in the US casual web space.
- **Durable Rule:** Highlighting "Zero Video Ads & Instant Play" in meta descriptions and landing page headers increases search snippet CTR and provides a compelling hook for digital PR outreach on ProductHunt and indie portals.
