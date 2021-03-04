import { Plugin } from "postcss";

interface ComposeElectronsOptions {
  module: string;
}

const PLUGIN_NAME = "utility-compose-electrons";
const COMPOSES_KEY = "composes";
const ELECTRONS_KEY = "electrons";
const REGEX = new RegExp(/\s*\(([\s\S]*)\)/);

function composeElectrons(config: ComposeElectronsOptions): Plugin {
  const { module } = config || { module: "" };
  return {
    postcssPlugin: PLUGIN_NAME,
    Declaration: {
      [`${ELECTRONS_KEY}`]: (decl, { Declaration }) => {
        REGEX.lastIndex = 0;
        const match = REGEX.exec(decl.value);
        const content = match ? match[1] : "";
        const electrons = content.split(/[\s,]+/g).filter((el) => el);

        if (electrons.length > 0) {
          decl.replaceWith(
            new Declaration({
              prop: COMPOSES_KEY,
              value: `${electrons.join(" ")} from "${module}"`,
            })
          );
        } else {
          decl.remove();
        }
      },
    },
  };
}

export default composeElectrons;

export const postcss = true;
