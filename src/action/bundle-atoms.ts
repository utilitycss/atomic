import postcss, { LazyResult } from "postcss";

import cssMqPacker from "@utilitycss/css-mqpacker";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const cssPresetEnv = require("postcss-preset-env");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cssnano = require("cssnano");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cssVariables = require("postcss-css-variables");

const bundleAtoms = async ({
  source,
  from,
  to,
  minify = false,
}: {
  source: string;
  from?: string;
  to: string;
  minify?: boolean;
}): Promise<LazyResult> => {
  const plugins = [
    cssMqPacker({ sort: true }),
    cssPresetEnv({
      browsers: ["> 1%", "IE 11"],
      features: {
        "custom-properties": false,
      },
    }),
    cssVariables(),
  ];

  if (minify) {
    plugins.push(
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
      })
    );
  }

  return await postcss(plugins).process(source, { from, to });
};

export default bundleAtoms;
