import ora from "ora";
import AtomsServer from "../server";

export type Watcher = (
  server: AtomsServer,
  spinner: ora.Ora
) => (path: string) => Promise<void>;
