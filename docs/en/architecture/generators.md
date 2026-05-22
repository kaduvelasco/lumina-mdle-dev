🌐 [Português](../../pt-br/architecture/generators.md) | **English** | 🏠 [Index](../index.md)

---

# Generators

The **Generators** receive the structured data produced by the [Extractors](./extractors.md) and transform it into Markdown context files written directly into the Moodle installation. They are what make the content available for the MCP server to serve via Resources and Tools.

---

## Overview

```
src/generators/
├── moodle.ts  ← 13 global generators (Moodle root)
└── plugin.ts  ← 11 generators per plugin (plugin directory)
```

All generators follow the same contract:

- Receive a path (`moodlePath` or `PluginInfo`) as input
- Call the necessary extractors
- Build the Markdown content in memory
- Check the [mtime cache](./cache-system.md) before writing — if the `.md` file already exists and is newer than the PHP/XML sources, the file is skipped (`skipped: true`)
- Write the file to disk via `writeFileSync`
- Return a `GeneratorResult` with `{ file, success, skipped?, error? }`
- Each generator is wrapped in an **error boundary** via `safely()` — a failure in one generator does not interrupt the others

---

## Global generators (`moodle.ts`)

They generate files in the **Moodle root**. Called by `init_moodle_context` and `update_indexes`.

The entry function is `generateAll(moodlePath, moodleVersion)` which executes all generators below in parallel.

| Function                    | Generated file                 | Extractors used                |
| --------------------------- | ------------------------------ | ------------------------------ |
| `generateAiContext`         | `AI_CONTEXT.md`                | `moodle-detect`, `plugin`      |
| `generateApiIndex`          | `MOODLE_API_INDEX.md`          | `api`                          |
| `generateEventsIndex`       | `MOODLE_EVENTS_INDEX.md`       | `events`                       |
| `generateTasksIndex`        | `MOODLE_TASKS_INDEX.md`        | `tasks`                        |
| `generateServicesIndex`     | `MOODLE_SERVICES_INDEX.md`     | `services`                     |
| `generateDbTablesIndex`     | `MOODLE_DB_TABLES_INDEX.md`    | `schema`                       |
| `generateClassesIndex`      | `MOODLE_CLASSES_INDEX.md`      | `classes`                      |
| `generateCapabilitiesIndex` | `MOODLE_CAPABILITIES_INDEX.md` | `capabilities`                 |
| `generatePluginIndex`       | `MOODLE_PLUGIN_INDEX.md`       | `plugin`                       |
| `generateDevRules`          | `MOODLE_DEV_RULES.md`          | — (static content)             |
| `generatePluginGuide`       | `MOODLE_PLUGIN_GUIDE.md`       | — (static content + version)   |
| `generateAiWorkspace`       | `MOODLE_AI_WORKSPACE.md`       | `plugin`                       |
| `generateAiIndex`           | `MOODLE_AI_INDEX.md`           | — (lists existing files)       |
| `generateCtags`             | `tags`                         | — (executes `ctags` via shell) |

---

## Plugin generators (`plugin.ts`)

They generate files inside the **directory of each plugin**. Called by `generate_plugin_context` and `plugin_batch`.

The entry function is `generateAllForPlugin(pluginPath, moodlePath, markAsDev?)` which executes all generators below in parallel.

All generators receive a shared `PreloadedPluginData` object — the complete set of extracted data (schema, events, tasks, services, capabilities, upgrade, classes, hooks) pre-loaded once before the parallel run.

| Function                      | Generated file             | Data used from `PreloadedPluginData`                    |
| ----------------------------- | -------------------------- | ------------------------------------------------------- |
| `generatePluginContext`       | `PLUGIN_CONTEXT.md`        | `schema`, `events`, `tasks`, `services`, `capabilities` |
| `generatePluginStructure`     | `PLUGIN_STRUCTURE.md`      | — (directory reading only)                              |
| `generatePluginDbTables`      | `PLUGIN_DB_TABLES.md`      | `schema`                                                |
| `generatePluginEvents`        | `PLUGIN_EVENTS.md`         | `events`                                                |
| `generatePluginDependencies`  | `PLUGIN_DEPENDENCIES.md`   | `tasks`, `services`, `capabilities`, `hooks`, `upgrade` |
| `generatePluginFunctionIndex` | `PLUGIN_FUNCTION_INDEX.md` | — (glob + file read)                                    |
| `generatePluginCallbackIndex` | `PLUGIN_CALLBACK_INDEX.md` | `hooks`                                                 |
| `generatePluginEndpointIndex` | `PLUGIN_ENDPOINT_INDEX.md` | `services`                                              |
| `generatePluginRuntimeFlow`   | `PLUGIN_RUNTIME_FLOW.md`   | `classes`, `events`, `tasks`, `services`                |
| `generatePluginArchitecture`  | `PLUGIN_ARCHITECTURE.md`   | `classes`                                               |
| `generatePluginAiContext`     | `PLUGIN_AI_CONTEXT.md`     | all fields of `PreloadedPluginData`                     |

