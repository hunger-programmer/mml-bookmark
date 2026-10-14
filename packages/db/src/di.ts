import { asFunction, asValue } from "awilix";
import type { AppContainer } from "@mml-bookmark/core";
import type { EntityManager, MikroORM } from "@mikro-orm/postgresql";

declare module "@mml-bookmark/core" {
  interface Cradle {
    orm: MikroORM;
    /** Request-scoped fork. Resolve it from a scope, never from the root container. */
    em: EntityManager;
  }
}

export function registerDb(container: AppContainer, orm: MikroORM): void {
  container.register({
    orm: asValue(orm),
    em: asFunction(({ orm }: { orm: MikroORM }) => orm.em.fork()).scoped(),
  });
}
