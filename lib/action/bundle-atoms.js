const postcss = require('postcss');
const rmDuplicates = require('postcss-discard-duplicates');
const cssNext = require('postcss-cssnext');
const cssnano = require('cssnano');

async function bundleAtoms({ source, from, to, minify = false }) {
  let plugins = [
    cssNext({ browsers: ['> 1%', 'IE 11'], cascade: false }),
    rmDuplicates(),
    require('css-mqpacker')({ sort: true }),
    require('postcss-combine-duplicated-selectors')({
      removeDuplicatedProperties: true,
    }),
  ];

  if (minify) {
    plugins.push(
      cssnano({
        preset: [
          'advanced',
          {
            reduceIdents: false,
            zindex: false,
            discardComments: {
              removeAll: true,
            },
          },
        ],
      }),
    );
  }

  return await postcss(plugins).process(source, { from, to });
}

module.exports = bundleAtoms;
