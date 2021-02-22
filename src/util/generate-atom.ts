import path from "path";
import generateFile, { Templates } from "./generate-file";

interface AtomData {
  packageScope: string;
  electronsModuleName: string;
  atomsFolder: string;
}

interface GenerateAtomsOptions {
  proxy?: boolean;
  data: AtomData;
}

export default async function generateAtom(
  name: string,
  options: GenerateAtomsOptions
): Promise<void> {
  const getPath = (p: string) =>
    path.join("packages", options.data.atomsFolder, name, p);
  const data = { ...options.data, packageName: name };

  const filePromises: Promise<void>[] = [
    generateFile(Templates.ATOM_NPMIGNORE, data, getPath(".npmignore")),
  ];

  if (options.proxy) {
    filePromises.concat([
      generateFile(
        Templates.ATOM_PROXY_PACKAGE_JSON,
        data,
        getPath("package.json")
      ),
      generateFile(Templates.ATOM_PROXY_INDEX_CSS, data, getPath("index.css")),
      generateFile(
        Templates.ATOM_PROXY_MODULE_CONFIG_JS,
        data,
        getPath("module.config.js")
      ),
    ]);
  } else {
    filePromises.concat([
      generateFile(Templates.ATOM_PACKAGE_JSON, data, getPath("package.json")),
      generateFile(Templates.ATOM_INDEX_CSS, data, getPath("index.css")),
    ]);
  }

  await filePromises;
}
