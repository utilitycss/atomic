import { compile } from "handlebars";
import fs from "fs";
import path from "path";
import util from "util";
import mkdirp from "mkdirp-promise";
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

export enum Templates {
  PACKAGE_JSON = "package.json.hbs",
  LERNA_JSON = "lerna.json.hbs",
  YARNRC = ".yarnrc.hbs",
  ATOMIC_CONFIG_JS = "atomic.config.js.hbs",
  ELECTRONS_PACKAGE_JSON = "electrons_package.json.hbs",
  ELECTRONS_INDEX_CSS = "electrons_index.css.hbs",
  ELECTRONS_POSTCSS_PLUGINS_JS = "electrons_postcss.plugins.js.hbs",
  ELECTRONS_UTILITY_CONFIG_JS = "electrons_utility.config.js.hbs",
  ELECTRONS_CONFIG_INDEX_JS = "electrons_config_index.js.hbs",
  ELECTRONS_CONFIG_BREAKPOINTS_JS = "electrons_config_breakpoints.js.hbs",
  ELECTRONS_CONFIG_COLORS_JS = "electrons_config_colors.js.hbs",
  ELECTRONS_CONFIG_BASE_JS = "electrons_config_base.js.hbs",
  ELECTRONS_CONFIG_FONT_JS = "electrons_config_font.js.hbs",
  ATOMS_UTILITY_CONFIG_JS = "atoms_utility.config.js.hbs",
  ATOM_PACKAGE_JSON = "atom_package.json.hbs",
  ATOM_INDEX_CSS = "atom_index.css.hbs",
  ATOM_NPMIGNORE = "atom_npmignore.hbs",
  ATOM_PROXY_PACKAGE_JSON = "atom_proxy_package.json.hbs",
  ATOM_PROXY_INDEX_CSS = "atom_proxy_index.css.hbs",
  ATOM_PROXY_MODULE_CONFIG_JS = "atom_proxy_module.config.js.hbs",
  ATOM_TYPOGRAPHY_INDEX_CSS = "atom_typography_index.css.hbs",
}

export interface TemplateData {
  [key: string]: string;
}

const TEMPLATE_PATH = "templates";

const generateFile = async (
  template: Templates,
  data: TemplateData,
  dest: string
) => {
  const templateContent = await readFile(
    path.join(__dirname, "..", "..", TEMPLATE_PATH, template),
    { encoding: "utf8" }
  );
  const render = compile(templateContent);
  const dirName = path.dirname(dest);
  await mkdirp(dirName);
  await writeFile(dest, render(data));
};

export default generateFile;
