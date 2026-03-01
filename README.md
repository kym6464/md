# @kym6464/md-extract

Extract sections of a markdown file with a regular expression.

## Installation

```bash
# Install globally
npm install -g @kym6464/md-extract

# Or use with npx (no installation required)
npx @kym6464/md-extract "pattern" document.md
```

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
$ md-extract "Extract me!" my-document.md
## Extract me!

This section should be pulled out.
```

## Options

```
Usage: md-extract [options] <pattern> <file>

Extract sections of a markdown file with a regular expression

Arguments:
  pattern                         Pattern to match against headings
  file                            Path to markdown file

Options:
  -V, --version                   output the version number
  -a, --all                       Print all matching sections (don't quit after first match)
  -s, --case-sensitive            Treat pattern as case sensitive
  -n, --no-print-matched-heading  Do not include the matched heading in the output
  -h, --help                      display help for command
```

### Examples

Extract all sections matching a pattern:

```bash
md-extract --all "^API" documentation.md
```

Case-sensitive matching:

```bash
md-extract --case-sensitive "TODO" project.md
```

Extract content without the heading:

```bash
md-extract --no-print-matched-heading "Summary" report.md
```

## md-headings

List all headings in a markdown document, displayed as an indented tree.

```console
$ md-headings my-document.md
Welcome
  Extract me!
  Another section
```

### Options

```
Usage: md-headings [options] <file>

List headings in a markdown document

Arguments:
  file             Path to markdown file

Options:
  -V, --version    output the version number
  -h, --help       display help for command
```

## Library Usage

You can also use this as a JavaScript library:

```javascript
import { extractFromPath } from "@kym6464/md-extract";

const regex = /Extract me!/i;
const matches = await extractFromPath("my-document.md", regex);
console.log(matches); // Array of matching sections
```

## Credits

This code was ported to JavaScript from [sean0x42/markdown-extract](https://github.com/sean0x42/markdown-extract).
