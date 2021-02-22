import postcss, { LazyResult } from "postcss";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const rmDuplicates = require("postcss-discard-duplicates");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cssNext = require("postcss-cssnext");
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
    cssNext({ browsers: ["> 1%", "IE 11"], cascade: false }),
    rmDuplicates(),
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("css-mqpacker")({ sort: true }),
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
