// MikroORM CLI entry (found by the CLI at ./src/mikro-orm.config.ts). Not used at runtime.
import { Migrator } from "@mikro-orm/migrations";
import { createOrmConfig } from "./config";
import { loadRootEnv } from "./env";

loadRootEnv();

export default createOrmConfig({
  extensions: [Migrator],
  migrations: {
    path: "src/migrations",
    pathTs: "src/migrations",
    emit: "ts",
    transactional: true,
    allOrNothing: true,
  },
});
