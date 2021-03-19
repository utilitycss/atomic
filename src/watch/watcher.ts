import AtomsServer from "../server";

export type Watcher = (server: AtomsServer) => (path: string) => Promise<void>;
