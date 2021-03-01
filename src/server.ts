// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require("debug")("atomic:server-meta");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const debugInfo = require("debug")("atomic:server");

import chokidar from "chokidar";
import chalk from "chalk";
import * as postcss from "postcss";
import path from "path";
import fs, { promises as fsAsync } from "fs";
import { PluginConfig } from "@utilitycss/utility/dist/types";

import {
  PACKAGE_FOLDER,
  PACKAGE_JSON,
  INDEX_CSS,
  ATOMS_FOLDER,
  ELECTRONS_FOLDER,
  BUNDLE_CSS_NAME,
  PACKAGE_SCOPE,
  ELECTRONS_MODULE_NAME,
  UTILITY_CONFIG_PATH,
} from "./constants";
import Atom from "./atom";
import generateDependencyGraph, { AtomGraph } from "./dependency-graph";
import BuildAtomCssVisitor from "./visitor/build-atom-css";
import ConcatenateCSSVisitor from "./visitor/concatenate-css";
import indexCssWatchChange from "./watch/index-css/change";
import bundleAtomsAction from "./action/bundle-atoms";
import electronsCssAction from "./action/electrons-css";
import electronsRoot from "./action/electrons-root";
import { Visitor } from "./visitor/visitor";

const readFile = fsAsync.readFile;
const writeFile = fsAsync.writeFile;

const DEVELOPMENT = process.env.NODE_ENV === "development";
const CWD = process.cwd();

const PKG_FILE_RE = /^pkg:(.*)/;

type FileContent = string | { [key: string]: any };

export default class AtomsServer {
  atomsFolder: string;
  electronsFolder: string;
  electronsModuleName: string;
  electronsRoot: postcss.Root;
  utilityConfigPath: string;
  packageScope: string;
  bundleCSSPath: string;
  bundleCSSMinPath: string;
  cache: Map<string, FileContent>;
  trackClasses: Map<string, string>;
  atomsPathRE: RegExp;
  importedElectronRE: RegExp;
  importedModuleRE: RegExp;
  ICSSImportRE: RegExp;
  graph: AtomGraph;
  root: Atom;
  utilityConfig: PluginConfig;

  constructor({
    atomsFolder = ATOMS_FOLDER,
    electronsFolder = ELECTRONS_FOLDER,
    electronsModuleName = ELECTRONS_MODULE_NAME,
    utilityConfigPath = UTILITY_CONFIG_PATH,
    packageScope = PACKAGE_SCOPE,
    bundleCSSPath = "./",
    bundleCSSName = BUNDLE_CSS_NAME,
  } = {}) {
    this.atomsFolder = atomsFolder;
    this.electronsFolder = electronsFolder;
    this.electronsModuleName = electronsModuleName;
    this.utilityConfigPath = utilityConfigPath;
    this.packageScope = packageScope;
    this.bundleCSSPath = path.join(bundleCSSPath, `${bundleCSSName}.css`);
    this.bundleCSSMinPath = path.join(
      bundleCSSPath,
      `${bundleCSSName}.min.css`
    );
    this.cache = new Map();
    this.trackClasses = new Map();

    this.atomsPathRE = new RegExp(`${PACKAGE_FOLDER}\\/${atomsFolder}`);
    this.importedElectronRE = new RegExp(
      `^.*\\/(${packageScope}\\/${ELECTRONS_FOLDER})`
    );
    this.importedModuleRE = new RegExp(
      `^.*\\/(${packageScope}\\/.*)\\/module\\.css`
    );
    this.ICSSImportRE = new RegExp(`:import\\("(.*)\\/module\\.css"\\)`);
  }

  readFileSync(p: string, { useCache = true } = {}): FileContent {
    if (useCache && this.cache.has(p)) {
      debug(`Reading file from cache => ${p}.`);
      return this.cache.get(p);
    }

    if (PKG_FILE_RE.test(p)) {
      const pkg = p.match(PKG_FILE_RE)[1];
      const json = this.graph[pkg]
        ? this.graph[pkg].package
        : require(`${pkg}/${PACKAGE_JSON}`);
      this.cache.set(p, json);
      return json;
    }

    debug(`Reading file from file-system ${p}.`);
    const content = fs.readFileSync(p, "utf8");
    const cachedContent =
      path.extname(p) === ".json" ? JSON.parse(content) : content;
    this.cache.set(p, cachedContent);
    return cachedContent;
  }

