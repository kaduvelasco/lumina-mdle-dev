/**
 * Minimal type declarations for archiver v8 (ESM, named exports).
 *
 * archiver v8 removed the default export and the `archiver(format, options)` factory.
 * Only the API surface used by this project is declared here.
 *
 * @see https://github.com/archiverjs/node-archiver
 */

declare module "archiver" {
  import { Writable } from "stream";

  interface ZipOptions {
    zlib?: { level?: number };
  }

  interface EntryData {
    /** Sets the entry name including internal path. */
    name: string;
  }

  class ZipArchive extends Writable {
    constructor(options?: ZipOptions);

    /** Appends a file from the filesystem at filePath. */
    file(filepath: string, data: EntryData): this;

    /** Pipes the archive stream to a destination writable. */
    pipe<T extends NodeJS.WritableStream>(destination: T): T;

    /** Finalizes the archive and emits all pending entries. */
    finalize(): void;

    on(event: "error",  listener: (err: Error)        => void): this;
    on(event: "close",  listener: ()                   => void): this;
    on(event: string | symbol, listener: (...args: unknown[]) => void): this;
  }

  export { ZipArchive };
}
