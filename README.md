[![Node.js CI](https://github.com/utilitycss/atomic/actions/workflows/test.yml/badge.svg)](https://github.com/utilitycss/atomic/actions/workflows/test.yml)

# Atomic
A Framework to build atomic design CSS libraries in a functional manner.

## Installation
```
$ yarn install -g @utilitycss/atomic
```

## Usage
Atomic is meant to be used on monorepos, using yarn workspaces and lerna to
handle internal dependencies. Your project should also live under a single npm
scope (e.g. `@my-design-sytem/package-name`).

If you installed atomic globally you can bootstrap a new atomic project using
```
$ mkdir my-project && cd my-project
$ atomic init
```

Alternatively you can use `npx`
```
$ mkdir my-project && cd my-project
$ npx @utilitycss/atomic init
```

To build the CSS bundle use
```
$ yarn build
```

To start the watch mode use
```
$ yarn start
```

If you already built the project once and you only want to watch for changes you
can use the --no-rebuild (-n) flag
```
$ yarn start -- -n
```

You can create your own visitor in order to execute some actions on each atom
respecting the dependency order.

```js
// ./visitor.js

const Visitor = require("@utilitycss/atomic").Visitor;

module.exports = class ListVisitor extends Visitor {
  async visit(node) {
    console.log('ATOM NAME:', node.name);
  }

  async finalize() {
    console.log('END');
  }
};
```

and then run
```
$ yarn atomic visit ./visitor.js
```

the visit function will be executed in batches of concurrent task whenever
possible: all the atoms in the current batch do not have interdependencies and
they only depend on atoms already visited on some previous batch.
