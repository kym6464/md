#!/usr/bin/env node

import { program } from 'commander';
import { headingsFromPath, headingsFromStream } from '../src/index.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

program
  .name('md-headings')
  .description('List headings in a markdown document')
  .version(packageJson.version)
  .argument('[file]', 'Path to markdown file (reads from stdin if omitted)');

program.action(async (file) => {
  try {
    const headings = file
      ? await headingsFromPath(file)
      : await headingsFromStream(process.stdin);

    if (headings.length === 0) {
      return;
    }

    const minDepth = Math.min(...headings.map(h => h.depth));

    for (const { depth, content } of headings) {
      const indent = '  '.repeat(depth - minDepth);
      console.log(`${indent}${content}`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
});

program.parse();
