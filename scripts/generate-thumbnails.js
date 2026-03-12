#!/usr/bin/env node
/**
 * Gera thumbnails PNG a partir dos SVGs de desenhos
 * Uso: node scripts/generate-thumbnails.js
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DRAWINGS = path.join(ROOT, 'assets/drawings');
const THUMBNAILS = path.join(ROOT, 'assets/thumbnails');
const SIZE = 200;

async function run() {
  const categories = fs.readdirSync(DRAWINGS, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  let total = 0, ok = 0, fail = 0;

  for (const cat of categories) {
    const catDir = path.join(DRAWINGS, cat);
    const outDir = path.join(THUMBNAILS, cat);
    fs.mkdirSync(outDir, { recursive: true });

    const svgs = fs.readdirSync(catDir).filter(f => f.endsWith('.svg'));

    for (const svg of svgs) {
      total++;
      const input = path.join(catDir, svg);
      const output = path.join(outDir, svg.replace('.svg', '.png'));

      try {
        await sharp(input, { density: 150 })
          .resize(SIZE, SIZE, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
          .png()
          .toFile(output);
        ok++;
        console.log(`  ✓ ${cat}/${svg} → ${path.basename(output)}`);
      } catch (err) {
        fail++;
        console.error(`  ✗ ${cat}/${svg}: ${err.message}`);
      }
    }
  }

  console.log(`\n${ok}/${total} thumbnails gerados (${fail} falhas)`);
}

run().catch(console.error);
