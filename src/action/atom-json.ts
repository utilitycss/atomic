import postcss from "postcss";
import atomicCssModules from "../postcss/atomic-css-modules";
import removeUnusedElectrons from "../postcss/remove-unused-electrons";
import AtomsServer from "../server";
const removeEmptyRules = require("postcss-discard-empty");

const atomJSON = async ({
  from,
  to,
  source,
  server
}: {
  from: string;
  to: string;
  source: string;
  server: AtomsServer;
}) => {
  return await postcss([
    atomicCssModules({
      trackClasses: server.trackClasses,
      importedElectronRE: server.importedElectronRE,
      importedModuleRE: server.importedModuleRE,
      ICSSImportRE: server.ICSSImportRE,
      server
    }),
    removeEmptyRules(),
    removeUnusedElectrons({ server })
  ]).process(source, { from, to });
};

export default atomJSON;
