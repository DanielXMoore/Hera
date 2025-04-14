// A smoke test to make sure the built esbuild plugin works and is exported correctly.
// This script requires the project to be built (i.e. `yarn build`).

// Import the built plugin
const heraPlugin = require("@danielx/hera/esbuild-plugin");

const { join, resolve } = require("node:path");
const fs = require("node:fs");
const esbuild = require("esbuild");

const tmpDir = resolve(__dirname, "../tmp/esbuild-plugin-testing");

fs.rmSync(tmpDir, { recursive: true, force: true });

esbuild
  .build({
    entryPoints: ["test.js"],
    absWorkingDir: __dirname,
    bundle: true,
    format: "cjs",
    platform: "node",
    outdir: tmpDir,
    plugins: [heraPlugin({ loader: "ts" })],
  })
  .then(() => {
    const testModulePath = join(tmpDir, "test.js");
    const { test } = require(testModulePath);
    test();
    console.log("ok");
  });
