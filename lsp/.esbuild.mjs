import { build } from 'esbuild';

const watch = process.argv.includes('--watch');
const minify = !watch || process.argv.includes('--minify');

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
