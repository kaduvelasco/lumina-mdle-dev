# Publishing Guide

This document covers how to publish `lumina-mdle-dev` to npm and register it in the
official MCP Registry.

> **Note:** This file is for the maintainer only. It is not included in the npm package (listed in `.npmignore`).

---

## Prerequisites

- Node.js >= 18
- An npm account at [npmjs.com](https://www.npmjs.com) (free)
- The package name `lumina-mdle-dev` must be available (check with `npm info lumina-mdle-dev`)

---

## 1. Publish to npm

### 1.1 Build and verify the package

```bash
# Clean any previous build
npm run clean

# Build TypeScript → dist/
npm run build

# Inspect what will be published (dry run — nothing is sent to npm)
npm pack --dry-run
```

The dry-run output should list only:
```
dist/
README.md
LEIAME.md
LICENSE
.env.example
package.json
```

If `src/`, `node_modules/`, or `.moodle-mcp` appear, check `.npmignore`.

### 1.2 Login to npm

```bash
npm login
# Enter your username, password, and OTP if 2FA is enabled
```

Verify you are logged in:

```bash
npm whoami
# → kaduvelasco
```

### 1.3 First publish

```bash
npm publish --access public
```

> `--access public` is required for scoped packages (`@scope/name`).
> For unscoped packages like `lumina-mdle-dev` it is optional but harmless.

Verify the publication:

```bash
npm info lumina-mdle-dev
```

### 1.4 Test the published package

```bash
# In a temporary directory, without cloning the repo
mkdir /tmp/test-lumina-mdle-dev && cd /tmp/test-lumina-mdle-dev
npx -y lumina-mdle-dev --help
```

You should see the help output from `src/index.ts`.

---

## 2. Releasing a new version

### 2.1 Bump the version

Follow [Semantic Versioning](https://semver.org):

| Change type | Command | Example |
|-------------|---------|---------|
| Bug fix | `npm version patch` | `1.0.0` → `1.0.1` |
| New feature (backwards-compatible) | `npm version minor` | `1.0.0` → `1.1.0` |
| Breaking change | `npm version major` | `1.0.0` → `2.0.0` |

```bash
# Example: new feature release
npm version minor
# This bumps package.json, creates a git commit and a git tag (v1.1.0)
```

### 2.2 Publish the new version

```bash
npm publish --access public
```

### 2.3 Push the tag to GitHub

```bash
git push origin main --tags
```

---

## 3. Register in the official MCP Registry

The [MCP Registry](https://github.com/modelcontextprotocol/registry) is the official
directory consulted by Claude Desktop, Cursor, and other clients for server discovery.

### 3.1 Keep `server.json` up to date

The `server.json` at the root of the repository must match the npm version:

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-07-09/server.schema.json",
  "name": "io.github.kaduvelasco/lumina-mdle-dev",
  "description": "...",
  "version": "1.0.0",
  "packages": [
    {
      "registry_type": "npm",
      "identifier": "lumina-mdle-dev",
      "version": "1.0.0"
    }
  ]
}
```

Update `version` in `server.json` every time you publish a new version to npm.

### 3.2 Submit to the registry

1. Fork [modelcontextprotocol/registry](https://github.com/modelcontextprotocol/registry)
2. Add an entry pointing to your `server.json`:
   ```
   servers/io.github.kaduvelasco/lumina-mdle-dev/server.json
   ```
3. Open a Pull Request

The registry validates that:
- The npm package `lumina-mdle-dev` exists and is public
- The GitHub repository `kaduvelasco/lumina-mdle-dev` is accessible
- The `server.json` schema is valid

---

## 4. User configuration after publishing

Once on npm, users can configure any client without cloning the repository:

### Claude Desktop (`~/.config/Claude/claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "lumina-mdle-dev": {
      "command": "npx",
      "args": ["-y", "lumina-mdle-dev"],
      "env": {
        "MOODLE_PATH": "/home/youruser/workspace/www/html/moodle"
      }
    }
  }
}
```

### Claude Code (`~/.claude.json`)

```bash
claude mcp add lumina-mdle-dev \
  -e MOODLE_PATH=/home/youruser/workspace/www/html/moodle \
  -- npx -y lumina-mdle-dev
```

### Cursor (`~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "lumina-mdle-dev": {
      "command": "npx",
      "args": ["-y", "lumina-mdle-dev"],
      "env": {
        "MOODLE_PATH": "/home/youruser/workspace/www/html/moodle"
      }
    }
  }
}
```

### Antigravity CLI (`~/.gemini/antigravity/mcp_config.json`)

```json
{
  "mcpServers": {
    "lumina-mdle-dev": {
      "command": "npx",
      "args": ["-y", "lumina-mdle-dev"],
      "env": {
        "MOODLE_PATH": "/home/youruser/workspace/www/html/moodle"
      }
    }
  }
}
```

### OpenAI Codex (`~/.codex/config.toml`)

```toml
[mcp_servers.lumina-mdle-dev]
command = "npx"
args    = ["-y", "lumina-mdle-dev"]
env     = { MOODLE_PATH = "/home/youruser/workspace/www/html/moodle" }
```

> **Linux PATH issue:** if `npx` is not found, add `PATH` to `env`:
> ```json
> "env": {
>   "PATH": "/home/youruser/.nvm/versions/node/v22.0.0/bin:/usr/local/bin:/usr/bin:/bin",
>   "MOODLE_PATH": "/home/youruser/workspace/www/html/moodle"
> }
> ```
> For Codex (TOML), use `env_vars = ["PATH"]` instead.

---

## 5. Checklist before each release

- [ ] All tests pass: `npm test`
- [ ] TypeScript compiles cleanly: `npm run typecheck`
- [ ] `npm pack --dry-run` lists only the expected files
- [ ] `CHANGELOG.md` updated (if maintained)
- [ ] `server.json` version matches `package.json`
- [ ] `README.md` reflects any new features or breaking changes
- [ ] Git working directory is clean: `git status`
- [ ] Version bumped with `npm version patch|minor|major`

---

## 6. Useful npm commands

```bash
# Check if a package name is available
npm info lumina-mdle-dev

# See what files will be included in the package
npm pack --dry-run

# Preview the tarball (inspect the actual .tgz)
npm pack
tar tzf lumina-mdle-dev-*.tgz
rm lumina-mdle-dev-*.tgz

# Deprecate a version (if a bug was published)
npm deprecate lumina-mdle-dev@1.0.0 "Critical bug — upgrade to 1.0.1"

# Unpublish within 72 hours of publish (emergency only)
npm unpublish lumina-mdle-dev@1.0.0
```
