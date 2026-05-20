/**
 * @file utils/php-parser.ts
 * @description Shared helpers for parsing PHP array literals.
 *
 * All Moodle db/*.php files follow the same pattern:
 *   $varName = [ [...], [...], ... ];
 *
 * These utilities are used by the extractors for events, tasks,
 * hooks, and services to avoid duplicating the same parsing logic.
 */

// ---------------------------------------------------------------------------
// Array body extractor
// ---------------------------------------------------------------------------

/**
 * Extracts the body of a PHP array assignment: $varName = [ <body> ].
 * Works with both [] and array() syntax.
 * Returns null if the variable is not found or the array is malformed.
 */
export function extractArrayBody(content: string, varName: string): string | null {
  const startMatch = content.match(new RegExp(`\\$${varName}\\s*=\\s*`));
  if (!startMatch || startMatch.index === undefined) return null;

  let startIdx = -1;
  for (let i = startMatch.index + startMatch[0].length; i < content.length; i++) {
    if (content[i] === "[" || content[i] === "(") { startIdx = i; break; }
  }
  if (startIdx === -1) return null;

  const openChar  = content[startIdx];
  const closeChar = openChar === "[" ? "]" : ")";
  let depth = 0;
  let end   = -1;

  for (let i = startIdx; i < content.length; i++) {
    if (content[i] === openChar) depth++;
    else if (content[i] === closeChar) {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }

  return end !== -1 ? content.slice(startIdx + 1, end) : null;
}

// ---------------------------------------------------------------------------
// Block splitter
// ---------------------------------------------------------------------------

/**
 * Splits a PHP sequential array body into individual entry blocks.
 * Tracks bracket depth to correctly handle nested arrays.
 *
 * Input:  "[...], [...], [...]"
 * Output: ["[...]", "[...]", "[...]"]
 */
export function splitIntoBlocks(body: string): string[] {
  const blocks: string[] = [];
  let depth = 0;
  let start = -1;

  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "[" || ch === "(") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "]" || ch === ")") {
      depth--;
      if (depth === 0 && start !== -1) {
        blocks.push(body.slice(start, i + 1));
        start = -1;
      }
    }
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Per-block field extractors
// ---------------------------------------------------------------------------

/**
 * Extracts a quoted string value from a PHP array block.
 * Applies basic PHP single-quoted string unescaping: \\ → \ and \' → '
 * so the returned value matches the PHP runtime string (e.g. FQN class names).
 * Example: `'key' => '\\local_myplugin\\task\\my_task'` → "\local_myplugin\task\my_task"
 */
export function extractString(block: string, key: string): string {
  const match = block.match(
    new RegExp(`['"]${key}['"]\\s*=>\\s*['"]([^'"]+)['"]`)
  );
  if (!match) return "";
  return match[1].replace(/\\\\/g, "\\").replace(/\\'/g, "'");
}

/**
 * Extracts an integer value from a PHP array block.
 * Example: `'priority' => 100` → 100
 */
export function extractInt(block: string, key: string, defaultVal = 0): number {
  const match = block.match(
    new RegExp(`['"]${key}['"]\\s*=>\\s*(-?\\d+)`)
  );
  return match ? parseInt(match[1], 10) : defaultVal;
}

/**
 * Extracts a boolean value from a PHP array block.
 * Handles: true, false, 1, 0 (case-insensitive).
 * Example: `'ajax' => true` → true
 */
export function extractBool(block: string, key: string, defaultVal = false): boolean {
  const match = block.match(
    new RegExp(`['"]${key}['"]\\s*=>\\s*(true|false|1|0)`, "i")
  );
  if (!match) return defaultVal;
  return match[1] === "true" || match[1] === "1";
}
