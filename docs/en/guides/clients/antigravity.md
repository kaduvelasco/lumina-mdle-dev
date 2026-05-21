🇧🇷 [Português (BR)](../../../pt-br/guides/clients/antigravity.md) | **English** | 🏠 [Index](../../index.md)

---

# Using with Antigravity CLI

**Antigravity CLI** (`agy`) is Google's Go-based terminal AI coding agent, the successor to Gemini CLI. It reads MCP server definitions from its global configuration file.

---

## 🛠️ MCP Server Configuration

Open or create the global configuration file:

| Operating system | Path |
|------------------|------|
| Linux / macOS | `~/.gemini/antigravity/mcp_config.json` |
| Windows | `%USERPROFILE%\.gemini\antigravity\mcp_config.json` |

Add the server under the `mcpServers` block:

**Via NPM:**

```json
{
    "mcpServers": {
        "lumina-mdle-dev": {
            "command": "npx",
            "args": ["-y", "lumina-mdle-dev"],
            "env": {
                "MOODLE_PATH": "/path/to/your/moodle"
            }
        }
    }
}
```

**Via cloned repository:**

```json
{
    "mcpServers": {
        "lumina-mdle-dev": {
            "command": "node",
            "args": ["/absolute/path/to/lumina-mdle-dev/dist/index.js"],
            "env": {
                "MOODLE_PATH": "/path/to/your/moodle"
            }
        }
    }
}
```

> **Problem with nvm / mise / asdf:** Antigravity CLI inherits the environment of the parent process, which may not include your shell's PATH. If `npx` is not found, add the PATH explicitly:
> ```json
> "env": {
>     "PATH": "/home/user/.nvm/versions/node/v22.0.0/bin:/usr/local/bin:/usr/bin:/bin",
>     "MOODLE_PATH": "/path/to/your/moodle"
> }
> ```
> Run `which node` in your terminal to find the correct path.

### After configuring

Restart the Antigravity CLI session (`Ctrl+C` then `agy` again) to load the new server.

---

## 💡 Recommended Workflows

### Starting a development session

At the beginning of each session, load the plugin context:

```
I'm working on local_myplugin. Load the full context.
```

Antigravity CLI will call `get_plugin_info` and gain knowledge of the plugin's architecture, database, functions, and coding patterns.

### Querying the core API

```
Which core API functions should I use to check if a user
is enrolled in a course? Prefer public, non-deprecated functions.
```

Antigravity CLI will use `search_api` and return functions with signatures and source files.

### Creating new plugins with a slash command

Use the slash command directly:

```
/scaffold_plugin type="local" name="web_service_test" description="Web service test plugin" features="web services, capabilities"
```

After creating the files, generate context:

```
Generate the AI context for local_web_service_test.
```

### Pre-commit review

```
/review_plugin plugin="local/myplugin" focus="security"
```

---

## ⚠️ Troubleshooting

### First step: verify the connection

Type `/mcp` in the chat. If `lumina-mdle-dev` does not appear, the problem is in the configuration — not your prompt.

### Server does not appear after configuring

Open `~/.gemini/antigravity/mcp_config.json` and verify the format:

**Via NPM (without nvm/mise/asdf):**
```json
{
  "mcpServers": {
    "lumina-mdle-dev": {
      "command": "npx",
      "args": ["-y", "lumina-mdle-dev"],
      "env": { "MOODLE_PATH": "/absolute/path/to/your/moodle" }
    }
  }
}
```

**Via cloned repository or with nvm/mise/asdf (recommended):**
```json
{
  "mcpServers": {
    "lumina-mdle-dev": {
      "command": "/absolute/path/to/node",
      "args": ["/absolute/path/to/lumina-mdle-dev/dist/index.js"],
      "env": { "MOODLE_PATH": "/absolute/path/to/your/moodle" }
    }
  }
}
```

> Run `which node` in your terminal to get the absolute path of `node`.

After fixing, restart the `agy` session.

### Relative paths don't work

`mcp_config.json` requires **absolute paths**. Relative paths like `./dist/index.js` are not resolved by Antigravity CLI.

### Incorrect MOODLE_PATH

Make sure `MOODLE_PATH` points to the directory containing `version.php`. The server fails silently if it cannot validate the installation.

### Stale context after changes

- **New plugin installed:** _"Regenerate all global Moodle indexes."_ → `update_indexes`
- **Changes to a plugin:** _"Regenerate the context for local_myplugin."_ → `generate_plugin_context`

---

## ➡️ Next Steps

- [Claude Code](./claude-code.md) — Anthropic's CLI with native MCP support
- [OpenAI Codex](./codex.md) — OpenAI's CLI with TOML configuration
- [OpenCode](./opencode.md) — open-source agent with TUI interface
- [Workflow Examples](../workflows/examples.md) — real-world use cases and ready-to-use prompts
- [Tools Reference](../../reference/tools.md) — complete parameters for all tools
- [Common Issues](../../troubleshooting/common-issues.md) — detailed troubleshooting
- [Back to Index](../../index.md)

---

Made with ❤️ and AI by [Kadu Velasco](https://github.com/kaduvelasco)
