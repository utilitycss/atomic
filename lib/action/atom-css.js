const postcss = require('postcss');
const utility = require('@utilitycss/utility');
const composeElectrons = require('../postcss/compose-electrons');

async function atomCss({
  from,
  to,
  source,
  utilityConfig,
  electronsModuleName = '@dx/electrons',
}) {
  return await postcss([
    utility(utilityConfig),
    require('postcss-for'),
    require('postcss-simple-vars'),
    require('postcss-nested')({ preserveEmpty: true }),
    composeElectrons({ module: electronsModuleName }),
  ]).process(source, {
    from,
    to,
  });
}

module.exports = atomCss;
