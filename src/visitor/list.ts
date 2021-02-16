import { Visitor, Node } from "./visitor";

export default class ListVisitor extends Visitor {
  async visit({ name }: Node) {
    console.log(">>>", name);
    await new Promise((resolve) => {
      setTimeout(() => resolve(name), 1000);
    });
  }
}
