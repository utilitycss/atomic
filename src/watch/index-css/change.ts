import path from "path";
import BuildAtomCssVisitor from "../../visitor/build-atom-css";
import ConcatenateCSSVisitor from "../../visitor/concatenate-css";
import bundleAtomsAction from "../../action/bundle-atoms";
import { Watcher } from "../watcher";
const CWD = process.cwd();

const indexCssChange: Watcher = (server) => async (dir) => {
  // purge cache entry
  server.cache.delete(path.join(CWD, dir));

  const atomName = Object.keys(server.graph).find(
    (name) => server.graph[name].path === path.dirname(dir)
  );

  const atomRoot = server.graph[atomName];

  console.log(`START: building ${atomName} css`);
  console.time(`building-${atomName}-css`);
  await atomRoot.accept(new BuildAtomCssVisitor({ server }));
  console.log(`DONE: building ${atomName} css`);
  console.timeEnd(`building-${atomName}-css`);

  console.log("START: bundling global css");
  console.time("bundle-global-css");
  const concatenateCSSVisitor = new ConcatenateCSSVisitor({ server });
  await server.root.accept(concatenateCSSVisitor);
  const bundleCssPath = path.join(CWD, server.bundleCSSPath);
  const { css } = await bundleAtomsAction({
    source: concatenateCSSVisitor.getCSS(),
    to: bundleCssPath,
  });
  await server.writeFile(bundleCssPath, css);
  console.log("DONE: bundling global css");
  console.timeEnd("bundle-global-css");
};

export default indexCssChange;
