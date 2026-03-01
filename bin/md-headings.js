#!/usr/bin/env node

import { program } from 'commander';
import { headingsFromPath, headingsFromStream, sectionsFromPath, sectionsFromStream, buildHeadingTree } from '../src/index.js';
import { encode } from '@toon-format/toon';
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
  .argument('[file]', 'Path to markdown file (reads from stdin if omitted)')
  .option('-f, --format <type>', 'Output format (plain, json, toon)', 'plain');

program.action(async (file, options) => {
  try {
    if (options.format === 'plain') {
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
      return;
    }

    const sections = file
      ? await sectionsFromPath(file)
      : await sectionsFromStream(process.stdin);

    if (sections.length === 0) {
      return;
    }

    const tree = buildHeadingTree(sections);

    if (options.format === 'json') {
      console.log(JSON.stringify(tree, null, 2));
    } else if (options.format === 'toon') {
      console.log(encode(tree));
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
});

program.parse();
