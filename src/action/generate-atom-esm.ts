import AtomsServer from "../server";

const generateAtomESM = async (
  path: string,
  json: Record<string, unknown>,
  { server }: { server: AtomsServer }
): Promise<void> => {
  const keys = Object.keys(json);
  const exports = keys
    .map((k) => `export const ${k} = "${json[k]}"`)
    .join(";\n");

  const content = `${exports}`;

  await server.writeFile(path, content);
};

export default generateAtomESM;
