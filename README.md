# @kym6464/md

A markdown CLI that enables efficiently exploring markdown content and extracting sections.

## Installation

```bash
brew tap kym6464/tap
brew install md
```

Or via npm:

```bash
# Install globally
npm install -g @kym6464/md

# Or use with npx (no installation required)
npx @kym6464/md extract "pattern" document.md
```

Standalone binaries are also available on the [releases page](https://github.com/kym6464/md/releases) for Linux, macOS, and Windows.

## Usage

Given a document called `my-document.md`:

```markdown
# Welcome

This is my amazing markdown document.

## Extract me!

This section should be pulled out.

## Another section

This won't match the pattern.
```

You can extract the second section with the following command:

```console
$ md extract "Extract me!" my-document.md
## Extract me!

This section should be pulled out.
```

## md extract

```
Usage: md extract [options] <pattern> [file]

Extract sections of a markdown file with a regular expression

Arguments:
  pattern                         Pattern to match against headings
  file                            Path to markdown file (reads from stdin if omitted)

Options:
  -a, --all                       Print all matching sections (don't quit after first match)
  -s, --case-sensitive            Treat pattern as case sensitive
  -n, --no-print-matched-heading  Do not include the matched heading in the output
  --no-children                   Exclude content under child headings
  -h, --help                      display help for command
```

### Examples

Extract all sections matching a pattern:

```bash
md extract --all "^API" documentation.md
```

Case-sensitive matching:

```bash
md extract --case-sensitive "TODO" project.md
```

Extract content without the heading:

```bash
md extract --no-print-matched-heading "Summary" report.md
```

Extract only direct content, excluding child sections:

```bash
md extract --no-children "Welcome" my-document.md
```

## md headings

List all headings in a markdown document, displayed as an indented tree.

```console
$ md headings my-document.md
Welcome
  Extract me!
  Another section
```

It also reads from stdin, so you can pipe content into it:

```bash
curl -sL https://example.com/doc.md | md headings
```

Use `--format json` to get a nested tree with character counts per section (useful for AI agents deciding how to read content):

```console
$ md headings --format json my-document.md
[
  {
    "heading": "Welcome",
    "chars": 149,
    "ownChars": 49,
    "children": [
      { "heading": "Extract me!", "chars": 51 },
      { "heading": "Another section", "chars": 49 }
    ]
  }
]
```

Parent nodes include `ownChars` — the character count excluding children. Use this to predict how much content `md extract --no-children` will return.

Or `--format toon` for a more compact representation:

```console
$ md headings --format toon my-document.md
[1]:
  - heading: Welcome
    chars: 149
    ownChars: 49
    children[2]{heading,chars}:
      Extract me!,51
      Another section,49
```

### Options

```
Usage: md headings [options] [file]

List headings in a markdown document

Arguments:
  file                  Path to markdown file (reads from stdin if omitted)

Options:
  -f, --format <type>   Output format: plain, json, toon (default: "plain")
  -h, --help            display help for command
```

## Library Usage

You can also use this as a JavaScript library:

```javascript
import { extractFromPath } from "@kym6464/md";

const regex = /Extract me!/i;
const matches = await extractFromPath("my-document.md", regex);
console.log(matches); // Array of matching sections
```

## Credits

The `extract` code was forked from [sean0x42/markdown-extract](https://github.com/sean0x42/markdown-extract).
