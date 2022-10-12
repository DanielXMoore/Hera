import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { pathToFileURL, fileURLToPath } from 'url';

//@ts-ignore Note: this is the compiled name
import { compile } from "@danielx/civet";

const baseURL = pathToFileURL(process.cwd() + '/').href;
const extensionsRegex = /\.civet$/;

export function resolve(specifier, context, next) {
  const { parentURL = baseURL } = context;

  if (extensionsRegex.test(specifier)) {
    return {
      shortCircuit: true,
      format: "civet",
      url: new URL(specifier, parentURL).href,
    };
  };

  // Let Node.js handle all other specifiers.
  return next(specifier, context);
};

export function load(url, context, next) {
  if (context.format === "civet") {
    const path = fileURLToPath(url);
    const source = readFileSync(path, "utf8");
    const tsSource = compile(source, {
      filename: path,
      inlineMap: true,
    });

    // NOTE: Assuming ts-node hook follows load hook
    // NOTE: This causes .civet files to show up as .ts in ts-node error reporting (TODO: May be able to add a sourcemapping)
    return next(url.replace(extensionsRegex, ".ts"), {
      // ts-node won't transpile unless this is module
      // can't use commonjs since we don't rewrite imports
      format: "module",
      // NOTE: Setting the source in the context makes it available when ts-node uses defaultLoad
      source: tsSource,
    });
  };

  // Let Node.js handle all other URLs.
  return next(url, context);
};


// commonjs hook
const require = createRequire(import.meta.url);
require.extensions[".civet"] = function(m, filename) {
  const source = readFileSync(filename, "utf8");
  const code = compile(source, {
    filename,
    js: true,
    inlineMap: true,
  });

  //@ts-ignore TODO: Figure out how to load types from inculde folders in Civet LSP
  m._compile(code, filename);
};
