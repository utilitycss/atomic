import AtomsServer from "./server";
import { Visitor } from "./visitor/visitor";
import { Watcher } from "./watch/watcher";
import utilityPlugin, * as utilityRest from "@utilitycss/utility";

const utility = {
  utility: utilityPlugin,
  ...utilityRest,
};

export { AtomsServer, Visitor, Watcher, utility };
