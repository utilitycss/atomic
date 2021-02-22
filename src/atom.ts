import { AtomGraph } from "./dependency-graph";
import { Visitor } from "./visitor/visitor";

const topologicalOrder = (graph: AtomGraph, root: string[]) => {
  const visited = new Set();
  const dirty = new Set();
  const order = [];
  const queue = [...root];

  const dirtyCheck = [...queue];
  while (dirtyCheck.length) {
    const atom = dirtyCheck.pop();
    dirty.add(atom);
    dirtyCheck.push(...graph[atom].children);
  }

  while (queue.length) {
    const current = queue.pop();
    if (!visited.has(current)) {
      order.push(current);
    }
    visited.add(current);

    graph[current].children.forEach((child) => {
      const allParentsAreVisited = graph[child].parents.every(
        (p) => visited.has(p) || !dirty.has(p)
      );
      if (allParentsAreVisited) {
        queue.push(child);
      }
    });
  }

  return order;
};

export default class Atom {
  name: string;
  path: string;
  atoms: AtomGraph;
  parents: string[];
  children: string[];
  isCss: boolean;
  package: Record<string, unknown>;
  source: string;

  constructor({
    name,
    path,
    atoms,
    isCss = true,
  }: {
    name: string;
    path?: string;
    atoms?: AtomGraph;
    isCss: boolean;
  }) {
    this.name = name;
    this.path = path;
    this.atoms = atoms;
    this.parents = [];
    this.children = [];
    this.isCss = isCss;
  }

  withParents(parents: string[]): this {
    this.parents = parents;
    return this;
  }

  withChildren(children: string[]): this {
    this.children = children;
    return this;
  }

  withPackage(pkg: Record<string, unknown>): this {
    this.package = pkg;
    return this;
  }

  withSource(src: string): this {
    this.source = src;
    return this;
  }

  // async topologically sorted visit
  // promises are resolved concurrently for each tree level
  async accept(visitor: Visitor): Promise<void> {
    const root = this.name === "all" ? this.children : [this.name];
    const order = topologicalOrder(this.atoms, root);
    if (order.length === 0) return;

    const batches = order.reduce(
      (prev, next) => {
        const currentBatch = prev[prev.length - 1];
        if (currentBatch.some((el) => this.atoms[next].parents.includes(el))) {
          prev.push([next]);
          return prev;
        }

        prev[prev.length - 1] = [...currentBatch, next];
        return prev;
      },
      [[]]
    );

    for (const batch of batches) {
      await Promise.all(batch.map((node) => visitor.visit(this.atoms[node])));
    }

    await visitor.finalize();
  }
}
