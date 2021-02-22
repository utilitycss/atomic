import generateHashableContent from "./generateHashableContent";
import { GetElectronDefinition } from "./types";

const getElectronDefinition: GetElectronDefinition = (server, name) => {
  const definitionsMap = new Map();

  let definition = "";
  server.electronsRoot.walkRules(new RegExp(`\.${name}`), (rule) => {
    definition = generateHashableContent(rule);
    if (definitionsMap.has(name) && definitionsMap.get(name).count >= 1) {
      definition = definitionsMap.get(name).definition + definition;
      definitionsMap.set(name, {
        definition,
        count: definitionsMap.get(name).count + 1,
      });
    } else {
      definitionsMap.set(name, { definition, count: 1 });
    }
  });

  if (definition === "") {
    console.error(`definition is empty for electron ${name}`);
  }

  return definition;
};

export default getElectronDefinition;
