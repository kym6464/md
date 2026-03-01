# MAINTAINERS

This document is intended for maintainers of this repository.

## Releasing

### 1. Run the Release workflow

Go to Actions > Release > Run workflow. Choose `patch`, `minor`, or `major`.

This will:

1. Bump `package.json`, commit, and push a git tag
2. Build standalone binaries for macOS, Linux, and Windows
3. Repackage the macOS/Linux binaries as tarballs for Homebrew
4. Create a GitHub release with all artifacts

The release automatically triggers:

- **Homebrew** - updates the formula in [kym6464/homebrew-tap](https://github.com/kym6464/homebrew-tap)
- **npm** - publishes the package to the npm registry

### Secrets

- `HOMEBREW_PAT` - Fine-grained PAT with read-write Contents access to both this repo and `homebrew-tap`. Used to create releases (so the event triggers the Homebrew workflow) and to push formula updates.
