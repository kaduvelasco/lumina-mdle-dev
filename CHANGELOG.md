# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] — 2026-05-27

### Fixed

- **`tools/release.ts`:** `archiver` v8 removed the default export and the `archiver(format, options)` factory in favour of named class exports (`ZipArchive`, `TarArchive`). Import updated from `import archiver from "archiver"` to `import { ZipArchive } from "archiver"`; instantiation updated from `archiver("zip", options)` to `new ZipArchive(options)`. The runtime server startup error introduced by the v8 upgrade was silently masked because tests do not cover HTTP server initialisation.
- **`cli/install.ts`:** Re-thrown error in `readJson` was missing `{ cause: e }` — the original parse exception was lost, making the error message the only debugging signal. Corrected to `new Error(msg, { cause: e })` to preserve the full error chain (`preserve-caught-error`).
- **`generators/plugin.ts`:** Dead initial assignment `let entries: string[] = []` removed — the `[]` value was never read because either the `try` block immediately replaced it or the `catch` block returned early (`no-useless-assignment`).
- **`tools/search.ts`:** Dead initial assignment `let mtime = 0` removed — same pattern as above; `statSync` always overwrites it or the catch returns early.
- **`tools/batch.ts`:** Unused imports `existsSync` (from `fs`) and `resolve` (from `path`) removed.
- **`tools/update.ts`:** Unused import `resolve` (from `path`) removed — the comment referencing it described a previous implementation that no longer exists.
- **`generators/moodle.ts`:** `generateDevRules` and `generatePluginGuide` converted from synchronous to async, wrapped with the `safely()` error boundary — aligns with every other generator in the same file; previously an uncaught exception in either function would crash `generateAll` rather than recording a failed result.
- **`generators/moodle.ts`:** Per-index source patterns in `generateAll` — each data-driven generator now receives glob-collected source files matching its own file type as the cache invalidation signal (`**/db/events.php`, `**/db/tasks.php`, `**/db/services.php`, `**/db/install.xml`, `**/db/access.php`); structural generators (`MOODLE_API_INDEX.md`, `MOODLE_CLASSES_INDEX.md`, `MOODLE_DEV_RULES.md`, `tags`) use `getMoodleSourcePatterns`; plugin-level indexes (`MOODLE_PLUGIN_INDEX.md`, `MOODLE_AI_WORKSPACE.md`, `AI_CONTEXT.md`, `MOODLE_AI_INDEX.md`) use `pluginVersionFiles`. Previously all 13 generators shared the same 3 structural files as their invalidation signal, so modifying any plugin's `db/events.php` would not trigger regeneration of `MOODLE_EVENTS_INDEX.md` unless one of those 3 structural files had also changed.
- **`http.ts`:** HTTP server shutdown now awaits all `streamableSessions` and `sseSessions` close calls via `Promise.allSettled` before closing the underlying HTTP server — prevents active connections from being abandoned on graceful shutdown.
- **`http.ts`:** Duck-type guard on the SSE transport object removed — the SDK type system is the correct guard; replaced with a direct method call.
- **`cli/install.ts`:** Duplicate `isMoodleRoot` function body removed; now imported from `extractors/moodle-detect.ts` — single source of truth, eliminating a silent divergence risk.
- **`tools/update.ts`**, **`tools/release.ts`:** Redundant config-check blocks (7 lines each) replaced by the shared `NOT_INITIALIZED` constant from `utils/tool-helpers.ts`.
- **`tools/plugin.ts`**, **`tools/search.ts`**, **`tools/explain.ts`:** Inline path traversal guard (`resolve + startsWith + sep`) replaced by `isWithinMoodle(pluginPath, moodlePath)` from `utils/plugin-types.ts` — removes a duplicated security pattern across three tool files.
- **`extractors/api.ts`:** `includePrivate` and `includeUnverified` parameters removed from `extractMoodleApi` — these flags were unused by all callers; the filter now statically returns only public and deprecated functions.
- **`extractors/hooks.ts`:** Unused exported function `pluginHasLegacyCallbacks` removed.
- **`extractors/plugin.ts`:** Unused exported function `getPluginTypeMap` removed.
- **`extractors/classes.ts`:** Unused exported function `groupByKind` removed.
- **`cache.ts`:** Unused `resetStats` method removed from `MtimeCache` — `getStats` already returns a full snapshot; `resetStats` was never called.

### Changed

