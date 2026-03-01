import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { extractFromPath, extractFromStream } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createRegex(pattern) {
    return new RegExp(pattern, 'i');
}

describe('extract functionality', () => {
    it('should handle multiple matching sections', async () => {
        // Given
        const filePath = path.join(__dirname, 'fixtures', 'multiple_matches.md');
        const regex = createRegex('^%%');

        // When
        const matches = await extractFromPath(filePath, regex);

        // Then
        assert.strictEqual(matches.length, 2);
        assert.strictEqual(matches[0][0], '## %% (Heading 1)');
        assert.strictEqual(matches[1][0], '# %% (Heading 2)');
    });

    it('should not match headings in code blocks', async () => {
        // Given
        const filePath = path.join(__dirname, 'fixtures', 'heading_in_code_block.md');
        const regex = createRegex('^%%');

        // When
        const matches = await extractFromPath(filePath, regex);

        // Then
        assert.strictEqual(matches.length, 0);
    });
});

describe('extractFromStream', () => {
    it('should extract a matching section from a stream', async () => {
        const input = Readable.from('# Intro\nHello\n## Target\nContent\n## Other\nNope\n');

        const matches = await extractFromStream(input, createRegex('Target'));

        assert.strictEqual(matches.length, 1);
        assert.deepStrictEqual(matches[0], ['## Target', 'Content']);
    });
});