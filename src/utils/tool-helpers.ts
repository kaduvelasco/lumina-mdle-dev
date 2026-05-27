/**
 * @file utils/tool-helpers.ts
 * @description Shared helpers for MCP tool handlers.
 *
 * Centralises repetitive patterns used across multiple tool files
 * to ensure consistent error messages and reduce duplication.
 */

// ---------------------------------------------------------------------------
// Standard error responses
// ---------------------------------------------------------------------------

/**
 * Standard error response returned when the MCP server has not been
 * initialised (no config found). Used by every tool that requires
 * init_moodle_context to have run first.
 */
export const NOT_INITIALIZED = {
  content: [
    {
      type: "text" as const,
      text: "❌ moodle-mcp is not initialized. Run `init_moodle_context` first.",
    },
  ],
  isError: true,
};
