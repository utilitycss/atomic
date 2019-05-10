const topologicalOrder = (graph, root) => {
  const visited = new Set();
  const dirty = new Set();
  let order = [];
  let queue = [...root];

  let dirtyCheck = [...queue];
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

    graph[current].children.forEach(child => {
      const allParentsAreVisited = graph[child].parents.every(
        p => visited.has(p) || !dirty.has(p),
      );
      if (allParentsAreVisited) {
        queue.push(child);
      }
    });
  }

  return order;
};

class Atom {
  constructor({ name, path, atoms, isCss = true }) {
    this.name = name;
    this.path = path;
    this.atoms = atoms;
    this.parents = [];
    this.children = [];
    this.isCss = isCss;
  }

  withParents(parents) {
    this.parents = parents;
    return this;
  }

  withChildren(children) {
    this.children = children;
    return this;
  }

  withPackage(pkg) {
    this.package = pkg;
    return this;
  }

  withSource(src) {
    this.source = src;
    return this;
  }

  // async topologically sorted visit
  // promises are resolved concurrently for each tree level
  async accept(visitor) {
    const root = this.name === 'all' ? this.children : [this.name];
    const order = topologicalOrder(this.atoms, root);
    if (order.length === 0) return;

    const batches = order.reduce(
      (prev, next) => {
        const currentBatch = prev[prev.length - 1];
        if (currentBatch.some(el => this.atoms[next].parents.includes(el))) {
          prev.push([next]);
          return prev;
        }

        prev[prev.length - 1] = [...currentBatch, next];
        return prev;
      },
      [[order[0]]],
    );

    for (const batch of batches) {
      await Promise.all(batch.map(node => visitor.visit(this.atoms[node])));
    }
  }
}

module.exports = Atom;
