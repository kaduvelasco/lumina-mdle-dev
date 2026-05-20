# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-05-20

### Fixed

- **`extractors/hooks.ts`:** Corrected logical operator in the `db/hooks.php` parser (`&&` → `||`) — entries with only `hookname` or only `callback` were previously accepted, producing incomplete hook registrations in the generated context.
- **`extractors/php-parser.ts`:** PHP single-quoted string unescaping (`\\` → `\`) is now applied to all values extracted from PHP array literals — FQN class names with backslashes (e.g. `\local_myplugin\task\my_task`) were previously returned with double backslashes, causing mismatches in hook maps and callback indexes.
- **`resources/plugin.ts`:** Template variable `component` is now safely cast from `string | string[]` — MCP resource templates can deliver variables as arrays; the previous `String()` cast would have produced corrupt component strings in that case.
- **`generators/plugin.ts`:** Removed duplicate `classes/` prefix in `PLUGIN_ARCHITECTURE.md` section headers — the directory label was rendered as `classes/classes/task/` instead of `classes/task/`.
- **`generators/moodle.ts`:** `generateCtags` no longer blocks the Node.js event loop — replaced synchronous `execFileSync` (up to 2 min timeout) with `execFileAsync` via `util.promisify`. Also replaced `execSync("command -v ctags")` with the portable `execFileAsync("which"/"where", ["ctags"])` pattern consistent with the rest of the codebase.
- **`watcher.ts`:** File invalidation on change now uses the exported `PLUGIN_CONTEXT_FILES` constant instead of a hardcoded list — previously, any new generator output file would have been missed by the watcher until the list was manually updated.
- **`resources/plugin.ts`:** Replaced local `resolvePluginPath` (component-only, with a slow fallback directory scan) with the shared `resolvePluginPath` from `utils/plugin-types.ts`, which supports absolute paths, relative paths, and component format consistently with all other tools.
- **`tools/search.ts`:** Removed `loadConfigOrNull` wrapper that was identical to `loadConfig()`, eliminating a misleading indirection.

### Changed

- **New `src/utils/php-parser.ts`:** Shared PHP array parsing helpers (`extractArrayBody`, `splitIntoBlocks`, `extractString`, `extractInt`, `extractBool`) extracted from five separate extractor modules (`events.ts`, `tasks.ts`, `hooks.ts`, `services.ts`). Previously each module defined its own copy.
- **New `src/utils/generator-helpers.ts`:** Shared generator utilities (`GeneratorResult`, `write`, `timestamp`, `header`, `safely`) extracted from `generators/moodle.ts` and `generators/plugin.ts`, which previously maintained identical duplicate implementations.

### Added

- **MCP server** connecting AI assistants to a local Moodle installation via filesystem — no Moodle API token required.
- **STDIO transport** (default) for local clients (Claude Code, Cursor, VS Code, Gemini).
- **HTTP/Streamable HTTP transport** (`--http`) for remote installations, with Bearer token authentication and Host header validation against DNS rebinding.
- **12 tools:**
  - `init_moodle_context` — validates path, detects version, and generates all global index files.
  - `generate_plugin_context` — generates the complete AI context package for a single plugin.
  - `plugin_batch` — generates or refreshes context for multiple plugins (`dev`, `all`, or `list` mode).
  - `update_indexes` — regenerates global indexes with mtime-based cache.
  - `watch_plugins` — file watcher with debounce that triggers automatic context regeneration on save.
  - `search_plugins` — full-text search over the plugin index.
  - `search_api` — searches core API functions by name and visibility.
  - `get_plugin_info` — returns detailed info for a specific plugin component.
  - `list_dev_plugins` — lists all plugins marked as in development (`.indevelopment`).
  - `doctor` — diagnostics: Node.js, PHP, ctags, Moodle path, index staleness, cache stats.
  - `explain_plugin` — structured explanation of a plugin's architecture (live or from context files).
  - `release_plugin` — packages a plugin into a versioned ZIP, excluding generated and dev files.
- **Global index files** generated inside the Moodle root: API index, events, tasks, services, DB tables, classes, capabilities, plugin map, dev rules, plugin guide, AI context, AI workspace, and AI master index.
- **Per-plugin context files:** `PLUGIN_AI_CONTEXT.md`, `PLUGIN_CONTEXT.md`, `PLUGIN_STRUCTURE.md`, `PLUGIN_DB_TABLES.md`, `PLUGIN_EVENTS.md`, `PLUGIN_DEPENDENCIES.md`, `PLUGIN_ARCHITECTURE.md`, `PLUGIN_FUNCTION_INDEX.md`, `PLUGIN_CALLBACK_INDEX.md`, `PLUGIN_ENDPOINT_INDEX.md`, `PLUGIN_RUNTIME_FLOW.md`.
- **3 MCP prompts:** `scaffold_plugin`, `review_plugin`, `debug_plugin`.
- **MCP resources** exposing Moodle structure and plugin data as readable URIs.
- **Hook API support** (Moodle 4.3+): extracts `db/hooks.php` callbacks and `classes/hook/` definitions; detects legacy callbacks requiring migration.
- **Mtime-based cache** (`MtimeCache`) for fast repeated generation — skips files whose sources have not changed.
- **`lumina-md install` CLI** — auto-detects installed AI tools (Claude, Gemini, Cursor, Zed, Cline, Codex, OpenCode, Windsurf) and configures the MCP server in each.
- **Configuration** via `.moodle-mcp` file or `MOODLE_PATH` / `MOODLE_VERSION` environment variables.

---

Made with ❤️ and AI by [Kadu Velasco](https://github.com/kaduvelasco)
