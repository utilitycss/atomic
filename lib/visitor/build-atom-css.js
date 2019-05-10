const atomCssAction = require('../action/atom-css');
const atomJSONAction = require('../action/atom-json');
const path = require('path');

class BuildAtomCssVisitor {
  constructor({
    utilityConfig,
    electronsModuleName = '@dx/electrons',
    server,
  }) {
    this.utilityConfig = utilityConfig;
    this.electronsModuleName = electronsModuleName;
    this.server = server;
  }

  async visit({ name, path: p, isCss }) {
    if (!isCss) return;

    const to = path.join(process.cwd(), p, 'module.css');
    const from = path.join(process.cwd(), p, 'index.css');
    const source = await this.server.readFile(from);

    // generate module.css
    const { css } = await atomCssAction({
      from,
      to,
      source,
      utilityConfig: this.utilityConfig,
      electronsModuleName: this.electronsModuleName,
    });

    await this.server.writeFile(to, css);

    // generate result.css and module.css.json
    const resultPath = path.join(process.cwd(), p, 'result.css');
    const { css: resultCss } = await atomJSONAction({
      from: to,
      to: resultPath,
      source: css,
      utilityConfig: this.utilityConfig,
      trackClasses: this.server.trackClasses,
      server: this.server,
    });

    await this.server.writeFile(resultPath, resultCss);
  }
}

module.exports = BuildAtomCssVisitor;
