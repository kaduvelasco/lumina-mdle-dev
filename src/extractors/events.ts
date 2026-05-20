/**
 * @file extractors/events.ts
 * @description Parses Moodle db/events.php files to extract event subscriptions.
 *
 * Extracts event observer definitions by parsing each array entry as a
 * self-contained block, avoiding the index-misalignment bug that occurs
 * when optional fields (priority, internal) are absent from some entries.
 *
 * Strategy:
 *   1. Isolate the $observers array body
 *   2. Split it into individual entry blocks using bracket depth tracking
 *   3. Extract all fields from each block independently
 *
 * Reference: https://docs.moodle.org/dev/Event_2
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  extractArrayBody,
  splitIntoBlocks,
  extractString,
  extractInt,
  extractBool,
} from "../utils/php-parser.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EventObserver {
  /** Fully-qualified event class name, e.g. \core\event\course_viewed */
  eventname: string;
  /** Callback class::method or function name */
  callback:  string;
  /** Observer priority (higher runs first). Default 0. */
  priority:  number;
  /** Whether to run before the transaction is committed */
  internal:  boolean;
}

export interface EventsExtraction {
  /** Source file path */
  file:      string;
  observers: EventObserver[];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parses a db/events.php file and returns all event observer definitions.
 * Each entry is parsed independently — missing optional fields default
 * to safe values without affecting other entries.
 *
 * @param filePath - Absolute path to the events.php file
 */
export function parseEventsPhp(filePath: string): EventsExtraction | null {
  if (!existsSync(filePath)) return null;

  const content = readFileSync(filePath, "utf-8");
  const body    = extractArrayBody(content, "observers");

  if (body === null) return { file: filePath, observers: [] };

  const blocks    = splitIntoBlocks(body);
  const observers: EventObserver[] = [];

  for (const block of blocks) {
    const eventname = extractString(block, "eventname");
    const callback  = extractString(block, "callback");

    if (!eventname && !callback) continue;

    observers.push({
      eventname,
      callback,
      priority: extractInt(block,  "priority", 0),
      internal: extractBool(block, "internal", false),
    });
  }

  return { file: filePath, observers };
}

/**
 * Extracts event observers from a plugin directory.
 */
export function extractPluginEvents(pluginPath: string): EventsExtraction | null {
  return parseEventsPhp(join(pluginPath, "db", "events.php"));
}

/**
 * Returns only the event class names (deduplicated, sorted).
 */
export function getEventNames(extraction: EventsExtraction): string[] {
  return [...new Set(extraction.observers.map((o) => o.eventname))].sort();
}
