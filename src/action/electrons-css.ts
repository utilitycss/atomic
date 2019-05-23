import fs from "fs";
import path from "path";
import util from "util";
import mkdirp from "mkdirp-promise";
import postcss from "postcss";
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const electronsCss = async ({
  electronsFolder
}: {
  electronsFolder: string;
}) => {
  const electronsPath = path.join(process.cwd(), "packages", electronsFolder);
  const fromPath = path.join(electronsPath, "index.css");
  const toPath = path.join(electronsPath, "dist", "index.css");
  const source = await readFile(fromPath, { encoding: "utf8" });
  const plugins = require(path.join(electronsPath, "postcss.plugins.js"))();
  const { css: output } = await postcss(plugins).process(source, {
    from: fromPath,
    to: toPath
  });
  const dirName = path.dirname(toPath);
  await mkdirp(dirName);
  await writeFile(toPath, output);
};

export default electronsCss;
