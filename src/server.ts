import chokidar from "chokidar";
import postcss from "postcss";
import Atom from "./atom";
import generateDependencyGraph, { AtomGraph } from "./dependency-graph";
import BuildAtomCssVisitor from "./visitor/build-atom-css";
import ConcatenateCSSVisitor from "./visitor/concatenate-css";
import indexCssWatchChange from "./watch/index-css/change";
import bundleAtomsAction from "./action/bundle-atoms";
import electronsCssAction from "./action/electrons-css";
import electronsRoot from "./action/electrons-root";
import path from "path";
import util from "util";
import fs from "fs";
import { Visitor } from "./visitor/visitor";
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

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
  utilityConfig: Object;

  constructor({
    atomsFolder = "atoms",
    electronsFolder = "electrons",
    electronsModuleName = "@my-org/electrons",
    utilityConfigPath = "packages/atoms/utility.config.js",
    packageScope = "@my-org",
    bundleCSSPath = "./",
    bundleCSSName = "atoms"
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

    this.atomsPathRE = new RegExp(`packages\\/${atomsFolder}`);
    this.importedElectronRE = new RegExp(`^.*\\/(${packageScope}\\/electrons)`);
    this.importedModuleRE = new RegExp(
      `^.*\\/(${packageScope}\\/.*)\\/module\\.css`
    );
    this.ICSSImportRE = new RegExp(`:import\\("(.*)\\/module\\.css"\\)`);
  }

  readFileSync(p: string, { useCache = true } = {}): FileContent {
    if (useCache && this.cache.has(p)) {
      return this.cache.get(p);
    }

    if (PKG_FILE_RE.test(p)) {
      const pkg = p.match(PKG_FILE_RE)[1];
      const json = this.graph[pkg]
        ? this.graph[pkg].package
        : require(`${pkg}/package.json`);
      this.cache.set(p, json);
      return json;
    }

    const content = fs.readFileSync(p, "utf8");
    const cachedContent =
      path.extname(p) === ".json" ? JSON.parse(content) : content;
    this.cache.set(p, cachedContent);
    return cachedContent;
  }

  async readFile(p: string, { useCache = true } = {}): Promise<FileContent> {
    if (useCache && this.cache.has(p)) {
      return this.cache.get(p);
    }

    if (PKG_FILE_RE.test(p)) {
      const pkg = p.match(PKG_FILE_RE)[1];
      const json = this.graph[pkg]
        ? this.graph[pkg].package
        : require(`${pkg}/package.json`);
      this.cache.set(p, json);
      return json;
    }

    const content = await readFile(p, "utf8");
    const cachedContent =
      path.extname(p) === ".json" ? JSON.parse(content) : content;
    this.cache.set(p, cachedContent);
    return cachedContent;
  }

  writeFile(p: string, content: string): Promise<void> {
    return new Promise(async resolve => {
      if (path.extname(p) === ".json") {
        this.cache.set(p, JSON.parse(content));
      } else {
        this.cache.set(p, content);
      }
      resolve();
      await writeFile(p, content);
      console.log("WRITE:", p);
    });
  }

  async initialize(): Promise<this> {
    console.log("START: initializing server");
    console.time("initialize-server");
    this.graph = await generateDependencyGraph(this.atomsPathRE);

    const roots = Object.keys(this.graph).filter(
      name => this.graph[name].parents.length === 0
    );

    this.root = new Atom({
      name: "all",
      atoms: this.graph,
      isCss: false
    }).withChildren(roots);

    // prepopulate cache
    Object.keys(this.graph).forEach(async name => {
      await this.readFile(
        path.join(CWD, this.graph[name].path, "package.json")
      );
      if (this.graph[name].isCss) {
        await this.readFile(path.join(CWD, this.graph[name].path, "index.css"));
      }
    });
    this.utilityConfig = require(path.join(CWD, this.utilityConfigPath));
    console.log("DONE: initializing server");
    console.timeEnd("initialize-server");
    return this;
  }

  async run() {
    console.log("START: building electrons root");
    await electronsRoot({ server: this });
    console.log("DONE: building electrons root");
    const indexCssWatcher = chokidar.watch(
      `packages/${this.atomsFolder}/**/index.css`
    );
    indexCssWatcher.on("change", indexCssWatchChange(this));
  }

  async build() {
    console.log("START: building electrons css");
    await electronsCssAction({ electronsFolder: this.electronsFolder });
    console.log("DONE: building electrons css");
    console.log("START: building electrons root");
    await electronsRoot({ server: this });
    console.log("DONE: building electrons root");
    console.log("START: building atoms css");
    console.time("build-atoms-css");
    await this.root.accept(
      new BuildAtomCssVisitor({
        server: this
      })
    );
    console.log("DONE: building atoms css");
    console.timeEnd("build-atoms-css");

    console.log("START: bundling global css");
    console.time("bundle-global-css");
    const concatenateCSSVisitor = new ConcatenateCSSVisitor({ server: this });
    await this.root.accept(concatenateCSSVisitor);
    const bundleCssPath = path.join(CWD, this.bundleCSSPath);
    const { css } = await bundleAtomsAction({
      source: concatenateCSSVisitor.getCSS(),
      to: bundleCssPath,
      minify: false
    });
    await this.writeFile(bundleCssPath, css);
    if (!DEVELOPMENT) {
      const bundleCssMinPath = path.join(CWD, this.bundleCSSMinPath);
      const { css } = await bundleAtomsAction({
        source: concatenateCSSVisitor.getCSS(),
        to: bundleCssMinPath,
        minify: true
      });
      await this.writeFile(bundleCssMinPath, css);
    }
    console.log("DONE: bundling global css");
    console.timeEnd("bundle-global-css");
  }

  async visit(visitor: Visitor) {
    await this.root.accept(visitor);
  }
}
