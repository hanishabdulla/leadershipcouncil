import { mkdir, writeFile } from "node:fs/promises";
import { leaders } from "../app/data.js";

const outputDir = new URL("../public/portraits/", import.meta.url);
const sources = {};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url, options, label) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(url, options);
    if (response.ok) return response;
    if (response.status !== 429 || attempt === 4) {
      throw new Error(`Could not fetch ${label}: ${response.status}`);
    }
    await wait(900 * attempt);
  }
}

await mkdir(outputDir, { recursive: true });

for (const leader of leaders) {
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(leader.wikiTitle)}`;
  const summaryResponse = await fetchWithRetry(summaryUrl, {
    headers: {
      "User-Agent": "leader-draft-local-app/1.0 (portrait fetch for local Next.js demo)",
    },
  }, `summary for ${leader.name}`);

  const summary = await summaryResponse.json();
  const imageUrl = summary.thumbnail?.source || summary.originalimage?.source;

  if (!imageUrl) {
    throw new Error(`No image found for ${leader.name}`);
  }

  const imageResponse = await fetchWithRetry(imageUrl, {
    headers: {
      "User-Agent": "leader-draft-local-app/1.0 (portrait fetch for local Next.js demo)",
    },
  }, `image for ${leader.name}`);

  const bytes = Buffer.from(await imageResponse.arrayBuffer());
  await writeFile(new URL(`${leader.id}.jpg`, outputDir), bytes);

  sources[leader.id] = {
    name: leader.name,
    page: summary.content_urls?.desktop?.page,
    image: imageUrl,
  };

  console.log(`Saved ${leader.name}`);
  await wait(250);
}

await writeFile(
  new URL("../public/portrait-sources.json", import.meta.url),
  `${JSON.stringify(sources, null, 2)}\n`,
);
