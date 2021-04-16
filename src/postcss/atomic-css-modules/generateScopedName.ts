import path from "path";
import generateHashableContent from "./generateHashableContent";
import getElectronDefinition from "./getElectronDefinition";
import hashFunction from "./hashFunction";
import { generateScopedName } from "./types";

const HASH_LENGTH = 6;
const DEVELOPMENT = process.env.NODE_ENV === "development";

const generateScopedName: generateScopedName = ({
  trackClasses,
  importedElectronRE,
  importedModuleRE,
  root,
  server,
}) =>
  function (name, filename, content) {
    let definition = content;
    let hash: string;
    let pkgName = "";
    const definitionsMap = new Map();
    const isElectron = importedElectronRE.test(filename);
    root.walkRules(new RegExp(`(\.${name}|:import)`), (rule): any => {
      if (isElectron) {
        // ensure that a rule that appear multiple times has the same hash
        // e.g. inside media queries or when ICSS imported in a different atom.
        // in the context of ICSS import and composes the filename will point
        // to the imported module as relative imports are forbidden in atoms
        // we can safely check for @scope/something patterns to get the correct
        // package name

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
        return;
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
      } else {
        // base case: use the package name from package.json
        const pkg = <{ [key: string]: any }>(
          server.readFileSync(path.join(path.dirname(filename), "package.json"))
        );
        if (pkg.proxy) {
          definition = <string>server.readFileSync(require.resolve(pkg.proxy));
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
        if (definitionsMap.has(name) && definitionsMap.get(name).count >= 1) {
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

export default generateScopedName;
