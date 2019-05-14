import run from "./util/run";
import Atom from "./atom";
import path from "path";
import fs from "fs";

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
  pkg: Object;
  isCss: boolean;
}

interface AtomsInfo {
  [key: string]: AtomInfo;
}

const buildAtomGraph = (atoms: AtomsInfo): AtomGraph => {
  return Object.keys(atoms).reduce(
    (forest, name) => {
      const { path, children, parents, pkg, isCss } = atoms[name];
      forest[name] = new Atom({ name, path, atoms: forest, isCss })
        .withParents(parents)
        .withChildren(children)
        .withPackage(pkg);
      return forest;
    },
    {} as AtomGraph
  );
};

export interface AtomGraph {
  [key: string]: Atom;
}

const generateDependencyGraph = async (
  atomsPathRE: RegExp
): Promise<AtomGraph> => {
  const infoString = await run("yarn workspaces info --json");
  const data = JSON.parse(infoString).data;
  const info: YarnInfo = JSON.parse(data);
  const atomsInfo = Object.keys(info).reduce(
    (prev, next) => {
      if (atomsPathRE.test(info[next].location)) {
        const { workspaceDependencies, location } = info[next];
        const pkg = require(path.join(process.cwd(), location, "package.json"));
        const indexCssPath = path.join(process.cwd(), location, "index.css");
        const isCss = fs.existsSync(indexCssPath);
        prev[next] = {
          path: location,
          children: [],
          parents: workspaceDependencies,
          pkg,
          isCss
        };
      }
      return prev;
    },
    {} as AtomsInfo
  );

  const atoms = Object.keys(atomsInfo).reduce((prev, next) => {
    const dependencies = atomsInfo[next].parents;
    dependencies.forEach(dependency => {
      if (prev[dependency]) {
        prev[dependency].children.push(next);
      }
    });
    return prev;
  }, atomsInfo);

  return buildAtomGraph(atoms);
};

export default generateDependencyGraph;
