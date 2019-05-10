const postcss = require('postcss');
const path = require('path');

const DOT_RULE_RE = /\.([\w-_]*)/;

const getModuleMap = module => {
  return Object.keys(module).reduce((prev, curr) => {
    prev[curr] = module[curr].split(/\s+/);
    return prev;
  }, {});
};

// Analyis the css-module export and remove unwanted selectors
module.exports = postcss.plugin(
  'remove-unused-electrons',
  ({ utilityConfig, server }) => async (css, results) => {
    const { opts: { to: toPath = '', from: fromPath } = {} } = results;

    // last step creates modules.css and at that time the index.css.json is
    // already created
    const modulePath = path.join(path.dirname(toPath), 'module.css.json');
    if (!toPath) return css;
    const module = await server.readFile(modulePath);
    const moduleMap = getModuleMap(module);
    // Exit if there is no css created-
    if (moduleMap !== undefined) {
      let usedRules = new Set();
      Object.keys(moduleMap).forEach(name => {
        moduleMap[name].forEach(r => usedRules.add(r));
      });
      css.walkRules(rule => {
        const { selector } = rule;
        const matches = rule.selector.match(DOT_RULE_RE);
        if (matches !== null && !usedRules.has(matches[1])) {
          rule.remove();
        }
      });
    }
  },
);
