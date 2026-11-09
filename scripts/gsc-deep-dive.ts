// GSC deep-dive: page, query+page, date, device, country breakdowns + sitemap status.
// Usage: bun scripts/gsc-deep-dive.ts [days=90]
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { getGoogleAccessToken } from './fetch-traffic';

const rootDir = resolve(import.meta.dir, '..');
const SITE = 'https://pawcadegames.com/';
const days = parseInt(process.argv[2] || '90', 10);

const creds = JSON.parse(readFileSync(resolve(rootDir, 'service-account.json'), 'utf-8'));
const token = await getGoogleAccessToken(creds.client_email, creds.private_key, [
  'https://www.googleapis.com/auth/webmasters.readonly',
]);

const end = new Date();
const start = new Date();
start.setDate(end.getDate() - days);
const fmt = (d: Date) => d.toISOString().slice(0, 10);

type Row = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

async function query(dimensions: string[], rowLimit = 500): Promise<Row[]> {
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: fmt(start), endDate: fmt(end), dimensions, rowLimit }),
    }
  );
  if (!res.ok) throw new Error(`GSC ${dimensions.join(',')} ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { rows?: Row[] };
  return data.rows || [];
}

async function sitemaps() {
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/sitemaps`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.ok ? await res.json() : { error: `${res.status} ${await res.text()}` };
}

const [byPage, byQueryPage, byDate, byDevice, byCountry, sm] = await Promise.all([
  query(['page']),
  query(['query', 'page'], 1000),
  query(['date']),
  query(['device']),
  query(['country']),
  sitemaps(),
]);

const out = { range: { start: fmt(start), end: fmt(end), days }, byPage, byQueryPage, byDate, byDevice, byCountry, sitemaps: sm };
mkdirSync(resolve(rootDir, 'docs/seo/traffic'), { recursive: true });
writeFileSync(resolve(rootDir, 'docs/seo/traffic/GSC_DEEP_DIVE.json'), JSON.stringify(out, null, 2));

const sum = (rows: Row[]) => rows.reduce((a, r) => ({ c: a.c + r.clicks, i: a.i + r.impressions }), { c: 0, i: 0 });
const t = sum(byPage);
console.log(`Range ${fmt(start)} → ${fmt(end)} | clicks ${t.c} | impressions ${t.i} | pages with impressions ${byPage.length} | queries×pages ${byQueryPage.length}`);
console.log('\nTop pages by impressions:');
for (const r of [...byPage].sort((a, b) => b.impressions - a.impressions).slice(0, 25))
  console.log(`  ${r.impressions.toString().padStart(4)} imp  ${r.clicks} clk  pos ${r.position.toFixed(1).padStart(5)}  ${r.keys[0].replace(SITE, '/')}`);
console.log('\nDevices:', byDevice.map((r) => `${r.keys[0]}=${r.impressions}imp/${r.clicks}clk`).join('  '));
console.log('Countries:', byCountry.sort((a, b) => b.impressions - a.impressions).slice(0, 8).map((r) => `${r.keys[0]}=${r.impressions}`).join('  '));
console.log('Daily impressions (last 21):', byDate.slice(-21).map((r) => `${r.keys[0].slice(5)}:${r.impressions}`).join(' '));
console.log('\nSitemaps:', JSON.stringify(sm).slice(0, 600));
