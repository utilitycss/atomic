import path from "path";

import { Visitor, Node } from "./visitor";
import AtomsServer from "../server";
import { RESULT_CSS } from "../constants";

const CWD = process.cwd();

export default class BundleAtomsVisitor extends Visitor {
  server: AtomsServer;
  buffer = "";

  constructor({ server }: { server: AtomsServer }) {
    super();
    this.server = server;
  }

  getCSS(): string {
    return this.buffer;
  }

  async visit({ path: p, isCss }: Node): Promise<void> {
    if (!p || !isCss) return;
    const css = await this.server.readFile(path.join(CWD, p, RESULT_CSS));
    this.buffer += css;
  }
}
