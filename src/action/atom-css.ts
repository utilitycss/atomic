import postcss from "postcss";
import { LazyResult } from "postcss";

import utility from "@utilitycss/utility";
import { PluginConfig } from "@utilitycss/utility/dist/types";

import composeElectrons from "../postcss/compose-electrons";
import { PluginHooksMap } from "../server";

const atomCss = async ({
  from,
  to,
  source,
  utilityConfig,
  electronsModuleName,
  additionalPlugins,
}: {
  from: string;
  to: string;
  source: string;
  utilityConfig: PluginConfig;
  electronsModuleName: string;
  additionalPlugins: PluginHooksMap;
}): Promise<LazyResult> => {
  return await postcss([
    ...(additionalPlugins.beforeEachAtom || []),
    utility(utilityConfig),
    composeElectrons({ module: electronsModuleName }),
    ...(additionalPlugins.afterEachAtom || []),
  ]).process(source, {
    from,
    to,
  });
};

export default atomCss;
