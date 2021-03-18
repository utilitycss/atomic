// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require("debug")("atomic:atomic-css-modules");

import path from "path";
import postcssFn, { Root, Helpers, Plugin, Rule } from "postcss";

import generateScopedNameFn from "./generateScopedName";
import generateAtomTypings from "../../action/generate-atom-typings";
import generateAtomCJS from "../../action/generate-atom-cjs";
import generateAtomESM from "../../action/generate-atom-esm";
import AtomsServer from "../../server";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cssModules = require("postcss-modules");

const PLUGIN_NAME = "utility-atomic-css-modules";
const CLASS_RE = /\.([\w-]+)/g;
const INDEX_TYPE_FILE = "index.d.ts";
const INDEX_CJS_FILE = "index.js";
const INDEX_ESM_FILE = "index.esm.js";

interface AtomicCssModulesOptions {
  trackClasses: Map<string, string>;
  importedElectronRE: RegExp;
  importedModuleRE: RegExp;
  ICSSImportRE: RegExp;
  server: AtomsServer;
}
type GetJSON = (cssFileName: string, json: { [key: string]: string }) => void;

const isEmptyRule = (r: Rule) =>
  r.nodes.filter((el) => el.type !== "comment").length === 0;

function atomicCssModules(opts: AtomicCssModulesOptions): Plugin {
  const { server } = opts;
  return {
    postcssPlugin: PLUGIN_NAME,
    async Once(css: Root, { result }: Helpers) {
      const { opts: { to, from } = { to: "" } } = result;
      // only apply the plugin when a target is specified (avoid infinite loop)
      if (!to) return;
      // we need to clone the root in order to use it to get the original non hashed
      // css as the css root node is mutable and when generateScopedName runs it
      // would have hashed values instead
      const { nodes } = css.clone();
      const inputFile = css.source.input.file;
      debug(`Input file => ${inputFile} asd`);
      const root = postcssFn.root().append(nodes);
      const generateScopedName = generateScopedNameFn({
        ...opts,
        root,
      });

      const getJSON: GetJSON = async (cssFileName, json) => {
        const jsonFilePath = cssFileName + ".json";

        // Create a Set of all the non empty css classes
        const resultClassesSet = new Set();
        css.walkRules((r) => {
          const matches = r.selector.match(CLASS_RE);
          if (matches && !isEmptyRule(r)) {
            matches.forEach((m) => resultClassesSet.add(m.slice(1)));
          }
        });

        // Strip empty classes from json mapping
        const filteredJSON = Object.keys(json).reduce((prev, next) => {
          prev[next] = json[next]
            .split(" ")
            .filter((c) => resultClassesSet.has(c))
            .join(" ");
          return prev;
        }, {} as { [key: string]: string });

        await server.writeFile(jsonFilePath, JSON.stringify(filteredJSON));

        const cjsFilePath = path.join(
          path.dirname(cssFileName),
          INDEX_CJS_FILE
        );
        const esmFilePath = path.join(
          path.dirname(cssFileName),
          INDEX_ESM_FILE
        );
        const typingsFilePath = path.join(
          path.dirname(cssFileName),
          INDEX_TYPE_FILE
        );

        await generateAtomCJS(cjsFilePath, filteredJSON, { server });
        await generateAtomESM(esmFilePath, filteredJSON, { server });
        await generateAtomTypings(typingsFilePath, filteredJSON, { server });
      };

      await postcssFn([
        cssModules({ generateScopedName, getJSON, exportGlobals: true }),
      ]).process(css, {
        from,
      });
    },
  };
}

export default atomicCssModules;

export const postcss = true;
