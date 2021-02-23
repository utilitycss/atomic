export interface Node {
  name: string;
  path: string;
  isCss: boolean;
}

export abstract class Visitor {
  public abstract visit(node: Node): Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async finalize(): Promise<void> {}
}
