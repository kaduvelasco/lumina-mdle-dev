#!/usr/bin/env node

// CLI entry point for the lumina-md binary.
// Handles user-facing commands (install, ...).

import { runInstall } from "./cli/install.js";

// #10: declared before first use — no reliance on hoisting
function printHelp(): void {
  process.stdout.write([
    "lumina-md — Lumina Moodle Developer CLI",
    "",
    "Usage:",
    "  lumina-md <command> [options]",
    "",
    "Commands:",
    "  install [target]    Configure lumina-mdle-dev as an MCP server in your AI tools",
    "",
    "Targets (CLI-based — requires tool binary in PATH):",
    "  claude, antigravity, codex, opencode, windsurf",
    "",
    "Targets (file-based — requires tool config directory to exist):",
    "  cursor, zed, cline",
    "",
    "  Omit target to install in all detected tools (asks for confirmation first).",
    "",
    "Examples:",
    "  lumina-md install            # Detect and install in all available tools",
    "  lumina-md install claude     # Install only in Claude",
    "  lumina-md install cursor     # Install only in Cursor",
    "",
  ].join("\n"));
}

const [,, command, ...rest] = process.argv;

if (!command || command === "--help" || command === "-h") {
  printHelp();
  process.exit(0);
}

switch (command) {
  case "install":
    runInstall(rest[0]).catch((err: unknown) => {
      process.stderr.write(`Error: ${String(err)}\n`);
      process.exit(1);
    });
    break;

  default:
    process.stderr.write(`Unknown command: ${command}\n\n`);
    printHelp();
    process.exit(1);
}
