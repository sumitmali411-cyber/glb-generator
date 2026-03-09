/**
 * sketchfab-downloader.js
 * Downloads CC-licensed GLB/GLTF models from Sketchfab's Download API.
 *
 * Usage:
 *   node src/sketchfab-downloader.js --uid <model-uid> --token <api-token> --output ./output/car.glb
 *   node src/sketchfab-downloader.js --search "ferrari 3d car" --token <api-token> --limit 5
 *
 * Get your API token: https://sketchfab.com/settings/password (scroll to "API Token")
 * Only models with "downloadable" flag and CC license are fetched.
 */

import { program } from 'commander';
import { writeFile, mkdir, mkdtemp } from 'fs/promises';
import { createWriteStream, existsSync } from 'fs';
import path from 'path';
import os from 'os';

const BASE = 'https://api.sketchfab.com/v3';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiFetch(url, token) {
  const res = await fetch(url, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sketchfab API error ${res.status}: ${body}`);
  }
  return res.json();
}

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  await writeFile(destPath, Buffer.from(buf));
}

async function extractGlbFromZip(zipPath, outputPath) {
  // Use native unzip available on most systems
  const { execSync } = await import('child_process');
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'skfb-'));
  try {
    execSync(`unzip -o "${zipPath}" -d "${tmpDir}"`, { stdio: 'ignore' });
    // Find .glb or scene.gltf
    const { readdirSync } = await import('fs');
    const walk = (dir) => {
      for (const f of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, f.name);
        if (f.isDirectory()) { const r = walk(full); if (r) return r; }
        else if (f.name.endsWith('.glb') || f.name === 'scene.gltf') return full;
      }
      return null;
    };
    const found = walk(tmpDir);
    if (!found) throw new Error('No GLB/GLTF found inside ZIP');
    const { copyFileSync } = await import('fs');
    copyFileSync(found, outputPath);
    console.log(`✓ Extracted: ${path.basename(found)} → ${outputPath}`);
  } finally {
    execSync(`rm -rf "${tmpDir}"`, { stdio: 'ignore' });
  }
}

// ── Commands ──────────────────────────────────────────────────────────────────

async function downloadByUid(uid, token, outputPath) {
  console.log(`Fetching model info for UID: ${uid}`);
  const model = await apiFetch(`${BASE}/models/${uid}`, token);

  if (!model.isDownloadable) {
    throw new Error(`Model "${model.name}" is not downloadable.`);
  }

  const license = model.license?.label ?? 'Unknown';
  console.log(`  Name:    ${model.name}`);
  console.log(`  Author:  ${model.user?.username}`);
  console.log(`  License: ${license}`);

  console.log('Requesting download link...');
  const dlData = await apiFetch(`${BASE}/models/${uid}/download`, token);
  const gltfUrl = dlData.gltf?.url ?? dlData.glb?.url;
  if (!gltfUrl) throw new Error('No GLTF/GLB download URL returned.');

  await mkdir(path.dirname(outputPath), { recursive: true });
  const zipPath = outputPath.replace(/\.glb$/, '.zip');
  console.log('Downloading archive...');
  await downloadFile(gltfUrl, zipPath);

  await extractGlbFromZip(zipPath, outputPath);
  const { unlinkSync } = await import('fs');
  try { unlinkSync(zipPath); } catch {}

  console.log(`\nAttribution: "${model.name}" by ${model.user?.username} — ${license}`);
}

async function searchModels(query, token, limit = 5) {
  console.log(`Searching Sketchfab for: "${query}"\n`);
  const url = `${BASE}/models?q=${encodeURIComponent(query)}&downloadable=true&license=by&type=models&count=${limit}&sort_by=-likeCount`;
  const data = await apiFetch(url, token);

  if (!data.results?.length) {
    console.log('No downloadable CC models found.');
    return;
  }

  console.log(`Found ${data.results.length} models:\n`);
  data.results.forEach((m, i) => {
    console.log(`  [${i + 1}] ${m.name}`);
    console.log(`       UID:     ${m.uid}`);
    console.log(`       Author:  ${m.user?.username}`);
    console.log(`       License: ${m.license?.label}`);
    console.log(`       Likes:   ${m.likeCount}`);
    console.log(`       URL:     https://sketchfab.com/3d-models/${m.slug}-${m.uid}`);
    console.log(`       Download command:`);
    console.log(`         node src/sketchfab-downloader.js --uid ${m.uid} --token $SKETCHFAB_TOKEN --output ./output/${m.slug}.glb\n`);
  });
}

// ── CLI ───────────────────────────────────────────────────────────────────────

program
  .name('sketchfab-downloader')
  .description('Download CC-licensed GLB models from Sketchfab');

program
  .option('--uid <uid>',       'Model UID to download')
  .option('--search <query>',  'Search for downloadable models')
  .option('--token <token>',   'Sketchfab API token (or set SKETCHFAB_TOKEN env var)')
  .option('--output <path>',   'Output .glb path', './output/model.glb')
  .option('--limit <n>',       'Number of search results', '5');

program.parse();
const opts = program.opts();

const token = opts.token ?? process.env.SKETCHFAB_TOKEN;
if (!token) {
  console.error('Error: Sketchfab API token required. Use --token or set SKETCHFAB_TOKEN env var.');
  console.error('Get yours at: https://sketchfab.com/settings/password');
  process.exit(1);
}

if (opts.search) {
  await searchModels(opts.search, token, parseInt(opts.limit));
} else if (opts.uid) {
  await downloadByUid(opts.uid, token, opts.output);
} else {
  program.help();
}
