const utility = require("@utilitycss/utility");
const utilityConfig = require("./utility.config");

module.exports = (opts) => {
  return [utility(utilityConfig(opts))];
};
