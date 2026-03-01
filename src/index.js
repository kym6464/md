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

export async function headingsFromPath(filePath) {
    const headings = [];
    let isInsideCodeBlock = false;

    const fileStream = createReadStream(filePath);
    const rl = createInterface({
        input: fileStream,
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

export async function extractFromPath(filePath, regex) {
    const state = new State();
    
    const fileStream = createReadStream(filePath);
    const rl = createInterface({
        input: fileStream,
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
                    state.exitMatchedSection();
                }
                
                if (!state.isWithinMatchedSection && regex.test(heading.content)) {
                    state.enterMatchedSection(heading);
                }
            }
        }
        
        if (state.isWithinMatchedSection) {
            state.current.push(line);
        }
    }
    
    state.pushCurrent();
    
    return state.matches;
}