import { Declaration } from "postcss";

import { GenerateHashableContent } from "./types";

const generateHashableContent: GenerateHashableContent = (rule) =>
  rule.nodes
    .filter((d: Declaration) => d.prop !== "composes")
    .map((node: Declaration) => node.type + node.prop + node.value)
    .join(";");

export default generateHashableContent;
