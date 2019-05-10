const postcss = require('postcss');
const removeEmptyRules = require('postcss-discard-empty');
const atomicCssModules = require('../postcss/atomic-css-modules');
const removeUnusedElectrons = require('../postcss/remove-unused-electrons');

async function atomJSON({
  from,
  to,
  source,
  utilityConfig,
  trackClasses,
  server,
}) {
  return await postcss([
    atomicCssModules({
      trackClasses,
      importedElectronRE: server.importedElectronRE,
      importedModuleRE: server.importedModuleRE,
      ICSSImportRE: server.ICSSImportRE,
      server,
    }),
    removeEmptyRules(),
    removeUnusedElectrons({ utilityConfig, server }),
    // removeUnused(utilityConfig),
    // pseudoHack(),
  ]).process(source, { from, to });
}

module.exports = atomJSON;
