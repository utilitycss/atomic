import { Rule, Root, Helpers } from "postcss";
import path from "path";
import AtomsServer from "../server";

const DOT_RULE_RE = /\.([\w-_]*)/;

interface Module {
  [key: string]: string;
}

interface ModuleMap {
  [key: string]: string[];
}

const getModuleMap = (module: Module): ModuleMap => {
  return Object.keys(module).reduce((prev, curr) => {
    prev[curr] = module[curr].split(/\s+/);
    return prev;
  }, {} as ModuleMap);
};

interface RemoveUnusedElectronsOptions {
  server: AtomsServer;
}

function removeUnusedElectrons({ server }: RemoveUnusedElectronsOptions) {
  return {
    postcssPlugin: "remove-unused-electrons",
    async Once(css: Root, { result }: Helpers) {
      const { opts: { to: toPath = "" } = {} } = result;
      // last step creates modules.css and at that time the index.css.json is
      // already created
      const modulePath = path.join(path.dirname(toPath), "module.css.json");
      if (!toPath) return css;
      const module = <{ [key: string]: any }>await server.readFile(modulePath);
      const moduleMap = getModuleMap(module);
      // Exit if there is no css created-
      if (moduleMap !== undefined) {
        const usedRules = new Set();
        Object.keys(moduleMap).forEach((name) => {
          moduleMap[name].forEach((r) => usedRules.add(r));
        });
        css.walkRules((rule: Rule) => {
          const matches = rule.selector.match(DOT_RULE_RE);
          if (matches !== null && !usedRules.has(matches[1])) {
            rule.remove();
          }
        });
      }
    },
  };
}

export default removeUnusedElectrons;

export const postcss = true;
