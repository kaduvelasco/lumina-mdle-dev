// Install command — configures lumina-mdle-dev as an MCP server in AI tools.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join, resolve } from "path";
import { homedir } from "os";
import { spawnSync } from "child_process";
import { createInterface } from "readline";

const HOME        = homedir();
const SERVER_NAME = "lumina-mdle-dev";
const NPX_COMMAND = "npx";
const NPX_ARGS    = ["-y", "lumina-mdle-dev"] as const; // #8: as const prevents accidental mutation

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InstallResult =
  | { status: "ok" }
  | { status: "skipped"; reason: string }
  | { status: "error";   message: string };

interface Target {
  id:      string;
  label:   string;
  /** How the tool is detected: "cli" checks PATH, "file" checks config dir. */
  kind:    "cli" | "file";
  detect(): boolean;
  install(moodlePath: string): Promise<InstallResult>; // #3: moodlePath threaded through
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inPath(binary: string): boolean {
  return spawnSync("which", [binary], { stdio: "pipe" }).status === 0;
}

function readJson(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) return {};
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>;
  } catch (e) {
    throw new Error(`Cannot parse ${filePath} — invalid JSON: ${String(e)}`);
  }
}

// #6: mkdirSync with recursive:true is idempotent — existsSync check is redundant.
function writeJson(filePath: string, data: Record<string, unknown>): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

// #4: Cline's globalStorage path differs across operating systems.
function clineDir(): string {
  switch (process.platform) {
    case "darwin":
      return join(HOME, "Library", "Application Support", "Code", "User", "globalStorage", "saoudrizwan.claude-dev");
    case "win32":
      return join(
        process.env["APPDATA"] ?? join(HOME, "AppData", "Roaming"),
        "Code", "User", "globalStorage", "saoudrizwan.claude-dev"
      );
    default:
      return join(HOME, ".config", "Code", "User", "globalStorage", "saoudrizwan.claude-dev");
  }
}

// #7: async instead of Promise.resolve() wrappers.
// Standard { mcpServers: { name: { command, args, env } } } format (most tools).
async function installMcpServers(filePath: string, moodlePath: string): Promise<InstallResult> {
  try {
    const config  = readJson(filePath);
    const servers = (config["mcpServers"] as Record<string, unknown> | undefined) ?? {};
    servers[SERVER_NAME] = { command: NPX_COMMAND, args: [...NPX_ARGS], env: { MOODLE_PATH: moodlePath } };
    config["mcpServers"] = servers;
    writeJson(filePath, config);
    return { status: "ok" };
  } catch (e) {
    return { status: "error", message: String(e) };
  }
}

// OpenCode uses { mcp: { name: { type: "local", command: [...], env: {...} } } }.
async function installOpenCode(filePath: string, moodlePath: string): Promise<InstallResult> {
  try {
    const config = readJson(filePath);
    const mcp    = (config["mcp"] as Record<string, unknown> | undefined) ?? {};
    mcp[SERVER_NAME] = { type: "local", command: [NPX_COMMAND, ...NPX_ARGS], env: { MOODLE_PATH: moodlePath } };
    config["mcp"]    = mcp;
    writeJson(filePath, config);
    return { status: "ok" };
  } catch (e) {
    return { status: "error", message: String(e) };
  }
}

// Zed uses { context_servers: { name: { command: { path, args }, env: {...} } } }.
async function installZed(filePath: string, moodlePath: string): Promise<InstallResult> {
  try {
    const config  = readJson(filePath);
    const servers = (config["context_servers"] as Record<string, unknown> | undefined) ?? {};
    servers[SERVER_NAME]      = { command: { path: NPX_COMMAND, args: [...NPX_ARGS] }, env: { MOODLE_PATH: moodlePath } };
    config["context_servers"] = servers;
    writeJson(filePath, config);
    return { status: "ok" };
  } catch (e) {
    return { status: "error", message: String(e) };
  }
}

// ---------------------------------------------------------------------------
// Target definitions
// ---------------------------------------------------------------------------

