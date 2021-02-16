import path from "path";
import { Visitor, Node } from "./visitor";
import AtomsServer from "../server";
const CWD = process.cwd();

export default class BundleAtomsVisitor extends Visitor {
  server: AtomsServer;
  buffer = "";

  constructor({ server }: { server: AtomsServer }) {
    super();
    this.server = server;
  }

  getCSS() {
    return this.buffer;
  }

  async visit({ path: p, isCss }: Node) {
    if (!p || !isCss) return;
    const css = await this.server.readFile(path.join(CWD, p, "result.css"));
    this.buffer += css;
  }
}
