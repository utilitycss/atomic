// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require("debug")("atomic:build-atom-css");

import chalk from "chalk";
import atomCssAction from "../action/atom-css";
import atomJSONAction from "../action/atom-json";
import { Visitor, Node } from "./visitor";
import path from "path";
import AtomsServer from "../server";

const MODULE_CSS = "module.css";
const RESULT_CSS = "result.css";
const INDEX_CSS = "index.css";

export default class BuildAtomCssVisitor extends Visitor {
  server: AtomsServer;

  constructor({ server }: { server: AtomsServer }) {
    super();
    this.server = server;
  }

  async visit({ path: p, isCss }: Node): Promise<void> {
    if (!isCss) return;

    const to = path.join(process.cwd(), p, MODULE_CSS);
    const from = path.join(process.cwd(), p, INDEX_CSS);
    debug(`Reading file from => ${from}`);
    const source = <string>await this.server.readFile(from);

    // generate module.css
    const { css } = await atomCssAction({
      from,
      to,
      source,
      utilityConfig: this.server.utilityConfig,
      electronsModuleName: this.server.electronsModuleName,
    });

    debug(`Writing file => ${to}`);
    await this.server.writeFile(to, css);

    // generate result.css and module.css.json
    const resultPath = path.join(process.cwd(), p, RESULT_CSS);

    try {
      const { css: resultCss } = await atomJSONAction({
        from: to,
        to: resultPath,
        source: css,
        server: this.server,
      });

      await this.server.writeFile(resultPath, resultCss);
    } catch (err) {
      console.error(err);
      console.log(chalk.red("<<<<< BREAKING BUILD >>>>>"));
      process.exit(1);
    }
  }
}
