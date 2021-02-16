import postcss from "postcss";
import composeElectrons from "../postcss/compose-electrons";
import utility from "@utilitycss/utility";
import { PluginConfig } from "@utilitycss/utility/dist/types";

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
}) => {
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
