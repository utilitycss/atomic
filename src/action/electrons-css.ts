import { promises as fsAsync } from "fs";
import path from "path";
import mkdirp from "mkdirp-promise";
import postcss from "postcss";
const readFile = fsAsync.readFile;
const writeFile = fsAsync.writeFile;

const electronsCss = async ({
  electronsFolder,
}: {
  electronsFolder: string;
}) => {
  const electronsPath = path.join(process.cwd(), "packages", electronsFolder);
  const fromPath = path.join(electronsPath, "index.css");
  const toPath = path.join(electronsPath, "dist", "index.css");
  const source = await readFile(fromPath, { encoding: "utf8" });
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const plugins = require(path.join(electronsPath, "postcss.plugins.js"))();
  const { css: output } = await postcss(plugins).process(source, {
    from: fromPath,
    to: toPath,
  });
  const dirName = path.dirname(toPath);
  await mkdirp(dirName);
  await writeFile(toPath, output);
};

export default electronsCss;
