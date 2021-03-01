import postcss, { LazyResult } from "postcss";

import cssMqPacker from "@utilitycss/css-mqpacker";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const rmDuplicates = require("postcss-discard-duplicates");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cssPresetEnv = require("postcss-preset-env");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cssnano = require("cssnano");

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
    cssPresetEnv({
      browsers: ["> 1%", "IE 11"],
      autoprefixer: { cascade: false },
    }),
    rmDuplicates(),
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cssMqPacker({ sort: true }),
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("postcss-combine-duplicated-selectors")({
      removeDuplicatedProperties: true,
    }),
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
