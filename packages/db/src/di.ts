import { asClass, asFunction, asValue } from "awilix";
import type { AppContainer } from "@mml-bookmark/core";
import type { EntityManager, MikroORM } from "@mikro-orm/postgresql";
import { MikroUserRepository } from "./repositories/auth/user.repository";

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
    // Repositories implement ports declared (and typed on the Cradle) in @mml-bookmark/core.
    userRepository: asClass(MikroUserRepository).scoped(),
  });
}
