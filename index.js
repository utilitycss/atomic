#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const program = require("commander");
const AtomsServer = require("./dist").AtomsServer;

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

program.parse(process.argv);
