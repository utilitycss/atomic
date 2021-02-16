import path from "path";
import crypto from "crypto";
import postcssFn, { Rule, Root, Helpers, Declaration } from "postcss";
import generateAtomTypings from "../action/generate-atom-typings";
import AtomsServer from "../server";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cssModules = require("postcss-modules");

const HASH_LENGTH = 6;
const DEVELOPMENT = process.env.NODE_ENV === "development";

function hashFunction(string: string, length: number): string {
  // get numerical value of murmur hash for the string
  return (
    crypto
      .createHash("sha1")
      .update(string)
      .digest("base64")
      // cut to maximum length characters
      .substr(0, length)
      // make base64 class safe
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      // add underscore in front of hash if first char is positive or negative number
      .replace(/^(-?\d)/, "_$1")
  );
}

const CLASS_RE = /\.([\w-]+)/g;

const generateHashableContent = (rule: Rule): string =>
  rule.nodes
    .filter((d: Declaration) => d.prop !== "composes")
    .map((node: Declaration) => node.type + node.prop + node.value)
    .join(";");

const getElectronDefinition = (server: AtomsServer, name: any): string => {
  const definitionsMap = new Map();

  let definition = "";
  server.electronsRoot.walkRules(new RegExp(`\.${name}`), (rule) => {
    definition = generateHashableContent(rule);
    if (definitionsMap.has(name) && definitionsMap.get(name).count >= 1) {
      definition = definitionsMap.get(name).definition + definition;
      definitionsMap.set(name, {
        definition,
        count: definitionsMap.get(name).count + 1,
      });
    } else {
      definitionsMap.set(name, { definition, count: 1 });
    }
  });

  if (definition === "") {
    console.error(`definition is empty for electron ${name}`);
  }

  return definition;
};

interface AtomicCssModulesOptions {
  trackClasses: Map<string, string>;
  importedElectronRE: RegExp;
  importedModuleRE: RegExp;
  ICSSImportRE: RegExp;
  server: AtomsServer;
}

type GenerateScopedName = (
  name: string,
  filename: string,
  content: string
) => string;
type GetJSON = (cssFileName: string, json: { [key: string]: string }) => void;