const TARGETS: Target[] = [
  {
    id:    "claude",
    label: "Claude (Claude Code / Claude Desktop)",
    kind:  "cli",
    detect() { return inPath("claude"); },
    async install(moodlePath) {
      // #2: stdio:"pipe" avoids interleaving claude's output with our progress line.
      // -e passes MOODLE_PATH into the stored MCP server config.
      const r = spawnSync(
        "claude",
        ["mcp", "add", SERVER_NAME, "-e", `MOODLE_PATH=${moodlePath}`, "--", NPX_COMMAND, ...NPX_ARGS],
        { stdio: "pipe" }
      );
      if (r.status === 0) return { status: "ok" };
      const errText = r.stderr?.toString().trim() || `exited with code ${String(r.status)}`;
      return { status: "error", message: errText };
    },
  },
  {
    id:    "antigravity",
    label: "Antigravity CLI",
    kind:  "cli",
    detect() { return inPath("agy"); },
    install(moodlePath) {
      return installMcpServers(join(HOME, ".gemini", "antigravity", "mcp_config.json"), moodlePath);
    },
  },
  {
    id:    "codex",
    label: "OpenAI Codex CLI",
    kind:  "cli",
    detect() { return inPath("codex"); },
    install(moodlePath) {
      return installMcpServers(join(HOME, ".codex", "config.json"), moodlePath);
    },
  },
  {
    id:    "opencode",
    label: "OpenCode",
    kind:  "cli",
    detect() { return inPath("opencode"); },
    install(moodlePath) {
      return installOpenCode(join(HOME, ".config", "opencode", "config.json"), moodlePath);
    },
  },
  {
    id:    "windsurf",
    label: "Windsurf",
    kind:  "cli",
    detect() { return inPath("windsurf"); },
    install(moodlePath) {
      return installMcpServers(join(HOME, ".codeium", "windsurf", "mcp_config.json"), moodlePath);
    },
  },
  {
    id:    "cursor",
    label: "Cursor",
    kind:  "file",
    detect() { return existsSync(join(HOME, ".cursor")); },
    install(moodlePath) {
      return installMcpServers(join(HOME, ".cursor", "mcp.json"), moodlePath);
    },
  },
  {
    id:    "zed",
    label: "Zed",
    kind:  "file",
    detect() { return existsSync(join(HOME, ".config", "zed")); },
    install(moodlePath) {
      return installZed(join(HOME, ".config", "zed", "settings.json"), moodlePath);
    },
  },
  {
    id:    "cline",
    label: "Cline (VS Code extension)",
    kind:  "file",
    detect() { return existsSync(clineDir()); }, // #4: cross-platform path
    install(moodlePath) {
      return installMcpServers(join(clineDir(), "mcp_settings.json"), moodlePath);
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Checks whether a directory looks like a Moodle installation root. */
function isMoodleRoot(dirPath: string): boolean {
  return (
    existsSync(dirPath) &&
    existsSync(join(dirPath, "version.php")) &&
    existsSync(join(dirPath, "lib"))
  );
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

/**
 * Asks the user for the Moodle root path.
 * Only suggests cwd when it already looks like a Moodle installation.
 * Validates the entered path and re-asks until a valid one is provided.
 */
function promptMoodlePath(): Promise<string> {
  const cwdIsMoodle = isMoodleRoot(process.cwd());
  const suggested   = cwdIsMoodle ? process.cwd() : null;

  return new Promise((resolveFn) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });

    function askCustom(): void {
      rl.question("Moodle root path: ", (input) => {
        const candidate = resolve(input.trim() || process.cwd());
        if (!isMoodleRoot(candidate)) {
          process.stdout.write(`  ✖ ${candidate}\n`);
          process.stdout.write("    Not a valid Moodle installation (missing version.php or lib/).\n\n");
          askCustom();
          return;
        }
        rl.close();
        resolveFn(candidate);
      });
    }

    if (suggested) {
      process.stdout.write(`\nMOODLE_PATH: ${suggested}\n`);
      rl.question("Correct? [Y/n] ", (answer) => {
        if (answer.trim().toLowerCase() !== "n") {
          rl.close();
          resolveFn(suggested);
          return;
        }
        process.stdout.write("\n");
        askCustom();
      });
    } else {
      process.stdout.write("\nNo Moodle installation detected in the current directory.\n\n");
      askCustom();
    }
  });
}

function confirm(prompt: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`${prompt} [y/N] `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

// ---------------------------------------------------------------------------
// Install runner
// ---------------------------------------------------------------------------

async function installOne(target: Target, moodlePath: string): Promise<void> {
  process.stdout.write(`  ${target.label}... `);

  const result = await target.install(moodlePath);
  switch (result.status) {
    case "ok":
      process.stdout.write("ok\n");
      break;
    case "skipped":
      // #9: consistent "Skipped:" prefix (capital S, colon)
      process.stdout.write(`Skipped: ${result.reason}\n`);
      break;
    case "error":
      process.stdout.write(`error: ${result.message}\n`);
      break;
  }
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export async function runInstall(targetId?: string): Promise<void> {
  if (targetId) {
    const target = TARGETS.find((t) => t.id === targetId);
    if (!target) {
      // #5: error diagnostics go to stderr
      process.stderr.write(`Unknown target: ${targetId}\n`);
      process.stderr.write(`Supported targets: ${TARGETS.map((t) => t.id).join(", ")}\n`);
      process.exit(1);
    }

    if (!target.detect()) {
      const reason = target.kind === "cli"
        ? `${targetId} not found in PATH`
        : "config directory not found";
      // #9: consistent "Skipped:" prefix
      process.stdout.write(`Skipped: ${reason}\n`);
      return;
    }

    const moodlePath = await promptMoodlePath();
    process.stdout.write("\n");
    await installOne(target, moodlePath);
  } else {
    const available = TARGETS.filter((t) => t.detect());

    if (available.length === 0) {
      process.stdout.write("No supported tools detected on this system.\n");
      process.stdout.write(`Supported targets: ${TARGETS.map((t) => t.id).join(", ")}\n`);
      return;
    }

    process.stdout.write("\n");
    process.stdout.write("lumina-mdle-dev will be configured as an MCP server in the following tools:\n\n");
    for (const t of available) {
      process.stdout.write(`  • ${t.label}\n`);
    }

    const moodlePath = await promptMoodlePath();
    process.stdout.write("\n");

    const confirmed = await confirm("Proceed?");
    if (!confirmed) {
      process.stdout.write("Aborted.\n");
      process.exit(0);
    }

    process.stdout.write("\n");
    for (const t of available) {
      await installOne(t, moodlePath);
    }
  }

  process.stdout.write("\nDone.\n");
}
