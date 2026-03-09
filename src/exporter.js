/**
 * exporter.js
 * Wraps Three.js GLTFExporter for Node.js (headless) usage.
 * Pure geometry export — no WebGL or canvas required.
 */

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Minimal browser globals Three.js GLTFExporter expects in Node.js
if (typeof global.self === 'undefined') global.self = global;
if (typeof global.document === 'undefined') {
  global.document = { createElement: () => ({ getContext: () => null }) };
}
// Polyfill FileReader for GLTFExporter blob handling
if (typeof global.FileReader === 'undefined') {
  global.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      (blob.arrayBuffer ? blob.arrayBuffer() : Promise.resolve(blob))
        .then(buf => { this.result = buf; this.onload?.({ target: this }); })
        .catch(err => this.onerror?.(err));
    }
  };
}
if (typeof global.Blob === 'undefined') {
  const { Blob } = await import('buffer');
  global.Blob = Blob;
}

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

/**
 * Export a Three.js Object3D to a GLB buffer.
 * @param {THREE.Object3D} object
 * @returns {Promise<ArrayBuffer>}
 */
export function exportToGLB(object) {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      object,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          // JSON GLTF — shouldn't happen with binary:true, but handle anyway
          const json = JSON.stringify(result);
          resolve(Buffer.from(json));
        }
      },
      (error) => reject(error),
      { binary: true, embedImages: true }
    );
  });
}

/**
 * Save a GLB buffer to disk.
 * @param {ArrayBuffer} buffer
 * @param {string} outputPath
 */
export async function saveGLB(buffer, outputPath) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, Buffer.from(buffer));
  console.log(`✓ Saved: ${outputPath} (${(buffer.byteLength / 1024).toFixed(1)} KB)`);
}
