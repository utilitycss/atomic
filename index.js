#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const program = require("commander");
const AtomsServer = require("./dist").AtomsServer;
const inquirer = require("inquirer");
const generateFile = require("./dist/util/generate-file");
const generateAtom = require("./dist/util/generate-atom").default;
const run = require("./dist/util/run").default;
const { default: generate, Templates } = generateFile;

// This atomic server, as well as the ICSS module resolution extensively use
// node module resolution to access local workspace packages.
// As this library will live inside the project node_modules, it will not be
// able to resolve workspace dependencies correctly.
// To achieve that NODE_PATH can be extended with the current CWD node_modules
process.env.NODE_PATH = `${
  process.env.NODE_PATH ? process.env.NODE_PATH + ":" : ""
}${path.join(process.cwd(), "node_modules")}`;
require("module").Module._initPaths();

const loadConfig = (prog, configRelPath) => {
  const configPath = path.join(process.cwd(), configRelPath);
  const hasConfig = fs.existsSync(configPath);
  prog.cfg = hasConfig ? require(configPath) : {};
};

// Search for config on root folder with default name
loadConfig(program, "atomic.config.js");

program.version("0.0.1").description("@utilitycss/atomic CLI");

program.option("-c, --config [path]", "use custom config file");
program.on("option:config", () => {
  // override with custom config
  loadConfig(program, program.config);
});

program.command("build").action(() => {
  const {
    electronsModuleName,
    packageScope,
    utilityConfigPath,
    bundleCSSPath,
    bundleCSSName
  } = program.cfg;

  new AtomsServer({
    electronsModuleName,
    packageScope,
    utilityConfigPath,
    bundleCSSPath,
    bundleCSSName
  })
    .initialize()
    .then(async server => {
      await server.build();
    });
});

program
  .command("start")
  .option("-n, --no-rebuild")
  .action(cmd => {
    const {
      electronsModuleName,
      packageScope,
      utilityConfigPath,
      bundleCSSPath,
      bundleCSSName
    } = program.cfg;

    new AtomsServer({
      electronsModuleName,
      packageScope,
      utilityConfigPath,
      bundleCSSPath,
      bundleCSSName
    })
      .initialize()
      .then(async server => {
        cmd.rebuild && (await server.build());
        await server.run();
      });
  });

program.command("init").action(cmd => {
  inquirer
    .prompt([
      {
        name: "packageScope",
        message: "What is your npm scope (e.g. @my-lib)?"
      },
      {
        name: "electronsFolder",
        message: "Folder name for electrons",
        default: "electrons"
      },
      {
        name: "electronsModuleName",
        message: "Package name for electrons",
        default: inq => `${inq.packageScope}/${inq.electronsFolder}`
      },
      {
        name: "atomsFolder",
        message: "Folder name for atoms",
        default: "atoms"
      },
      {
        name: "bundleCSSPath",
        message: "Relative path for the CSS bundle",
        default: inq => `packages/${inq.atomsFolder}/all/`
      },
      {
        name: "bundleCSSName",
        message: "Name of the global bundle",
        default: "atom"
      }
    ])
    .then(async answers => {
      const data = {
        ...answers,
        utilityConfigPath: `packages/${answers.atomsFolder}/utility.config.js`
      };

      try {
        const filePromises = Promise.all([
          // Root folder
          generate(Templates.PACKAGE_JSON, data, "package.json"),
          generate(Templates.LERNA_JSON, data, "lerna.json"),
          generate(Templates.YARNRC, data, ".yarnrc"),
          generate(Templates.ATOMIC_CONFIG_JS, data, "atomic.config.js"),
          // Electrons package
          generate(
            Templates.ELECTRONS_PACKAGE_JSON,
            data,
            path.join("packages", data.electronsFolder, "package.json")
          ),
          generate(
            Templates.ELECTRONS_INDEX_CSS,
            data,
            path.join("packages", data.electronsFolder, "index.css")
          ),
          generate(
            Templates.ELECTRONS_POSTCSS_PLUGINS_JS,
            data,
            path.join("packages", data.electronsFolder, "postcss.plugins.js")
          ),
          generate(
            Templates.ELECTRONS_UTILITY_CONFIG_JS,
            data,
            path.join("packages", data.electronsFolder, "utility.config.js")
          ),
          generate(
            Templates.ELECTRONS_CONFIG_INDEX_JS,
            data,
            path.join("packages", data.electronsFolder, "config", "index.js")
          ),
          generate(
            Templates.ELECTRONS_CONFIG_BREAKPOINTS_JS,
            data,
            path.join(
              "packages",
              data.electronsFolder,
              "config",
              "breakpoints.js"
            )
          ),
          generate(
            Templates.ELECTRONS_CONFIG_BASE_JS,
            data,
            path.join("packages", data.electronsFolder, "config", "base.js")
          ),
          // Sample electrons
          generate(
            Templates.ELECTRONS_CONFIG_COLORS_JS,
            data,
            path.join("packages", data.electronsFolder, "config", "colors.js")
          ),
          generate(
            Templates.ELECTRONS_CONFIG_FONT_JS,
            data,
            path.join("packages", data.electronsFolder, "config", "font.js")
          ),
          // Atoms packages
          generate(
            Templates.ATOMS_UTILITY_CONFIG_JS,
            data,
            path.resolve(data.utilityConfigPath)
          ),
          // Sample atoms
          generateAtom("colors", { data, proxy: true }),
          generateAtom("typography", { data }),
          generate(
            Templates.ATOM_TYPOGRAPHY_INDEX_CSS,
            data,
            path.join("packages", data.atomsFolder, "typography", "index.css")
          )
        ]);
        console.log("[START] Generating project structure...");
        await filePromises;
        console.log("[DONE] Generating project structure");
        console.log("[START] Installing dependencies...");
        await run("yarn");
        console.log("[DONE] Installing dependencies...");
      } catch (e) {
        console.log("[ERROR]", e);
      }
    });
});

program.parse(process.argv);
