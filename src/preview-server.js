/**
 * preview-server.js
 * Tiny Express server that serves generated GLBs so you can
 * preview them in any three.js viewer or model-viewer web component.
 *
 *   node src/preview-server.js
 *   Open: http://localhost:3333
 */

import express from 'express';
import { readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../output');

const app = express();

// Serve GLB files from ./output
app.use('/models', express.static(OUTPUT_DIR));

// Viewer page using <model-viewer> web component
app.get('/', async (req, res) => {
  let files = [];
  try { files = (await readdir(OUTPUT_DIR)).filter(f => f.endsWith('.glb')); }
  catch { /* output dir doesn't exist yet */ }

  const selected = req.query.model ?? files[0] ?? '';

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>GLB Preview</title>
  <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: monospace; background: #0d1b2a; color: #e0e0e0; display: flex; height: 100vh; }
    aside { width: 220px; background: #111; padding: 16px; overflow-y: auto; flex-shrink: 0; }
    aside h2 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; color: #4a9eff; margin-bottom: 12px; }
    aside a { display: block; padding: 8px 10px; margin: 4px 0; border-radius: 6px; color: #aaa; text-decoration: none; font-size: 0.8rem; transition: all 0.15s; }
    aside a:hover, aside a.active { background: rgba(74,158,255,0.15); color: #4a9eff; }
    main { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
    model-viewer { width: 100%; height: 85vh; background: transparent; }
    .label { font-size: 0.7rem; color: #666; }
    .empty { color: #555; text-align: center; padding: 40px; }
  </style>
</head>
<body>
  <aside>
    <h2>GLB Models</h2>
    ${files.length
      ? files.map(f =>
          `<a href="/?model=${f}" class="${f === selected ? 'active' : ''}">${f}</a>`
        ).join('')
      : '<p style="color:#555;font-size:0.75rem">No models yet.<br>Run: npm run generate:all</p>'
    }
  </aside>
  <main>
    ${selected
      ? `<model-viewer
           src="/models/${selected}"
           camera-controls auto-rotate
           shadow-intensity="1"
           environment-image="neutral"
           exposure="1.2"
           style="--poster-color:transparent">
         </model-viewer>
         <div class="label">${selected}</div>`
      : `<div class="empty">No GLB selected.<br>Generate models first: <code>npm run generate:all</code></div>`
    }
  </main>
</body>
</html>`);
});

const PORT = 3333;
app.listen(PORT, () => {
  console.log(`GLB Preview server running at http://localhost:${PORT}`);
  console.log(`Serving models from: ${OUTPUT_DIR}`);
});
