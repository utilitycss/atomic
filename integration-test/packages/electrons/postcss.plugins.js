const utility = require("@utilitycss/utility").default;
const utilityConfig = require("./utility.config");

module.exports = (opts) => {
  return [utility(utilityConfig(opts))];
};
