const cssPresetEnv = require("postcss-preset-env");
const cssVariables = require("postcss-css-variables");
const postcssFor = require("@utilitycss/postcss-for").default;
const nested = require("postcss-nested");

module.exports = {
  packageScope: "@my-org",
  electronsFolder: "electrons",
  electronsModuleName: "@my-org/electrons",
  atomsFolder: "atoms",
  utilityConfigPath: "packages/atoms/utility.config.js",
  bundleCSSPath: "packages/atoms/all/",
  bundleCSSName: "atom",
  additionalPlugins: {
    afterEachAtom:[
      postcssFor(),
      nested({ preserveEmpty: true }),
    ],
    beforeBundling: [
      cssPresetEnv({
        stage: 1,
        browsers: ["> 1%", "IE 11"],
        features: {
          "custom-properties": false,
        },
      }),
      cssVariables(),
    ]
  }
};
