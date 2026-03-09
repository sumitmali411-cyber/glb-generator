#!/usr/bin/env node
/**
 * cli.js — GLB Generator CLI
 *
 * Usage:
 *   node src/cli.js --type sedan --color "#E63946" --output ./out/my-car.glb
 *   node src/cli.js --all                 # Generate all archetypes
 *   node src/cli.js --list                # List available types
 */

import { program } from 'commander';
import { buildCar, CAR_PROFILES } from './car-builder.js';
import { exportToGLB, saveGLB } from './exporter.js';
import path from 'path';

program
  .name('glb-gen')
  .description('Procedural GLB car model generator')
  .version('1.0.0');

program
  .option('-t, --type <type>',   'Car archetype', 'sedan')
  .option('-c, --color <hex>',   'Body colour (hex)', '#C0392B')
  .option('-o, --output <path>', 'Output file path', './output/car.glb')
  .option('--all',               'Generate all archetypes into ./output/')
  .option('--list',              'List available car types');

program.parse();
const opts = program.opts();

async function main() {
  if (opts.list) {
    console.log('Available car types:');
    Object.keys(CAR_PROFILES).forEach(k => console.log(`  • ${k}`));
    return;
  }

  if (opts.all) {
    console.log('Generating all car archetypes...\n');
    for (const [type] of Object.entries(CAR_PROFILES)) {
      const car = buildCar(type, opts.color);
      const buffer = await exportToGLB(car);
      await saveGLB(buffer, path.join('./output', `${type}.glb`));
    }
    console.log('\nDone! All GLBs saved to ./output/');
    return;
  }

  // Single car
  const type = opts.type;
  if (!CAR_PROFILES[type]) {
    console.error(`Unknown type "${type}". Use --list to see available types.`);
    process.exit(1);
  }

  console.log(`Generating ${type} in ${opts.color}...`);
  const car = buildCar(type, opts.color);
  const buffer = await exportToGLB(car);
  await saveGLB(buffer, opts.output);
}

main().catch(e => { console.error(e); process.exit(1); });
