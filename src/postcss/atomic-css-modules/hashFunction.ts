import crypto from "crypto";
import { HashFunction } from "./types";

const hashFunction: HashFunction = (string, length) => {
  if (string.indexOf("withSharedVar") !== -1) {
    console.log(">>>>>>>>", string);
  }
  // get numerical value of murmur hash for the string
  return (
    crypto
      .createHash("sha1")
      .update(string)
      .digest("base64")
      // cut to maximum length characters
      .substr(0, length)
      // make base64 class safe
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      // add underscore in front of hash if first char is positive or negative number
      .replace(/^(-?\d)/, "_$1")
  );
};

export default hashFunction;
