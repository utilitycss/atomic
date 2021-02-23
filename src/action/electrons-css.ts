// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require("debug")("atomic:electrons-css");

import { promises as fsAsync } from "fs";
import path from "path";
import postcss from "postcss";
const readFile = fsAsync.readFile;
const writeFile = fsAsync.writeFile;

const INDEX_CSS = "index.css";
const DIST_FOLDER = "dist";
const POSTCSS_PLUGIN_FILE = "postcss.plugins.js";

const electronsCss = async ({
  electronsFolder,
}: {
  electronsFolder: string;
}): Promise<void> => {
  const electronsPath = path.join(process.cwd(), "packages", electronsFolder);
  debug(`Electron creation path => ${electronsPath}`);

  const fromPath = path.join(electronsPath, INDEX_CSS);
  const toPath = path.join(electronsPath, DIST_FOLDER, INDEX_CSS);

  const source = await readFile(fromPath, { encoding: "utf8" });

  const pluginPath = path.join(electronsPath, POSTCSS_PLUGIN_FILE);
  debug(`Plugin Path => ${pluginPath}`);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const plugins = require(pluginPath)();

  const { css: output } = await postcss(plugins).process(source, {
    from: fromPath,
    to: toPath,
  });

  await fsAsync.mkdir(path.dirname(toPath), { recursive: true });
  await writeFile(toPath, output);
  debug(`Writing file => ${toPath}`);
};

export default electronsCss;
