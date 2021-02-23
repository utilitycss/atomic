// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require("debug")("atomic:electron-root");

import * as postcss from "postcss";
import path from "path";
import AtomsServer from "../server";

const electronsRoot = async ({
  server,
}: {
  server: AtomsServer;
}): Promise<void> => {
  const p = <{ [key: string]: any }>(
    server.readFileSync(`pkg:${server.electronsModuleName}`)
  );

  const source = <string>(
    server.readFileSync(
      require.resolve(path.join(server.electronsModuleName, p.main))
    )
  );

  const root = postcss.parse(source);

  debug(`Adding pkg:${server.electronsModuleName} to server cache.`);
  server.electronsRoot = root;
};

export default electronsRoot;
