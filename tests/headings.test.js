import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { headingsFromPath, headingsFromStream } from '../src/index.js';

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
