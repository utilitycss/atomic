module.exports = {
  names: {
    fz: "fontSize",
    "fw:b": "fontWeightBold",
    ff: "fontFamily",
    "fw:n": "fontWeightNormal",
  },
  fontFamilyValues: {
    system:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Arial', 'Helvetica Neue', sans-serif",
  },
  whitelist: ["fw:b", "fz", "ff", "fw:n"],
  pseudoClasses: {
    "fw:b": [":hover"],
  },
  fontSizeValues: {
    xs: "11px",
    s: "16px",
    m: "24px",
    l: "36px",
    xl: "54px",
  },
};
