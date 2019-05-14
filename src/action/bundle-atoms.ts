import postcss from "postcss";
const rmDuplicates = require("postcss-discard-duplicates");
const cssNext = require("postcss-cssnext");
const cssnano = require("cssnano");

const bundleAtoms = async ({
  source,
  from,
  to,
  minify = false
}: {
  source: string;
  from?: string;
  to: string;
  minify?: boolean;
}) => {
  const plugins = [
    cssNext({ browsers: ["> 1%", "IE 11"], cascade: false }),
    rmDuplicates(),
    require("css-mqpacker")({ sort: true }),
    require("postcss-combine-duplicated-selectors")({
      removeDuplicatedProperties: true
    })
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
              removeAll: true
            }
          }
        ]
      })
    );
  }

  return await postcss(plugins).process(source, { from, to });
};

export default bundleAtoms;
