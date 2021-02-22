// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require("debug")("atomic:visitor-list");
import { Visitor, Node } from "./visitor";

export default class ListVisitor extends Visitor {
  async visit({ name }: Node): Promise<void> {
    debug(name);
    await new Promise((resolve) => {
      setTimeout(() => resolve(name), 1000);
    });
  }
}
