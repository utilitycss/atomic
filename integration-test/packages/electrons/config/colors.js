const colors = {
  transparent: "transparent",
  black: "#1a1a1a",
  white: "#fafafa",
};

const invertedColors = {
  black: "#fafafa",
  white: "#1a1a1a",
};

module.exports.colors = {
  names: {
    c: "",
    bgc: "bg",
    bdc: "bd",
  },
  whitelist: ["c", "bgc", "bdc"],
  pseudoClasses: {
    c: [":hover"],
    bgc: [":hover", ":active"],
    bdc: [":hover", ":focus"],
  },
  colorValues: colors,
  backgroundColorValues: colors,
  borderColorValues: colors,
  isResponsive: true
};

module.exports.invertedColors = {
  names: {
    c: "",
    bgc: "bg",
    bdc: "bd",
  },
  whitelist: ["c", "bgc", "bdc"],
  pseudoClasses: {
    c: [":hover"],
    bgc: [":hover", ":active"],
    bdc: [":hover", ":focus"],
  },
  colorValues: invertedColors,
  backgroundColorValues: invertedColors,
  borderColorValues: invertedColors,
  isResponsive: true,
};
