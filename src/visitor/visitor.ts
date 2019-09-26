export interface Node {
  name: string;
  path: string;
  isCss: boolean;
}

export abstract class Visitor {
  public abstract async visit(node: Node): Promise<void>;
  public async finalize(): Promise<void> {}
}
