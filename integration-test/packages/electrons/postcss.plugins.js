const { utility } = require("@utilitycss/atomic").utility;
const utilityConfig = require("./utility.config");

module.exports = (opts) => {
  return [utility(utilityConfig(opts))];
};
