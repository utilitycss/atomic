import AtomsServer from "../server";

const generateAtomTypings = async (
  path: string,
  json: string,
  { server }: { server: AtomsServer }
) => {
  const keys = Object.keys(json);
  const types = keys.map(k => `declare const ${k}: string`).join(";\n");
  const exports = keys.join(", ");

  const content = `${types}
export { ${exports} }`;

  await server.writeFile(path, content);
};

export default generateAtomTypings;
