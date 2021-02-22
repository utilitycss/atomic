import postcss from "postcss";
import { LazyResult } from "postcss";

import utility from "@utilitycss/utility";
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
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("postcss-for"),
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("postcss-simple-vars"),
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("postcss-nested")({ preserveEmpty: true }),
    composeElectrons({ module: electronsModuleName }),
  ]).process(source, {
    from,
    to,
  });
};

export default atomCss;
