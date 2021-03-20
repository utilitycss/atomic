#!/usr/bin/env node

import fs from "fs";
import clear from "clear";
import path from "path";
import chalk from "chalk";
import program from "commander";
import { AtomsServer } from "./";
import inquirer from "inquirer";
import execa from "execa";
import Listr, { ListrTask } from "listr";

import {
  default as generate,
  Templates,
  TemplateData,
} from "./util/generate-file";
import generateAtom from "./util/generate-atom";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const figlet = require("figlet");

// eslint-disable-next-line @typescript-eslint/no-var-requires
import { sampleConfigs } from "@utilitycss/utility";
import { BuildHelperFunction } from "@utilitycss/utility/dist/types";

clear();
console.log(
  chalk.red(
    figlet.textSync("atomic cli", {
      horizontalLayout: "default",
      verticalLayout: "default",
      width: 100,
      whitespaceBreak: true,
    })
  )
);

// This atomic server, as well as the ICSS module resolution extensively use
// node module resolution to access local workspace packages.
// As this library will live inside the project node_modules, it will not be
// able to resolve workspace dependencies correctly.
// To achieve that NODE_PATH can be extended with the current CWD node_modules

process.env.NODE_PATH = `${
  process.env.NODE_PATH ? process.env.NODE_PATH + ":" : ""
}${path.join(process.cwd(), "node_modules")}`;

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("module").Module._initPaths();

const loadConfig = (prog: any, configRelPath: string) => {
  const configPath = path.join(process.cwd(), configRelPath);
  const hasConfig = fs.existsSync(configPath);
  prog.cfg = hasConfig ? require(configPath) : {};
};

// Search for config on root folder with default name
loadConfig(program, "atomic.config.js");

program.version("0.0.1").description("@utilitycss/atomic CLI");

program.option("-c, --config [path]", "Use custom config file.");

program.on("option:config", () => {
  // Override with custom config
  loadConfig(program, (program as any).config);
});

program.command("build").action(() => {
  const {
    electronsModuleName,
    packageScope,
    utilityConfigPath,
    bundleCSSPath,
    bundleCSSName,
    additionalPlugins,
  } = (program as any).cfg;

  new AtomsServer({
    electronsModuleName,
    packageScope,
    utilityConfigPath,
    bundleCSSPath,
    bundleCSSName,
    additionalPlugins,
  })
    .initialize()
    .then(async (server) => {
      await server.build();
    });
});

program
  .command("start")
  .option("-n, --no-rebuild")
  .action((cmd) => {
    const {
      electronsModuleName,
      packageScope,
      utilityConfigPath,
      bundleCSSPath,
      bundleCSSName,
      additionalPlugins,
    } = (program as any).cfg;

    new AtomsServer({
      electronsModuleName,
      packageScope,
      utilityConfigPath,
      bundleCSSPath,
      bundleCSSName,
      additionalPlugins,
    })
      .initialize()
      .then(async (server) => {
        cmd.rebuild && (await server.build());
        await server.run();
      });
  });

program.command("visit <visitor>").action((v) => {
  const {
    electronsModuleName,
    packageScope,
    utilityConfigPath,
    bundleCSSPath,
    bundleCSSName,
    additionalPlugins,
  } = (program as any).cfg;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const visitor = require(path.join(process.cwd(), v));

  new AtomsServer({
    electronsModuleName,
    packageScope,
    utilityConfigPath,
    bundleCSSPath,
    bundleCSSName,
    additionalPlugins,
  })
    .initialize()
    .then(async (server) => {
      await server.visit(new visitor());
    });
});

program.command("generate-electron-config").action((cmd) => {
  const { electronsModuleName } = (program as any).cfg;

  /**
   * Resolve for electrons package
   *
   * Assuming, there is a `config` folder in the root of electrons folder
   *  */
  const electronConfigPath = path.join(
    path.parse(require.resolve(`${electronsModuleName}`)).dir,
    "../",
    "config"
  );

  inquirer
    .prompt([
      {
        type: "list",
        name: "module",
        message: "What electron config you want to create?",
        choices: Object.keys(sampleConfigs),
      },
    ])
    .then(async (answers) => {
      const builderFn = (sampleConfigs as {
        [key: string]: BuildHelperFunction;
      })[answers.module];
      if (typeof builderFn === "function") {
        const listrTasks: ListrTask[] = [];

        const saveFilePath = path.join(
          electronConfigPath,
          `${answers.module}.js`
        );

        listrTasks.push({
          title: `Creating ${answers.module} config => ${saveFilePath}`,
          task: async () => {
            await fs.promises.writeFile(saveFilePath, builderFn());
          },
        });

        const tasks = new Listr(listrTasks, {
          exitOnError: true,
        });
        await tasks.run();
      } else {
        throw new Error(`Config builder for ${answers.module} is not found.`);
      }
    });
});

program.command("init").action((cmd) => {
  inquirer
    .prompt([
      {
        name: "packageScope",
        message: "What is your npm scope (e.g. @my-org)?",
        default: "@my-org",
      },
      {
        name: "electronsFolder",
        message: "Folder name for electrons",
        default: "electrons",
      },
      {
        name: "electronsModuleName",
        message: "Package name for electrons",
        default: (inq: any) => `${inq.packageScope}/${inq.electronsFolder}`,
      },
      {
        name: "atomsFolder",
        message: "Folder name for atoms",
        default: "atoms",
      },
      {
        name: "bundleCSSPath",
        message: "Relative path for the CSS bundle",
        default: (inq: any) => `packages/${inq.atomsFolder}/all/`,
      },
      {
        name: "bundleCSSName",
        message: "Name of the global bundle",
        default: "atom",
      },
    ])
    .then(async (answers) => {
      const data = {
        ...answers,
        utilityConfigPath: `packages/${answers.atomsFolder}/utility.config.js`,
      };

      try {
        const listrTasks: ListrTask[] = [];

        listrTasks.push({
          title: "Generating project structure",
          task: async () => {
            await Promise.all([
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
                path.join(
                  "packages",
                  data.electronsFolder,
                  "postcss.plugins.js"
                )
              ),
              generate(
                Templates.ELECTRONS_UTILITY_CONFIG_JS,
                data,
                path.join("packages", data.electronsFolder, "utility.config.js")
              ),
              generate(
                Templates.ELECTRONS_CONFIG_INDEX_JS,
                data,
                path.join(
                  "packages",
                  data.electronsFolder,
                  "config",
                  "index.js"
                )
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
                path.join(
                  "packages",
                  data.electronsFolder,
                  "config",
                  "colors.js"
                )
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
                path.join(
                  "packages",
                  data.atomsFolder,
                  "typography",
                  "index.css"
                )
              ),
            ]);
          },
        });

        listrTasks.push({
          title: "Installing dependencies",
          task: () => execa("yarn"),
        });

        const tasks = new Listr(listrTasks, {
          exitOnError: true,
        });
        await tasks.run();
      } catch (e) {
        console.error(chalk.red("[ERROR]", e));
      }
    });
});

program.parse(process.argv);