- **`generators/moodle.ts`:** `generateAll` now pre-computes `pluginDirs` once via `findPluginDirs` and passes the result to all generators that iterate over plugins (`generateAiContext`, `generatePluginIndex`, `generateAiWorkspace`, `generateAiIndex`) — previously each generator independently rediscovered plugin directories with redundant glob calls.
- **`generators/moodle.ts`:** `run()` helper inside `generateAll` now accepts an explicit `sources: string[]` parameter instead of capturing a single shared variable — makes each generator's invalidation signal visible at the call site.
- **`generators/plugin.ts`:** `generateAllForPlugin` gains an optional fourth parameter `existingInfo?: PluginInfo` — callers that already hold a pre-detected `PluginInfo` (e.g. `generateAll`) can pass it in to skip a redundant `detectPlugin` filesystem read.
- **`cache.ts`:** `getMoodleSourcePatterns` docstring updated to reflect its narrowed scope — structural generators only; data-driven generators now use per-file-type patterns collected via glob in `generateAll`.
- **`zod` upgraded v3 → v4:** no breaking changes for this project. One adjustment required: `z.record(z.string())` (single-argument form) was removed in v4 — updated to `z.record(z.string(), z.string())` in `extractors/capabilities.ts`.
- **`express` upgraded v4 → v5** and **`@types/express` upgraded v4 → v5:** the `app.all("/mcp", ...)` route and all other API surface used in `src/http.ts` are fully compatible with v5 — no code modifications required. Express v5 now automatically forwards unhandled async errors to error middleware; existing `try/catch` blocks remain functional.
- **`archiver` upgraded v7 → v8:** resolves the transitive inclusion of the deprecated `glob@10.5.0`. The v8 upgrade changed the module from CommonJS to ESM with named class exports — code changes in `tools/release.ts` were required (see Fixed above).
- **`fast-xml-parser` upgraded v4 → v5:** resolves a moderate severity vulnerability (XMLBuilder comment/CDATA injection, [GHSA-gh4j-gqv2-49f6](https://github.com/advisories/GHSA-gh4j-gqv2-49f6)). The project uses only `XMLParser` — no code modifications required.
- **`eslint` upgraded v9 → v10:** the project already used flat config (`eslint.config.js`) — the main v10 requirement. `@eslint/js` is now a separate peer dependency (was bundled in v9). Node.js globals (`process`, `Buffer`, etc.) must now be declared explicitly via `globals.node` in `languageOptions`. Two new rules enforced: `no-useless-assignment` and `preserve-caught-error` (see Fixed above).
- **`typescript` upgraded v5 → v6:** zero code changes required — all existing patterns and compiler options (`Node16` module/moduleResolution, strict mode) are fully compatible with v6.
- **`@types/node` updated 22.19.17 → 22.19.19** (patch).
- **`tsx` updated 4.21.0 → 4.22.3** (patch).
- **`@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` updated 8.59.0 → 8.60.0** (patch).
- **`npm audit fix` applied:** resolved 7 moderate and 1 high severity vulnerabilities in transitive dependencies (`brace-expansion` DoS, `fast-uri` path traversal and host confusion, `hono` multiple CVEs, `ip-address` XSS, `qs` DoS).
- **`eslint.config.js` updated:** added `globals.node` to `languageOptions` so Node.js globals are recognised; added an `ignores` block to skip `src/**/*.d.ts` files (type declaration files are not runtime code).

### Added

- **`utils/plugin-types.ts`:** `isWithinMoodle(absolutePath, moodlePath)` — shared path security utility that consolidates the `resolve + startsWith + sep` pattern previously duplicated inline in `tools/plugin.ts`, `tools/search.ts`, and `tools/explain.ts`.
- **`generators/moodle.ts`:** `pluginInfoCache: Map<string, PluginInfo>` — session-local cache for `detectPlugin` results, created in `generateAll` and passed to `generatePluginIndex`, `generateAiWorkspace`, and `generateAiIndex`; reduces redundant `version.php` reads when multiple generators visit the same plugin in a single `generateAll` call.
- **`tools/update.ts`:** `watch_plugins` now forwards regeneration events to the MCP client via `server.sendLoggingMessage` — watcher activity is visible in the AI client's log panel without requiring a separate tool call.
- **`src/types/archiver.d.ts`:** minimal TypeScript declaration file for the `archiver` v8 ESM API (`ZipArchive` class with `.file()`, `.pipe()`, `.finalize()`, and `.on()` methods). Replaces the now-incompatible `@types/archiver` v7 package.
- **`@eslint/js`** added as explicit `devDependency`: was a bundled transitive in ESLint v9 — now a separate peer dependency in v10, required by `eslint.config.js`.
- **`globals`** added as `devDependency`: required to declare Node.js runtime globals in the ESLint v10 flat config.

### Removed

- **`@types/archiver`** removed from `devDependencies`: the DefinitelyTyped package covers the v7 API (default export `archiver(format, options)`) which was removed in v8. Replaced by the project-local `src/types/archiver.d.ts`.

---

## [1.0.2] — 2026-05-22

### Fixed

- **`cli/install.ts`:** `inPath()` used `which` on all platforms — fails on Windows where `where` is required. Detection of all CLI targets (Claude, Codex, Antigravity, etc.) would silently fail on Windows.
- **`tools/init.ts` + `tools/plugin.ts`:** File paths shown in tool responses were computed with `String.replace()` instead of `path.relative()`, producing incorrect output when the Moodle root path ended with a separator or on Windows (backslash separators).
- **`watcher.ts`:** The `running` flag was set to `true` even when no `.indevelopment` markers existed — a subsequent `watch_plugins action='start'` would be rejected with "Watcher is already running" while nothing was actually being watched. Dev markers are now sorted before the `MAX_WATCHED_PLUGINS` slice, ensuring deterministic selection when the limit is reached.
- **`generators/plugin.ts`:** Dead variable `suffix` in `generatePluginCallbackIndex` was assigned but never read.
- **`generators/moodle.ts`:** `generateCtags` bypassed the `run()` cache helper — the ctags binary was invoked (or checked) on every `generateAll()` call, regardless of whether the `tags` file was already up to date.
- **`config.ts`:** Inline comment incorrectly described the `.moodle-mcp` storage location as "the current working directory" (the file is stored in the user's home directory).
- **`extractors/api.ts`:** `readdirSync` was called without `{ withFileTypes: true }`, requiring an extra `statSync` syscall per directory entry. In recursive mode, duplicate entries could be produced when a `PRIORITY_FILES` path overlapped with a subdirectory also reached by recursion; duplicates are now filtered via the `seen` Set.

### Changed

- **`extractors/capabilities.ts`:** Local `extractCapabilitiesBody` function (a full copy of the bracket-counting algorithm) replaced by `extractArrayBody(content, "capabilities")` from `utils/php-parser.ts`.
- **`extractors/services.ts`:** Local `extractFunctionsBody` function replaced by `extractArrayBody(content, "functions")` — same shared utility.
- **`tools/doctor.ts`:** Hardcoded `EXPECTED_PLUGIN_FILES` list replaced by the imported `PLUGIN_CONTEXT_FILES` constant from `generators/plugin.ts`. The doctor now automatically includes any future generated files without requiring a manual sync.
- **`tools/batch.ts`:** Local `findDevPlugins` function removed — now imported from `generators/moodle.ts`.
- **`tools/update.ts`:** Inline dev-plugin glob replaced by the shared `findDevPlugins` utility; `\`${pluginDir}/${f}\`` template literals replaced by `path.join()` for cross-platform correctness.
- **`extractors/classes.ts`:** `extractClasses` now accepts an optional `globPattern` parameter (default: `"**/*.php"`), allowing callers to restrict the scan to a specific file pattern.
- **`generators/moodle.ts`:** `generateClassesIndex` now uses `"**/classes/**/*.php"` instead of `"**/*.php"` — scanning the entire Moodle root for class declarations was unnecessarily slow on installations with thousands of PHP files.
- **`generators/plugin.ts`:** `generateAllForPlugin` now pre-loads all extracted data once (`schema`, `events`, `tasks`, `services`, `capabilities`, `upgrade`, `classes`, `hooks`) into a `PreloadedPluginData` object before dispatching to generators — eliminates up to 6× redundant filesystem reads per plugin regeneration. All 11 per-plugin generators accept an optional `preloaded?: PreloadedPluginData` parameter and fall back to live extraction when called without it.

### Added

- **`generators/moodle.ts`:** `findDevPlugins(moodlePath): Promise<string[]>` exported as a shared utility for locating plugins marked with `.indevelopment`.

---

## [1.0.1] — 2026-05-21

### Changed

- **Logo updated in `README.md` and `LEIAME.md`:** replaced `logo2.png` with `logo.png`.
- **Migrated Gemini CLI → Antigravity CLI:** Google discontinued the `gemini` CLI binary (deadline: June 18, 2026) in favour of Antigravity CLI (`agy`). Updated all documentation, the `lumina-md install` auto-detection target, and the MCP configuration file path (`~/.gemini/settings.json` → `~/.gemini/antigravity/mcp_config.json`). The dedicated client guide was replaced by `docs/*/guides/clients/antigravity.md`.

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
