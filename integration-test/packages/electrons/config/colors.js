const colors = {
  transparent: "transparent",
  black: "#1a1a1a",
  white: "#fafafa",
};

const invertedColors = {
  black: "#fafafa",
  white: "#1a1a1a",
};

const commonColorConfig = values => ({
  names: {
    c: "",
    bgc: "bg",
    bdc: "bd",
  },
  whitelist: ["c", "bgc", "bdc"],
  colorValues: values,
  backgroundColorValues: values,
  borderColorValues: values,
  isResponsive: true,
})

module.exports.colors = {
  ...commonColorConfig(colors),
	pseudoClasses: {
    bgc: [":active"],
    bdc: [":focus"],
  },
	nestedRules: {
    "@media (hover: hover) and (pointer: fine)": {
			...commonColorConfig(colors),
			pseudoClasses: {
    		c: [":hover"],
    		bgc: [":hover"],
    		bdc: [":hover"],
  		},
			modifiersOnly: true
		}
	}
};

module.exports.invertedColors = {
  ...commonColorConfig(invertedColors),
	pseudoClasses: {
    bgc: [":active"],
    bdc: [":focus"],
  },
	nestedRules: {
    "@media (hover: hover) and (pointer: fine)": {
			...commonColorConfig(invertedColors),
			pseudoClasses: {
    		c: [":hover"],
    		bgc: [":hover"],
    		bdc: [":hover"],
  		},
			modifiersOnly: true
		}
	}
};
