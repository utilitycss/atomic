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

const getYarnInfo = async (): Promise<YarnInfo> => {
  debug("Getting Yarn Workspace info.");
  const infoString = await run("yarn --json workspaces info");
  debug(infoString);
  const infoStringJSON = JSON.parse(infoString);
  // handle discrepant format between yarn versions
  if (infoStringJSON.data !== undefined) {
    return JSON.parse(infoStringJSON.data);
  }
  return infoStringJSON;
};

const getAtomsInfo = (atomsPathRE: RegExp, data: YarnInfo): AtomsInfo => {
  return Object.keys(data).reduce((prev, next) => {
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
};

const getAtoms = (atomsInfo: AtomsInfo): AtomsInfo => {
  return Object.keys(atomsInfo).reduce((prev, next) => {
    const dependencies = atomsInfo[next].parents;
    dependencies.forEach((dependency) => {
      if (prev[dependency]) {
        prev[dependency].children.push(next);
      }
    });
    return prev;
  }, atomsInfo);
};

const generateDependencyGraph = async (
  atomsPathRE: RegExp
): Promise<AtomGraph> => {
  const data = await getYarnInfo();
  const atomsInfo = getAtomsInfo(atomsPathRE, data);
  const atoms = getAtoms(atomsInfo);

  return buildAtomGraph(atoms);
};

export default generateDependencyGraph;
