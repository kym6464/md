#!/usr/bin/env node

import { program } from 'commander';
import { extractFromPath, extractFromStream, headingsFromPath, headingsFromStream, sectionsFromPath, sectionsFromStream, buildHeadingTree } from '../src/index.js';
import { encode } from '@toon-format/toon';
import { version } from '../package.json';

program
  .name('md')
  .version(version);

const extract = program.command('extract')
  .description('Extract sections of a markdown file with a regular expression')
  .argument('<pattern>', 'Pattern to match against headings')
  .argument('[file]', 'Path to markdown file (reads from stdin if omitted)')
  .option('-a, --all', 'Print all matching sections (don\'t quit after first match)', false)
  .option('-s, --case-sensitive', 'Treat pattern as case sensitive', false)
  .option('-n, --no-print-matched-heading', 'Do not include the matched heading in the output')
  .option('--no-children', 'Exclude content under child headings');

extract.action(async (pattern, file, options) => {
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

const headings = program.command('headings')
  .description('List headings in a markdown document')
  .argument('[file]', 'Path to markdown file (reads from stdin if omitted)')
  .option('-f, --format <type>', 'Output format (plain, json, toon)', 'plain');

headings.action(async (file, options) => {
  try {
    if (options.format === 'plain') {
      const hdgs = file
        ? await headingsFromPath(file)
        : await headingsFromStream(process.stdin);

      if (hdgs.length === 0) {
        return;
      }

      const minDepth = Math.min(...hdgs.map(h => h.depth));

      for (const { depth, content } of hdgs) {
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
