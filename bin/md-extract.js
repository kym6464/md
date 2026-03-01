#!/usr/bin/env node

import { program } from 'commander';
import { extractFromPath, extractFromStream } from '../src/index.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

program
  .name('md-extract')
  .description('Extract sections of a markdown file with a regular expression')
  .version(packageJson.version)
  .argument('<pattern>', 'Pattern to match against headings')
  .argument('[file]', 'Path to markdown file (reads from stdin if omitted)')
  .option('-a, --all', 'Print all matching sections (don\'t quit after first match)', false)
  .option('-s, --case-sensitive', 'Treat pattern as case sensitive', false)
  .option('-n, --no-print-matched-heading', 'Do not include the matched heading in the output')
  .option('--no-children', 'Exclude content under child headings');

program.action(async (pattern, file, options) => {
  try {
    const regexFlags = options.caseSensitive ? '' : 'i';
    const regex = new RegExp(pattern, regexFlags);
    
    const extractOptions = { noChildren: options.children === false };
    const matches = file
      ? await extractFromPath(file, regex, extractOptions)
      : await extractFromStream(process.stdin, regex, extractOptions);
    
    if (matches.length === 0) {
      console.error(`No matches found for pattern: ${pattern}`);
      process.exit(1);
    }
    
    if (!options.all) {
      printSection(matches[0], options.printMatchedHeading === false);
      return;
    }
    
    for (const match of matches) {
      printSection(match, options.printMatchedHeading === false);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
});

function printSection(section, skipMatchedHeading) {
  const startIndex = skipMatchedHeading ? 1 : 0;
  for (let i = startIndex; i < section.length; i++) {
    console.log(section[i]);
  }
}

program.parse();