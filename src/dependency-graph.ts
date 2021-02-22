// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require("debug")("atomic:dependency-graph");

import Atom from "./atom";
import path from "path";
import fs from "fs";

import { PACKAGE_JSON, INDEX_CSS } from "./constants";
import run from "./util/run";

interface YarnInfo {
  [key: string]: DependencyAtomInfo;
}

interface DependencyAtomInfo {
  location: string;
  workspaceDependencies: string[];
}

interface AtomInfo {
  path: string;
  children: string[];
  parents: string[];
  pkg: Record<string, unknown>;
  isCss: boolean;
}

interface AtomsInfo {
  [key: string]: AtomInfo;
}

const buildAtomGraph = (atoms: AtomsInfo): AtomGraph => {
  debug("Building Atom graph.");
  return Object.keys(atoms).reduce((forest, name) => {
    const { path, children, parents, pkg, isCss } = atoms[name];
    forest[name] = new Atom({ name, path, atoms: forest, isCss })
      .withParents(parents)
      .withChildren(children)
      .withPackage(pkg);
    return forest;
  }, {} as AtomGraph);
};

export interface AtomGraph {
  [key: string]: Atom;
}

const generateDependencyGraph = async (
  atomsPathRE: RegExp
): Promise<AtomGraph> => {
  const versionString = await run("yarn --version").then((value) =>
    value.split(".")
  );
  debug(`Detected Yarn version => ${versionString.join(".")}`);
  const infoString = await run("yarn workspaces info --json");
  const infoStringJSON = JSON.parse(infoString);
  debug("Getting Yarn Workspace info.");
  let data: YarnInfo;
  if (
    versionString &&
    Array.isArray(versionString) &&
    parseInt(versionString[1], 10) >= 20
  ) {
    // compact use case for yarn version > 20
    data = infoStringJSON;
  } else {
    // fallback use case
    data = JSON.parse(infoStringJSON.data);
  }
  const atomsInfo = Object.keys(data).reduce((prev, next) => {
    if (atomsPathRE.test(data[next].location)) {
      const { workspaceDependencies, location } = data[next];
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pkg = require(path.join(process.cwd(), location, PACKAGE_JSON));
      const indexCssPath = path.join(process.cwd(), location, INDEX_CSS);
      const isCss = fs.existsSync(indexCssPath);
      prev[next] = {
        path: location,
        children: [],
        parents: workspaceDependencies,
        pkg,
        isCss,
      };
    }
    return prev;
  }, {} as AtomsInfo);

  const atoms = Object.keys(atomsInfo).reduce((prev, next) => {
    const dependencies = atomsInfo[next].parents;
    dependencies.forEach((dependency) => {
      if (prev[dependency]) {
        prev[dependency].children.push(next);
      }
    });
    return prev;
  }, atomsInfo);

  return buildAtomGraph(atoms);
};

export default generateDependencyGraph;
