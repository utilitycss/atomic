import postcss from "postcss";
import path from "path";
import AtomsServer from "../server";

const electronsRoot = async ({ server }: { server: AtomsServer }) => {
  const p = <{ [key: string]: any }>(
    server.readFileSync(`pkg:${server.electronsModuleName}`)
  );

  const source = <string>(
    server.readFileSync(
      require.resolve(path.join(server.electronsModuleName, p.main))
    )
  );

  const root = postcss.parse(source);

  server.electronsRoot = root;
};

export default electronsRoot;
