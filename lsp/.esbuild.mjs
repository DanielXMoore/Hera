import { build } from 'esbuild';
import { copyFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const watch = process.argv.includes('--watch');
const minify = false // !watch || process.argv.includes('--minify');

build({
  entryPoints: ['src/extension.ts'],
  tsconfig: "./tsconfig.json",
  bundle: true,
  external: ['vscode'],
  format: "cjs",
  sourcemap: watch,
  minify,
  watch,
  platform: 'node',
  outfile: 'dist/extension.js',
}).catch(() => process.exit(1))

build({
  entryPoints: ['src/server.ts'],
  tsconfig: "./tsconfig.json",
  bundle: true,
  external: ['vscode'],
  sourcemap: watch,
  minify,
  watch,
  platform: 'node',
  outfile: 'dist/server.js',
}).catch(() => process.exit(1))

// Copy over hera machinery
// TODO: Fix this in hera build step

copyFile(__dirname + "/node_modules/@danielx/hera/dist/machine.ts", __dirname + "/dist/machine.ts")
copyFile(__dirname + "/node_modules/@danielx/hera/dist/machine.js", __dirname + "/dist/machine.js")
