// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require("debug")("atomic:change");
import Listr, { ListrTask } from "listr";
import chalk from "chalk";
import path from "path";
import BuildAtomCssVisitor from "../../visitor/build-atom-css";
import ConcatenateCSSVisitor from "../../visitor/concatenate-css";
import bundleAtomsAction from "../../action/bundle-atoms";
import { Watcher } from "../watcher";
const CWD = process.cwd();

const indexCssChange: Watcher = (server, spinner) => async (dir) => {
  try {
    const listrTasks: ListrTask[] = [];

    spinner.succeed();

    /** Purge cache entry */
    server.cache.delete(path.join(CWD, dir));

    /** Get changed atom name */
    const atomName = Object.keys(server.graph).find(
      (name) => server.graph[name].path === path.dirname(dir)
    );

    listrTasks.push({
      title: `Building ${atomName} CSS.`,
      task: async () => {
        debug(`✅: Building ${atomName} CSS.`);

        const atomRoot = server.graph[atomName];

        await atomRoot.accept(new BuildAtomCssVisitor({ server }));
      },
    });

    const bundleCssPath = path.join(CWD, server.bundleCSSPath);
    listrTasks.push({
      title: `Building CSS bundle => ${bundleCssPath}`,
      task: async () => {
        const concatenateCSSVisitor = new ConcatenateCSSVisitor({ server });
        await server.root.accept(concatenateCSSVisitor);

        const { css } = await bundleAtomsAction({
          source: concatenateCSSVisitor.getCSS(),
          to: bundleCssPath,
          additionalPlugins: server.additionalPlugins,
        });
        await server.writeFile(bundleCssPath, css);
        debug(`✅: Building CSS bundle => ${bundleCssPath}`);
      },
    });

    const tasks = new Listr(listrTasks, {
      exitOnError: true,
    });
    await tasks.run();

    spinner.start();
    spinner.text = "Waiting for CSS changes";
  } catch (err) {
    console.error(err);
    console.log(chalk.red("<<<<< BREAKING BUILD >>>>>"));
    process.exit(1);
  }
};

export default indexCssChange;
