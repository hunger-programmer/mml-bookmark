import { MikroORM } from "@mikro-orm/postgresql";
import { createOrmConfig } from "./config";

const globalForOrm = globalThis as typeof globalThis & {
  __mmlOrm?: Promise<MikroORM>;
};

async function initOrm(): Promise<MikroORM> {
  const orm = await MikroORM.init(createOrmConfig());
  // v7 `init()` no longer connects; open the pool now so bad config fails fast.
  await orm.connect();
  return orm;
}

/**
 * One ORM (and one connection pool) per process. Cached on `globalThis` so
 * Next.js dev HMR does not open a new pool on every reload.
 */
export function getOrm(): Promise<MikroORM> {
  globalForOrm.__mmlOrm ??= initOrm().catch((error: unknown) => {
    globalForOrm.__mmlOrm = undefined;
    throw error;
  });
  return globalForOrm.__mmlOrm;
}
