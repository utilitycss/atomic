const path = require("path");
const {
  modules: { colors, font },
} = require("@utilitycss/utility");
const {
  base,
  breakpoints: breakPointsValues,
  colors: colorsConfig,
  font: fontConfig,
} = require("./config");

const modules = [colors(colorsConfig), font(fontConfig)];

const getConfig = () => {
  const config = Object.assign({}, base, {
    breakPoints: breakPointsValues,
  });

  const utilityConfigs = Object.assign({}, { config, modules });
  return utilityConfigs;
};

module.exports = getConfig;
