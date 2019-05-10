const path = require('path');
const CWD = process.cwd();
const bundleAtomsAction = require('../action/bundle-atoms');

class BundleAtomsVisitor {
  constructor({ server }) {
    this.server = server;
    this.buffer = '';
  }

  getCSS() {
    return this.buffer;
  }

  async visit({ path: p, isCss }) {
    if (!p || !isCss) return;
    const css = await this.server.readFile(path.join(CWD, p, 'result.css'));
    this.buffer += css;
  }
}

module.exports = BundleAtomsVisitor;
