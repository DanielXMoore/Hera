import * as esbuild from 'esbuild';
import { copyFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const watch = process.argv.includes('--watch');
const minify = false; // !watch || process.argv.includes('--minify');

const options = {
  entryPoints: {
    extension: 'src/extension.ts',
    server: 'src/server.ts',
  },
  outdir: 'dist',
  tsconfig: './tsconfig.json',
  bundle: true,
  external: ['vscode'],
  format: 'cjs',
  sourcemap: watch,
  minify,
  platform: 'node',
};

async function copyMachine() {
  await copyFile(
    __dirname + '/node_modules/@danielx/hera/dist/machine.ts',
    __dirname + '/dist/machine.ts'
  );
  await copyFile(
    __dirname + '/node_modules/@danielx/hera/dist/machine.js',
    __dirname + '/dist/machine.js'
  );
}

async function main() {
  if (watch) {
    const ctx = await esbuild.context(options);
    await ctx.rebuild();
    await copyMachine();
    await ctx.watch();
  } else {
    await esbuild.build(options);
    await copyMachine();
  }
}

main().catch(() => process.exit(1));
