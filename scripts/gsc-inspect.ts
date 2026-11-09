// Inspect Google index status for URLs. Usage: bun scripts/gsc-inspect.ts [path ...]
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { getGoogleAccessToken } from './fetch-traffic';

const rootDir = resolve(import.meta.dir, '..');
const SITE = 'https://pawcadegames.com/';
const creds = JSON.parse(readFileSync(resolve(rootDir, 'service-account.json'), 'utf-8'));
const token = await getGoogleAccessToken(creds.client_email, creds.private_key, [
  'https://www.googleapis.com/auth/webmasters.readonly',
]);

const paths = process.argv.slice(2);
const results: Array<Record<string, unknown>> = [];
for (const p of paths) {
  const url = new URL(p, SITE).toString();
  const res = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE }),
  });
  if (!res.ok) {
    console.log(`${p} -> ERROR ${res.status} ${(await res.text()).slice(0, 200)}`);
    continue;
  }
  const j = (await res.json()) as { inspectionResult?: { indexStatusResult?: Record<string, unknown> } };
  const s = j.inspectionResult?.indexStatusResult || {};
  results.push({ path: p, ...s });
  console.log(
    `${p.padEnd(34)} ${String(s.verdict).padEnd(8)} ${String(s.coverageState).padEnd(45)} crawled=${String(s.lastCrawlTime || '-').slice(0, 10)} canon=${String(s.googleCanonical || '-').replace(SITE, '/')}`
  );
}
writeFileSync(resolve(rootDir, 'docs/seo/traffic/GSC_INDEX_STATUS.json'), JSON.stringify(results, null, 2));