---

## Design details

### Error boundary — `safely()`

All generators are wrapped by the `safely()` function:

```typescript
async function safely(outputFile: string, fn: () => Promise<GeneratorResult>): Promise<GeneratorResult> {
    try {
        return await fn();
    } catch (e) {
        return { file: outputFile, success: false, error: String(e) };
    }
}
```

This ensures that if, for example, `db/install.xml` is malformed, `generatePluginDbTables` fails silently and the other 10 plugin generators continue executing normally.

---

### Standard header — `header()`

All generated `.md` files start with a standardized header produced by the `header()` function:

```
# File title

> Content description

_Generated by lumina-mdle-dev on 2024-04-22 10:30:00_

---
```

The timestamp allows detecting outdated files without needing to compare content.

---

### Filtering generated files — `GENERATED_FILES`

`generatePluginStructure` needs to list the contents of the plugin directory without including the `.md` files generated by the server itself. For that, it uses the `GENERATED_FILES` set:

```typescript
const GENERATED_FILES = new Set([
    "PLUGIN_AI_CONTEXT.md",
    "PLUGIN_CONTEXT.md",
    "PLUGIN_STRUCTURE.md",
    // ... all 11 generated files
    ".indevelopment",
]);
```

Files present in this set are excluded from the directory tree shown in `PLUGIN_STRUCTURE.md`.

---

### `PLUGIN_AI_CONTEXT.md` — the consolidator

`generatePluginAiContext` consolidates the most relevant data from the `PreloadedPluginData` object (schema, events, tasks, services, capabilities, classes, hooks) into a single file optimized to be the AI entry point. It runs in parallel with the other generators — all 11 share the same pre-loaded data.

---

### Global generators and plugin generators: both in parallel

Global generators in `generateAll()` execute in **parallel** — they are independent from each other and operate on different files, so there is no risk of race conditions.

Plugin generators in `generateAllForPlugin()` also execute in **parallel** — data extraction is done once up front (`PreloadedPluginData`), so each generator receives complete data from the start and has no dependency on the others.

---

### `generateCtags` — optional ctags generation

The ctags generator runs the `ctags` command via `execFileAsync` only if the `universal-ctags` binary is available in the PATH. It passes through the `run()` cache helper like all other global generators — if the `tags` file is newer than the tracked source patterns, the ctags run is skipped. If ctags is not installed, the generator returns a non-fatal error result and the `tags` file is not created.

---

## Adding a new generator

**1. Decide where the generated file should live:**

- Moodle root → add in `moodle.ts` and register in `generateAll()`
- Plugin directory → add in `plugin.ts` and register in `generateAllForPlugin()`

**2. Implement the function following the contract:**

```typescript
export async function generateMeuArquivo(moodlePath: string): Promise<GeneratorResult> {
    return safely(join(moodlePath, "MEU_ARQUIVO.md"), async () => {
        // 1. Check cache
        const sourceFiles = [join(moodlePath, "lib", "meuarquivo.php")];
        if (globalCache.isUpToDate(join(moodlePath, "MEU_ARQUIVO.md"), sourceFiles)) {
            return { file: join(moodlePath, "MEU_ARQUIVO.md"), success: true, skipped: true };
        }

        // 2. Call extractor(s)
        const dados = extractMeuDado(join(moodlePath, "lib", "meuarquivo.php"));

        // 3. Build Markdown content
        const content = [
            header("Meu Arquivo", "Content description"),
            dados.map((d) => `- ${d.campo}`).join("\n"),
        ].join("\n");

        // 4. Write to disk
        return write(join(moodlePath, "MEU_ARQUIVO.md"), content);
    });
}
```

**3. Register in `generateAll()` or `generateAllForPlugin()`:**

```typescript
// In generateAll():
results.push(await safely(..., () => generateMeuArquivo(moodlePath)));
```

**4. Add the entry to `GENERATED_FILES` if it is a plugin file.**

**5. Document the new file in [Generated Files](../reference/generated-files.md).**

---

## See also

- [Extractors](./extractors.md) — the modules that feed the generators
- [Cache System](./cache-system.md) — when a generator skips writing
- [Generated Files](../reference/generated-files.md) — complete list of produced `.md`

---

[🏠 Back to Index](../index.md)
