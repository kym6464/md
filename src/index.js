import { createReadStream } from 'fs';
import { createInterface } from 'readline';

export function tryParseHeading(line) {
    let depth = 0;
    
    for (const ch of line) {
        if (ch === '#') {
            depth++;
        } else {
            break;
        }
    }
    
    if (depth === 0) {
        return null;
    }
    
    return {
        depth,
        content: line.slice(depth).trim()
    };
}

class State {
    constructor() {
        this.matches = [];
        this.isWithinMatchedSection = false;
        this.isWithinChildSection = false;
        this.isInsideCodeBlock = false;
        this.depth = 0;
        this.current = null;
    }
    
    pushCurrent() {
        if (this.current) {
            this.matches.push(this.current);
            this.current = null;
        }
    }
    
    enterMatchedSection(heading) {
        this.isWithinMatchedSection = true;
        this.depth = heading.depth;
        
        this.pushCurrent();
        this.current = [];
    }
    
    exitMatchedSection() {
        this.isWithinMatchedSection = false;
        this.pushCurrent();
    }
}

export async function headingsFromStream(input) {
    const headings = [];
    let isInsideCodeBlock = false;

    const rl = createInterface({
        input,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (line.startsWith('```')) {
            isInsideCodeBlock = !isInsideCodeBlock;
        }

        if (isInsideCodeBlock) continue;

        const heading = tryParseHeading(line);
        if (heading) {
            headings.push(heading);
        }
    }

    return headings;
}

export function headingsFromPath(filePath) {
    return headingsFromStream(createReadStream(filePath));
}

export async function sectionsFromStream(input) {
    const sections = [];
    let isInsideCodeBlock = false;
    let currentLines = [];
    let currentHeading = null;

    const rl = createInterface({
        input,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (line.startsWith('```')) {
            isInsideCodeBlock = !isInsideCodeBlock;
        }

        if (!isInsideCodeBlock) {
            const heading = tryParseHeading(line);

            if (heading) {
                if (currentHeading) {
                    sections.push({
                        heading: currentHeading.content,
                        depth: currentHeading.depth,
                        chars: currentLines.join('\n').length
                    });
                }
                currentHeading = heading;
                currentLines = [line];
                continue;
            }
        }

        if (currentHeading) {
            currentLines.push(line);
        }
    }

    if (currentHeading) {
        sections.push({
            heading: currentHeading.content,
            depth: currentHeading.depth,
            chars: currentLines.join('\n').length
        });
    }

    return sections;
}

export function sectionsFromPath(filePath) {
    return sectionsFromStream(createReadStream(filePath));
}

export function buildHeadingTree(sections) {
    const root = { children: [] };
    const stack = [{ depth: 0, node: root }];

    for (const { heading, depth, chars } of sections) {
        const node = { heading, chars };

        while (stack.length > 1 && stack[stack.length - 1].depth >= depth) {
            stack.pop();
        }

        const parent = stack[stack.length - 1].node;
        if (!parent.children) {
            parent.ownChars = parent.chars;
            parent.children = [];
        }
        parent.children.push(node);
        stack.push({ depth, node });
    }

    function rollupChars(nodes) {
        for (const node of nodes) {
            if (node.children) {
                rollupChars(node.children);
                node.ownChars = node.chars;
                for (const child of node.children) {
                    node.chars += child.chars;
                }
            }
        }
    }
    rollupChars(root.children);

    return root.children;
}

export async function extractFromStream(input, regex, { noChildren } = {}) {
    const state = new State();

    const rl = createInterface({
        input,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (line.startsWith('```')) {
            state.isInsideCodeBlock = !state.isInsideCodeBlock;
        }

        if (!state.isInsideCodeBlock) {
            const heading = tryParseHeading(line);

            if (heading) {
                if (heading.depth <= state.depth) {
                    state.isWithinChildSection = false;
                    state.exitMatchedSection();
                }

                if (!state.isWithinMatchedSection && regex.test(heading.content)) {
                    state.enterMatchedSection(heading);
                } else if (state.isWithinMatchedSection && noChildren && heading.depth > state.depth) {
                    state.isWithinChildSection = true;
                }
            }
        }

        if (state.isWithinMatchedSection && !state.isWithinChildSection) {
            state.current.push(line);
        }
    }

    state.pushCurrent();

    return state.matches;
}

export function extractFromPath(filePath, regex, options) {
    return extractFromStream(createReadStream(filePath), regex, options);
}