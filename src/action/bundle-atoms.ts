import postcss, { LazyResult } from "postcss";

import cssMqPacker from "@utilitycss/css-mqpacker";
import { PluginHooksMap } from "../server";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const cssnano = require("cssnano");

const bundleAtoms = async ({
  source,
  from,
  to,
  minify = false,
  additionalPlugins,
}: {
  source: string;
  from?: string;
  to: string;
  minify?: boolean;
  additionalPlugins: PluginHooksMap;
}): Promise<LazyResult> => {
  const plugins = [
    ...(additionalPlugins.beforeBundling || []),
    cssMqPacker({ sort: true }),
    ...(additionalPlugins.afterBundling || []),
  ];

  if (minify) {
    plugins.push(
      ...[
        ...(additionalPlugins.beforeMinify || []),
        cssnano({
          preset: [
            "advanced",
            {
              reduceIdents: false,
              zindex: false,
              discardComments: {
                removeAll: true,
              },
            },
          ],
        }),
        ...(additionalPlugins.afterMinify || []),
      ]
    );
  }

  return await postcss(plugins).process(source, { from, to });
};

export default bundleAtoms;
