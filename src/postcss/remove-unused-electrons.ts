// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require("debug")("atomic:remove-unused-electrons");

import { Rule, Root, Helpers, Plugin } from "postcss";
import path from "path";
import AtomsServer from "../server";

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

const DOT_RULE_RE = /\.([\w-_]*)/;
const PLUGIN_NAME = "utility-remove-unused-electrons";
const MODULE_CSS_JSON = "module.css.json";

function removeUnusedElectrons({
  server,
}: RemoveUnusedElectronsOptions): Plugin {
  return {
    postcssPlugin: PLUGIN_NAME,
    async OnceExit(css: Root, { result }: Helpers) {
      const { opts: { to: toPath = "" } = {} } = result;
      // last step creates modules.css and at that time the index.css.json is
      // already created
      const modulePath = path.join(path.dirname(toPath), MODULE_CSS_JSON);
      if (!toPath) return;
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
