// Injected by esbuild when bundling main.civet to CJS: every
// `import.meta.url` reference in the source is rewritten to
// `import_meta_url` (via `define`), and esbuild pulls in this file's
// export (via `inject`) so the bundle has a real file URL to feed
// into createRequire / fileURLToPath. See build/esbuild.civet.
export var import_meta_url = require("url").pathToFileURL(__filename).href;