  async readFile(p: string, { useCache = true } = {}): Promise<FileContent> {
    if (useCache && this.cache.has(p)) {
      debug(`Reading file from cache => ${p}.`);
      return this.cache.get(p);
    }

    if (PKG_FILE_RE.test(p)) {
      const pkg = p.match(PKG_FILE_RE)[1];
      const json = this.graph[pkg]
        ? this.graph[pkg].package
        : require(`${pkg}/${PACKAGE_JSON}`);
      this.cache.set(p, json);
      return json;
    }

    debug(`Reading file from file-system ${p}.`);
    const content = await readFile(p, "utf8");
    const cachedContent =
      path.extname(p) === ".json" ? JSON.parse(content) : content;
    this.cache.set(p, cachedContent);
    return cachedContent;
  }

  writeFile(p: string, content: string): Promise<void> {
    return new Promise(async (resolve) => {
      if (path.extname(p) === ".json") {
        this.cache.set(p, JSON.parse(content));
      } else {
        this.cache.set(p, content);
      }

      if (!fs.existsSync(path.dirname(p))) {
        await fsAsync.mkdir(path.dirname(p), { recursive: true });
      }
      debug("Writing file => ", p);
      await writeFile(p, content);
      resolve();
    });
  }

  async initialize(): Promise<this> {
    try {
      this.graph = await generateDependencyGraph(this.atomsPathRE);
    } catch (err) {
      console.error(err);
      console.log(chalk.red("<<<<< BREAKING BUILD >>>>>"));
      process.exit(1);
    }

    try {
      const roots = Object.keys(this.graph).filter(
        (name) => this.graph[name].parents.length === 0
      );

      this.root = new Atom({
        name: "all",
        atoms: this.graph,
        isCss: false,
      }).withChildren(roots);

      // Pre-populate cache
      Object.keys(this.graph).forEach(async (name) => {
        await this.readFile(
          path.join(CWD, this.graph[name].path, PACKAGE_JSON)
        );
        if (this.graph[name].isCss) {
          await this.readFile(path.join(CWD, this.graph[name].path, INDEX_CSS));
        }
      });
      this.utilityConfig = require(path.join(CWD, this.utilityConfigPath));

      debugInfo("✅: Initializing server.");
      return this;
    } catch (err) {
      console.error(err);
      console.log(chalk.red("<<<<< BREAKING BUILD >>>>>"));
      process.exit(1);
    }
  }

  async run(): Promise<void> {
    try {
      await electronsRoot({ server: this });
      debugInfo("✅: Building Electron Root.");
      const indexCssWatcher = chokidar.watch(
        `${PACKAGE_FOLDER}/${this.atomsFolder}/**/${INDEX_CSS}`
      );
      indexCssWatcher.on("change", indexCssWatchChange(this));
    } catch (err) {
      console.error(err);
      console.log(chalk.red("<<<<< BREAKING BUILD >>>>>"));
      process.exit(1);
    }
  }

  async build(): Promise<void> {
    try {
      /** Build base electron config */
      await electronsCssAction({ electronsFolder: this.electronsFolder });
      debugInfo("✅: Building Electron CSS.");

      /** Add electron to server root cache. */
      await electronsRoot({ server: this });
      debugInfo("✅: Building Electron Root.");

      await this.root.accept(
        new BuildAtomCssVisitor({
          server: this,
        })
      );
      debugInfo("✅: Building Atoms CSS.");

      /** Build CSS bundle */
      const concatenateCSSVisitor = new ConcatenateCSSVisitor({ server: this });
      await this.root.accept(concatenateCSSVisitor);
      const bundleCssPath = path.join(CWD, this.bundleCSSPath);
      const { css } = await bundleAtomsAction({
        source: concatenateCSSVisitor.getCSS(),
        to: bundleCssPath,
        minify: false,
      });
      await this.writeFile(bundleCssPath, css);
      debugInfo(`✅: Building CSS bundle => ${bundleCssPath}`);

      /** Build Minified CSS bundle */
      if (!DEVELOPMENT) {
        const bundleCssMinPath = path.join(CWD, this.bundleCSSMinPath);
        const { css } = await bundleAtomsAction({
          source: concatenateCSSVisitor.getCSS(),
          to: bundleCssMinPath,
          minify: true,
        });
        await this.writeFile(bundleCssMinPath, css);
        debugInfo(`✅: Building minified CSS bundle => ${bundleCssMinPath}`);
      }
    } catch (err) {
      console.error(err);
      console.log(chalk.red("<<<<< BREAKING BUILD >>>>>"));
      process.exit(1);
    }
  }

  async visit(visitor: Visitor): Promise<void> {
    await this.root.accept(visitor);
  }
}
