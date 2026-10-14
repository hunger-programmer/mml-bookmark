import { createContainer, InjectionMode, type AwilixContainer } from "awilix";

/**
 * Registry of everything resolvable from the DI container.
 *
 * Packages add their registrations by augmenting this interface:
 *
 *   declare module "@mml-bookmark/core" {
 *     interface Cradle {
 *       bookmarkService: BookmarkService;
 *     }
 *   }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Cradle {}

export type AppContainer = AwilixContainer<Cradle>;

/**
 * Creates the root container. PROXY injection resolves dependencies by name
 * from the cradle, so it survives minification (CLASSIC parses parameter names).
 * `strict` stops singletons from depending on scoped registrations.
 */
export function createAppContainer(): AppContainer {
  return createContainer<Cradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });
}
