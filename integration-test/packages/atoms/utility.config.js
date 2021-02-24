const {
  base,
  breakpoints: breakPointsValues,
} = require("@my-org/electrons/config");

module.exports = {
  config: Object.assign({}, base, {
    breakPoints: breakPointsValues,
  }),
};
