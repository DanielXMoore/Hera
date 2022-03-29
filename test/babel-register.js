// Register .ts and .js as babel extensions
// Ideally this could be done in babel.config.json but I haven't found a way
require('@babel/register').default({
  extensions: ['.ts', '.js']
})

// HACK: Force babel to install its source-map-support handler so we can remove
// it when we add our coffeecoverage handler
require("./dummy.js")
