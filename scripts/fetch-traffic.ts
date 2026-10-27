import { createSign } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

export interface GscQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface Ga4RealtimeData {
  activeUsers: number;
  topPages: Array<{ pagePath: string; activeUsers: number }>;
}

export interface Ga4HistoricalData {
  totalUsers: number;
  screenPageViews: number;
  sessions: number;
  topPages: Array<{ pagePath: string; views: number }>;
}

export interface TrafficSnapshot {
  timestamp: string;
  authenticated: boolean;
  source: 'api' | 'export_fallback' | 'not_configured';
  ga4Realtime?: Ga4RealtimeData;
  ga4Historical?: Ga4HistoricalData;
  gscTotals?: { clicks: number; impressions: number; avgCtr: number; avgPosition: number };
  gscTopQueries?: GscQueryRow[];
  summaryMessage: string;
}

const DEFAULT_GA4_PROPERTY_ID = '560318238'; // Detected from Pawcade Analytics session
const DEFAULT_GSC_SITE_URL = 'https://pawcadegames.com/';
const GSC_FALLBACK_SITE_URL = 'sc-domain:pawcadegames.com';

interface GoogleCredentials {
  client_email: string;
  private_key: string;
}

function loadGoogleCredentials(): GoogleCredentials | null {
  const rootDir = resolve(__dirname, '..');
  const candidatePaths = [
    resolve(rootDir, 'service-account.json'),
    resolve(rootDir, '.google-credentials.json'),
    process.env.GOOGLE_APPLICATION_CREDENTIALS ? resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS) : '',
  ].filter(Boolean);

  for (const p of candidatePaths) {
    if (existsSync(p)) {
      try {
        const raw = JSON.parse(readFileSync(p, 'utf-8'));
        if (raw.client_email && raw.private_key) {
          return {
            client_email: raw.client_email,
            private_key: raw.private_key,
          };
        }
      } catch (err) {
        console.warn(`[Traffic Engine] Warning: Failed to parse credentials at ${p}:`, err);
      }
    }
  }

  // Fallback to environment variables
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  return null;
}

export async function getGoogleAccessToken(
  clientEmail: string,
  privateKey: string,
  scopes: string[]
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: clientEmail,
    scope: scopes.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encClaims = Buffer.from(JSON.stringify(claimSet)).toString('base64url');
  const signer = createSign('RSA-SHA256');
  signer.update(`${encHeader}.${encClaims}`);
  const signature = signer.sign(privateKey, 'base64url');
  const assertion = `${encHeader}.${encClaims}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OAuth Error ${res.status}: ${errText}`);
  }

  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

async function fetchGscAnalytics(accessToken: string): Promise<{
  rows: GscQueryRow[];
  siteUrlUsed: string;
}> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 28);

  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);

  const siteCandidates = [DEFAULT_GSC_SITE_URL, GSC_FALLBACK_SITE_URL];

  for (const siteUrl of siteCandidates) {
    const encoded = encodeURIComponent(siteUrl);
    const url = `https://www.googleapis.com/webmasters/v3/sites/${encoded}/searchAnalytics/query`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: startStr,
        endDate: endStr,
        dimensions: ['query'],
        rowLimit: 50,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        rows?: Array<{
          keys: string[];
          clicks: number;
          impressions: number;
          ctr: number;
          position: number;
        }>;
      };

      const rows: GscQueryRow[] = (data.rows || []).map((r) => ({
        query: r.keys[0] || '',
        clicks: Math.round(r.clicks),
        impressions: Math.round(r.impressions),
        ctr: parseFloat((r.ctr * 100).toFixed(2)),
        position: parseFloat(r.position.toFixed(1)),
      }));

      return { rows, siteUrlUsed: siteUrl };
    } else {
      const errText = await res.text();
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) {
          console.warn(`[Traffic Engine] GSC warning for ${siteUrl}: ${parsed.error.message}`);
        }
      } catch {}
    }
  }

  throw new Error('Search Console API call failed for both URL prefix and Domain property.');
}

