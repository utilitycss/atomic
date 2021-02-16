import atomCssAction from "../action/atom-css";
import atomJSONAction from "../action/atom-json";
import { Visitor, Node } from "./visitor";
import path from "path";
import AtomsServer from "../server";

export default class BuildAtomCssVisitor extends Visitor {
  server: AtomsServer;

  constructor({ server }: { server: AtomsServer }) {
    super();
    this.server = server;
  }

  async visit({ path: p, isCss }: Node) {
    if (!isCss) return;

    const to = path.join(process.cwd(), p, "module.css");
    const from = path.join(process.cwd(), p, "index.css");
    const source = <string>await this.server.readFile(from);

    // generate module.css
    const { css } = await atomCssAction({
      from,
      to,
      source,
      utilityConfig: this.server.utilityConfig,
      electronsModuleName: this.server.electronsModuleName,
    });

    await this.server.writeFile(to, css);

    // generate result.css and module.css.json
    const resultPath = path.join(process.cwd(), p, "result.css");
    const { css: resultCss } = await atomJSONAction({
      from: to,
      to: resultPath,
      source: css,
      server: this.server,
    });

    await this.server.writeFile(resultPath, resultCss);
  }
}
