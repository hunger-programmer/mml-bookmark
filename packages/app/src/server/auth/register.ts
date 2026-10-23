import "server-only";
import type { AppContainer } from "@mml-bookmark/core";
import type { SessionReader } from "@mml-bookmark/core/http";
import { asClass } from "awilix";
import { SupabaseSessionReader } from "./session-reader";

declare module "@mml-bookmark/core" {
  interface Cradle {
    sessionReader: SessionReader;
  }
}

/** Scoped, like the `userService` it uses. */
export function registerAppAuth(container: AppContainer): void {
  container.register({ sessionReader: asClass(SupabaseSessionReader).scoped() });
}
