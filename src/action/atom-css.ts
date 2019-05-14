import postcss from "postcss";
import composeElectrons from "../postcss/compose-electrons";
const utility = require("@utilitycss/utility");

const atomCss = async ({
  from,
  to,
  source,
  utilityConfig,
  electronsModuleName
}: {
  from: string;
  to: string;
  source: string;
  utilityConfig: { [key: string]: any };
  electronsModuleName: string;
}) => {
  return await postcss([
    utility(utilityConfig),
    require("postcss-for"),
    require("postcss-simple-vars"),
    require("postcss-nested")({ preserveEmpty: true }),
    composeElectrons({ module: electronsModuleName })
  ]).process(source, {
    from,
    to
  });
};

export default atomCss;
