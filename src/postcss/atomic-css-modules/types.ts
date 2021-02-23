import { Rule, Root } from "postcss";

import AtomsServer from "../../server";

export interface AtomicCssModulesOptions {
  trackClasses: Map<string, string>;
  importedElectronRE: RegExp;
  importedModuleRE: RegExp;
  ICSSImportRE: RegExp;
  server: AtomsServer;
}

export type GetJSON = (
  cssFileName: string,
  json: { [key: string]: string }
) => void;

export type GenerateScopedName = (
  name: string,
  filename: string,
  content: string
) => string;

export type generateScopedName = (
  opts: AtomicCssModulesOptions & {
    root: Root;
  }
) => GenerateScopedName;

export type GetElectronDefinition = (server: AtomsServer, name: any) => string;

export type GenerateHashableContent = (rule: Rule) => string;

export type HashFunction = (string: string, length: number) => string;
