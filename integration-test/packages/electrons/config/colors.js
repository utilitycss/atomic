const colors = {
  transparent: "transparent",
  black: "#111111",
  white: "#fafafa",
};

module.exports = {
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
};
