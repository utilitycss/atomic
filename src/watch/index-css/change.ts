// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require("debug")("atomic:change");

import path from "path";
import BuildAtomCssVisitor from "../../visitor/build-atom-css";
import ConcatenateCSSVisitor from "../../visitor/concatenate-css";
import bundleAtomsAction from "../../action/bundle-atoms";
import { Watcher } from "../watcher";
const CWD = process.cwd();

const indexCssChange: Watcher = (server) => async (dir) => {
  /** Purge cache entry */
  server.cache.delete(path.join(CWD, dir));

  /** Get changed atom name */
  const atomName = Object.keys(server.graph).find(
    (name) => server.graph[name].path === path.dirname(dir)
  );
  debug(`✅: Building ${atomName} CSS.`);

  const atomRoot = server.graph[atomName];

  await atomRoot.accept(new BuildAtomCssVisitor({ server }));

  const concatenateCSSVisitor = new ConcatenateCSSVisitor({ server });
  await server.root.accept(concatenateCSSVisitor);
  const bundleCssPath = path.join(CWD, server.bundleCSSPath);
  const { css } = await bundleAtomsAction({
    source: concatenateCSSVisitor.getCSS(),
    to: bundleCssPath,
  });
  await server.writeFile(bundleCssPath, css);
  debug(`✅: Building CSS bundle => ${bundleCssPath}`);
};

export default indexCssChange;
