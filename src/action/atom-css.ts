import postcss from "postcss";
import { LazyResult } from "postcss";

import utility from "@utilitycss/utility";
import postcssFor from "@utilitycss/postcss-for";
import { PluginConfig } from "@utilitycss/utility/dist/types";

import composeElectrons from "../postcss/compose-electrons";

const atomCss = async ({
  from,
  to,
  source,
  utilityConfig,
  electronsModuleName,
}: {
  from: string;
  to: string;
  source: string;
  utilityConfig: PluginConfig;
  electronsModuleName: string;
}): Promise<LazyResult> => {
  return await postcss([
    utility(utilityConfig),
    composeElectrons({ module: electronsModuleName }),
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    postcssFor(),
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("postcss-nested")({ preserveEmpty: true }),
  ]).process(source, {
    from,
    to,
  });
};

export default atomCss;