async function fetchGa4Reports(
  accessToken: string,
  propertyId: string
): Promise<{ realtime: Ga4RealtimeData; historical: Ga4HistoricalData }> {
  // 1. Realtime Report
  const realtimeUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`;
  const realtimeRes = await fetch(realtimeUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      metrics: [{ name: 'activeUsers' }],
      dimensions: [{ name: 'unifiedScreenName' }],
    }),
  });

  let realtime: Ga4RealtimeData = { activeUsers: 0, topPages: [] };
  if (realtimeRes.ok) {
    const rData = (await realtimeRes.json()) as {
      rows?: Array<{ dimensionValues: Array<{ value: string }>; metricValues: Array<{ value: string }> }>;
    };
    let totalActive = 0;
    const topPages: Array<{ pagePath: string; activeUsers: number }> = [];
    (rData.rows || []).forEach((row) => {
      const page = row.dimensionValues[0]?.value || '/';
      const users = parseInt(row.metricValues[0]?.value || '0', 10);
      totalActive += users;
      topPages.push({ pagePath: page, activeUsers: users });
    });
    realtime = { activeUsers: totalActive, topPages };
  } else {
    const errText = await realtimeRes.text();
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error?.message) {
        console.warn(`[Traffic Engine] GA4 Realtime error: ${parsed.error.message}`);
      }
    } catch {}
  }

  // 2. 7-Day Historical Report
  const historicalUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
  const histRes = await fetch(historicalUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'sessions' },
      ],
      dimensions: [{ name: 'pagePath' }],
      limit: 10,
    }),
  });

  let historical: Ga4HistoricalData = { totalUsers: 0, screenPageViews: 0, sessions: 0, topPages: [] };
  if (histRes.ok) {
    const hData = (await histRes.json()) as {
      totals?: Array<{ metricValues: Array<{ value: string }> }>;
      rows?: Array<{ dimensionValues: Array<{ value: string }>; metricValues: Array<{ value: string }> }>;
    };

    const totalUsers = parseInt(hData.totals?.[0]?.metricValues?.[0]?.value || '0', 10);
    const screenPageViews = parseInt(hData.totals?.[0]?.metricValues?.[1]?.value || '0', 10);
    const sessions = parseInt(hData.totals?.[0]?.metricValues?.[2]?.value || '0', 10);

    const topPages = (hData.rows || []).map((row) => ({
      pagePath: row.dimensionValues[0]?.value || '/',
      views: parseInt(row.metricValues[1]?.value || '0', 10),
    }));

    historical = { totalUsers, screenPageViews, sessions, topPages };
  }

  return { realtime, historical };
}

export async function fetchLiveTrafficSnapshot(): Promise<TrafficSnapshot> {
  const rootDir = resolve(__dirname, '..');
  const trafficDir = resolve(rootDir, 'docs/seo/traffic');
  if (!existsSync(trafficDir)) {
    mkdirSync(trafficDir, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const creds = loadGoogleCredentials();

  if (!creds) {
    const instructions = `
⚠️ GOOGLE SERVİS HESABI ANAHTARI HENÜZ TANIMLANMADI

Otomatik olarak Search Console ve Google Analytics 4 verilerini çekebilmek için 2 dakikalık kurulum adımı:

1. Google Cloud Console'a gidin: https://console.cloud.google.com/
2. "IAM ve Yönetim" ➔ "Hizmet Hesapları (Service Accounts)" ➔ "Hizmet Hesabı Oluştur" diyerek bir hesap açın (Örn: pawcade-bot).
3. Oluşturulan hesabın "Anahtarlar (Keys)" sekmesinden "Yeni Anahtar Ekle ➔ JSON" seçip indirin.
4. İndirilen JSON dosyasını proje ana dizinine **service-account.json** adıyla kaydedin.
5. İndirilen JSON içindeki "client_email" adresini kopyalayıp:
   - **Google Search Console**: Ayarlar ➔ Kullanıcılar ve İzinler ➔ "Kullanıcı Ekle" diyerek "Kısıtlı / Okuyucu" yetkisi verin.
   - **Google Analytics 4**: Yönetici ➔ Mülk Erişim Yönetimi ➔ "+" Kullanıcı Ekle diyerek "Görüntüleyici" yetkisi verin.

Bu adımı tamamladıktan sonra 'bun run seo:traffic' veya günlük akşam raporu tüm canlı verileri otomatik olarak çekecektir.
`;

    return {
      timestamp,
      authenticated: false,
      source: 'not_configured',
      summaryMessage: instructions,
    };
  }

  try {
    const scopes = [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/analytics.readonly',
    ];

    const token = await getGoogleAccessToken(creds.client_email, creds.private_key, scopes);
    const propertyId = process.env.GA4_PROPERTY_ID || DEFAULT_GA4_PROPERTY_ID;

    const [gscData, ga4Data] = await Promise.all([
      fetchGscAnalytics(token).catch((e) => {
        console.warn('[Traffic Engine] GSC query error:', e.message);
        return { rows: [] as GscQueryRow[], siteUrlUsed: '' };
      }),
      fetchGa4Reports(token, propertyId).catch((e) => {
        console.warn('[Traffic Engine] GA4 query error:', e.message);
        return {
          realtime: { activeUsers: 0, topPages: [] },
          historical: { totalUsers: 0, screenPageViews: 0, sessions: 0, topPages: [] },
        };
      }),
    ]);

    const totalClicks = gscData.rows.reduce((acc, r) => acc + r.clicks, 0);
    const totalImpressions = gscData.rows.reduce((acc, r) => acc + r.impressions, 0);
    const avgCtr = totalImpressions > 0 ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
    const avgPos =
      gscData.rows.length > 0
        ? parseFloat((gscData.rows.reduce((acc, r) => acc + r.position, 0) / gscData.rows.length).toFixed(1))
        : 0;

    const snapshot: TrafficSnapshot = {
      timestamp,
      authenticated: true,
      source: 'api',
      ga4Realtime: ga4Data.realtime,
      ga4Historical: ga4Data.historical,
      gscTotals: {
        clicks: totalClicks,
        impressions: totalImpressions,
        avgCtr,
        avgPosition: avgPos,
      },
      gscTopQueries: gscData.rows.slice(0, 15),
      summaryMessage: `✅ Canlı trafik verileri GA4 (${propertyId}) ve GSC (${gscData.siteUrlUsed || 'Pawcade'}) üzerinden başarıyla çekildi.`,
    };

    // Save JSON & Markdown Snapshot
    writeFileSync(resolve(trafficDir, 'LATEST_TRAFFIC.json'), JSON.stringify(snapshot, null, 2), 'utf-8');

    const mdSnapshot = `# 📈 Pawcade Live Traffic & Search Console Snapshot
**Güncellenme:** ${timestamp}  
**GA4 Property:** ${propertyId}  
**GSC Mülk:** ${gscData.siteUrlUsed}  

### 🔴 GA4 Canlı Trafik
- **Anlık Aktif Kullanıcı (Realtime):** **${ga4Data.realtime.activeUsers}**
- **Son 7 Günlük Toplam Kullanıcı:** **${ga4Data.historical.totalUsers}**
- **Son 7 Günlük Sayfa Görüntüleme:** **${ga4Data.historical.screenPageViews}**
- **Son 7 Günlük Toplam Oturum:** **${ga4Data.historical.sessions}**

### 🔍 Google Search Console (Son 28 Gün)
- **Toplam Tıklama (Clicks):** **${totalClicks}**
- **Toplam Gösterim (Impressions):** **${totalImpressions}**
- **Ortalama Tıklama Oranı (CTR):** **%${avgCtr}**
- **Ortalama Pozisyon:** **${avgPos}**

#### En Çok Tıklanan / Gösterilen İlk 10 Arama Sorgusu:
| Arama Sorgusu | Tıklama | Gösterim | CTR | Ortalama Pozisyon |
| :--- | :---: | :---: | :---: | :---: |
${gscData.rows
  .slice(0, 10)
  .map((r) => `| \`${r.query}\` | ${r.clicks} | ${r.impressions} | %${r.ctr} | ${r.position} |`)
  .join('\n')}
`;
    writeFileSync(resolve(trafficDir, 'TRAFFIC_SNAPSHOT.md'), mdSnapshot, 'utf-8');

    return snapshot;
  } catch (error: any) {
    console.error('[Traffic Engine] Error fetching live traffic:', error);
    return {
      timestamp,
      authenticated: false,
      source: 'not_configured',
      summaryMessage: `❌ Canlı bağlantı hatası: ${error.message}`,
    };
  }
}

if (import.meta.main) {
  fetchLiveTrafficSnapshot().then((res) => {
    console.log(res.summaryMessage);
    if (res.authenticated) {
      console.log(`\n🔴 GA4 Canlı Aktif Kullanıcı: ${res.ga4Realtime?.activeUsers || 0}`);
      console.log(`👥 GA4 7-Günlük Kullanıcı: ${res.ga4Historical?.totalUsers || 0} (${res.ga4Historical?.screenPageViews || 0} sayfa gösterimi)`);
      console.log(`🔍 GSC 28-Günlük: ${res.gscTotals?.clicks || 0} Tıklama / ${res.gscTotals?.impressions || 0} Gösterim (Ort. Pozisyon: ${res.gscTotals?.avgPosition || 0})`);
    }
  });
}
