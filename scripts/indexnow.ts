import { GAMES_REGISTRY } from '../src/lib/gamesRegistry';

const INDEXNOW_KEY = '4a9b2c8d7e1f4095a123bc456def789a';
const HOST = 'pawcadegames.com';
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

async function submitIndexNow() {
  const urlList = [
    `https://${HOST}/`,
    `https://${HOST}/category/puzzle/`,
    `https://${HOST}/category/farm/`,
    `https://${HOST}/category/arcade/`,
    `https://${HOST}/category/pets/`,
    ...GAMES_REGISTRY.filter((g) => g.status === 'playable').map(
      (g) => `https://${HOST}${g.route}`
    ),
  ];

  console.log(`[IndexNow] Preparing notification for ${urlList.length} canonical URLs on ${HOST}...`);

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  };

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    console.log(`[IndexNow] Response status: ${res.status} ${res.statusText}`);
    if (res.status === 200 || res.status === 202) {
      console.log(`[IndexNow] Successfully submitted ${urlList.length} URLs to IndexNow network (Bing, Copilot, Seznam)!`);
    } else {
      const text = await res.text();
      console.warn(`[IndexNow] Non-200 response:`, text);
    }
  } catch (err) {
    console.error(`[IndexNow] Network submission failed:`, err);
  }
}

submitIndexNow();
