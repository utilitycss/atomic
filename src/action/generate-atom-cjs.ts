import AtomsServer from "../server";

const generateAtomCJS = async (
  path: string,
  json: Record<string, unknown>,
  { server }: { server: AtomsServer }
): Promise<void> => {
  const keys = Object.keys(json);
  const exports = keys.map((k) => `${k}: "${json[k]}"`).join(",\n  ");

  const content = `module.exports = {
  ${exports}
};`;

  await server.writeFile(path, content);
};

export default generateAtomCJS;
