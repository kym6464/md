import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { headingsFromPath, headingsFromStream, sectionsFromStream, buildHeadingTree } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('headingsFromPath', () => {
    it('should return all headings with their depth', async () => {
        const filePath = path.join(__dirname, 'fixtures', 'headings.md');

        const headings = await headingsFromPath(filePath);

        assert.deepStrictEqual(headings, [
            { depth: 1, content: 'Introduction' },
            { depth: 2, content: 'Getting Started' },
            { depth: 2, content: 'API' },
            { depth: 3, content: 'extract()' },
            { depth: 3, content: 'parse()' },
            { depth: 1, content: 'Credits' },
        ]);
    });

    it('should not include headings inside code blocks', async () => {
        const filePath = path.join(__dirname, 'fixtures', 'heading_in_code_block.md');

        const headings = await headingsFromPath(filePath);

        assert.deepStrictEqual(headings, [
            { depth: 1, content: 'Document heading' },
        ]);
    });
});

describe('headingsFromStream', () => {
    it('should parse headings from a readable stream', async () => {
        const input = Readable.from('# One\n## Two\n### Three\n');

        const headings = await headingsFromStream(input);

        assert.deepStrictEqual(headings, [
            { depth: 1, content: 'One' },
            { depth: 2, content: 'Two' },
            { depth: 3, content: 'Three' },
        ]);
    });
});

describe('sectionsFromStream', () => {
    it('should return sections with character counts', async () => {
        const input = Readable.from('# Intro\nHello world\n## Details\nSome details\n');

        const sections = await sectionsFromStream(input);

        assert.deepStrictEqual(sections, [
            { heading: 'Intro', depth: 1, chars: '# Intro\nHello world'.length },
            { heading: 'Details', depth: 2, chars: '## Details\nSome details'.length },
        ]);
    });

    it('should skip headings inside code blocks', async () => {
        const input = Readable.from('# Real\nContent\n```\n# Fake\n```\n');

        const sections = await sectionsFromStream(input);

        assert.strictEqual(sections.length, 1);
        assert.strictEqual(sections[0].heading, 'Real');
    });
});

describe('buildHeadingTree', () => {
    it('should nest children under parents and roll up chars', () => {
        const sections = [
            { heading: 'A', depth: 1, chars: 100 },
            { heading: 'B', depth: 2, chars: 50 },
            { heading: 'C', depth: 2, chars: 60 },
            { heading: 'D', depth: 1, chars: 30 },
        ];

        const tree = buildHeadingTree(sections);

        assert.deepStrictEqual(tree, [
            {
                heading: 'A', chars: 210,
                children: [
                    { heading: 'B', chars: 50 },
                    { heading: 'C', chars: 60 },
                ]
            },
            { heading: 'D', chars: 30 },
        ]);
    });

    it('should omit children when empty', () => {
        const sections = [
            { heading: 'Leaf', depth: 1, chars: 42 },
        ];

        const tree = buildHeadingTree(sections);

        assert.deepStrictEqual(tree, [
            { heading: 'Leaf', chars: 42 },
        ]);
        assert.strictEqual(tree[0].children, undefined);
    });
});
