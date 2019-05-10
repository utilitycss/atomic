const run = require('./util/run');
const Atom = require('./atom');
const path = require('path');
const fs = require('fs');

const buildAtomGraph = atoms => {
  return Object.keys(atoms).reduce((forest, name) => {
    const { path, children, parents, pkg, isCss } = atoms[name];
    forest[name] = new Atom({ name, path, atoms: forest, isCss })
      .withParents(parents)
      .withChildren(children)
      .withPackage(pkg);
    return forest;
  }, {});
};

const generateDependencyGraph = async atomsPathRE => {
  const infoString = await run('yarn workspaces info --json');
  const data = JSON.parse(infoString).data;
  const info = JSON.parse(data);
  const atomsInfo = Object.keys(info).reduce((prev, next) => {
    if (atomsPathRE.test(info[next].location)) {
      const { workspaceDependencies, location } = info[next];
      const pkg = require(path.join(process.cwd(), location, 'package.json'));
      const indexCssPath = path.join(process.cwd(), location, 'index.css');
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
  }, {});

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

module.exports = generateDependencyGraph;