function atomicCssModules(opts: AtomicCssModulesOptions) {
  return {
    postcssPlugin: "atomic-css-modules",
    Once(css: Root, { result }: Helpers) {
      const { opts: { to } = { to: "" } } = result;
      // only apply the plugin when a target is specified (avoid infinite loop)
      if (!to) return;
      // we need to clone the root in order to use it to get the original non hashed
      // css as the css root node is mutable and when generateScopedName runs it
      // would have hashed values instead
      const { nodes } = css.clone();
      const root = postcssFn.root().append(nodes);

      const {
        trackClasses,
        importedElectronRE,
        importedModuleRE,
        ICSSImportRE,
        server,
      } = opts;

      const generateScopedName: GenerateScopedName = function (
        name,
        filename,
        content
      ) {
        let definition = content;
        let hash: string;
        let pkgName = "";
        const definitionsMap = new Map();
        const isElectron = importedElectronRE.test(filename);
        root.walkRules(new RegExp(`(\.${name}|:import)`), (rule): any => {
          // ensure that a rule that appear multiple times has the same hash
          // e.g. inside media queries or when ICSS imported in a different atom.
          // in the context of ICSS import and composes the filename will point
          // to the imported module as relative imports are forbidden in atoms
          // we can safely check for @scope/something patterns to get the correct
          // package name
          if (isElectron) {
            // check for @scope/electrons pattern in the filename
            pkgName = filename.match(importedElectronRE)[1];
            const key = `${pkgName};${name}`;

            if (trackClasses.has(key)) {
              hash = trackClasses.get(key);
            } else {
              // use electron hashes for proxied atoms
              const pkg = filename.match(importedElectronRE)[1];
              definition = getElectronDefinition(server, name);
              hash = hashFunction(`${name}_${definition}`, HASH_LENGTH);
              const key = `${pkg};${name}`;
              trackClasses.set(key, hash);
            }

            // short circuit: electron definition for a given name is always
            // highest priority and unique source of truth.
            return DEVELOPMENT ? `${name.toUpperCase()}_${hash}` : hash;
          } else if (importedModuleRE.test(filename)) {
            // check for @scope/xxx pattern in the filename
            const importedPackage = filename.match(importedModuleRE)[1];
            const pkg = <{ [key: string]: any }>(
              server.readFileSync(`pkg:${importedPackage}`)
            );
            if (pkg.proxy) {
              pkgName = pkg.proxy;
            } else {
              pkgName = importedPackage;
            }
          } else if (/:import/.test(rule.selector)) {
            // check for @scope/xxx pattern in the ICSS selector
            const importedPackage = rule.selector.match(ICSSImportRE)[1];
            const pkg = <{ [key: string]: any }>(
              server.readFileSync(`pkg:${importedPackage}`)
            );
            if (pkg.proxy) {
              // check if it is a proxy atom (passthrough for utility electrons)
              // in that case we can use the same hash of the respective electron
              // and avoid a duplicate for each defined rule
              pkgName = pkg.proxy;
            } else {
              pkgName = importedPackage;
            }
          } else {
            // base case: use the package name from package.json
            const pkg = <{ [key: string]: any }>(
              server.readFileSync(
                path.join(path.dirname(filename), "package.json")
              )
            );
            if (pkg.proxy) {
              definition = <string>(
                server.readFileSync(require.resolve(pkg.proxy))
              );
              pkgName = pkg.proxy;
            } else {
              pkgName = pkg.name;
            }
          }

          const key = `${pkgName};${name}`;
          // if the hash was generated on a different source file we should use it

          if (trackClasses.has(key)) {
            hash = trackClasses.get(key);
          } else {
            definition = generateHashableContent(rule);
            // if in the scope of the current file we have multiple definitions
            // for the current rule, we concatenate the definitions to generate
            // a global hash that will be updated whenever any of the multiple
            // definitions get updated
            if (
              definitionsMap.has(name) &&
              definitionsMap.get(name).count >= 1
            ) {
              definition = definitionsMap.get(name).definition + definition;
              definitionsMap.set(name, {
                definition,
                count: definitionsMap.get(name).count + 1,
                key,
                pkgName,
              });
            } else {
              definitionsMap.set(name, { definition, count: 1, key, pkgName });
            }
          }
        });

        if (definitionsMap.has(name)) {
          const { key } = definitionsMap.get(name);
          hash = hashFunction(`${name}_${definition}`, HASH_LENGTH);
          trackClasses.set(key, hash);
        }

        // if the hash is empty we fallback to content based hash
        // (e.g. utility generated atoms)
        if (!hash) {
          if (isElectron) {
            pkgName = server.electronsModuleName;
          }

          if (pkgName === "") {
            console.error(`unable to find package name for ${name}`);
          }
          const key = `${pkgName};${name}`;
          if (trackClasses.has(key)) {
            hash = trackClasses.get(key);
          } else if (isElectron) {
            // use electron hashes for proxied atoms
            const pkg = filename.match(importedElectronRE)[1];
            definition = getElectronDefinition(server, name);
            hash = hashFunction(`${name}_${definition}`, HASH_LENGTH);
            const key = `${pkg};${name}`;
            trackClasses.set(key, hash);
          } else {
            hash = hashFunction(name, HASH_LENGTH);
          }
        }

        return DEVELOPMENT ? `${name.toUpperCase()}_${hash}` : hash;
      };

      const getJSON: GetJSON = async (cssFileName, json) => {
        const jsonFilePath = cssFileName + ".json";

        // Create a Set of all the non empty css classes
        const resultClassesSet = new Set();
        css.walkRules((r) => {
          const matches = r.selector.match(CLASS_RE);
          if (matches) {
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

        const typingsFilePath = path.join(
          path.dirname(cssFileName),
          "index.d.ts"
        );
        await generateAtomTypings(typingsFilePath, filteredJSON, { server });
      };

      return cssModules({ generateScopedName, getJSON, exportGlobals: true })(
        css,
        result
      );
    },
  };
}

export default atomicCssModules;
