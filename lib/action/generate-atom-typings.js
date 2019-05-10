module.exports = async (path, json, { server }) => {
  const keys = Object.keys(json);
  const types = keys.map(k => `declare const ${k}: string`).join(';\n');
  const exports = keys.join(', ');

  const content = `${types}
export { ${exports} }`;

  await server.writeFile(path, content);
};
