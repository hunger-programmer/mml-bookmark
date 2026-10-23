import "server-only";
import { cache } from "react";
import { createAppContainer, registerCore, type AppContainer } from "@mml-bookmark/core";
import { registerAuth } from "@mml-bookmark/core/auth";
import { getOrm, registerDb } from "@mml-bookmark/db";
import { registerAppAuth } from "./auth/register";

// Composition root: the only place that registers into the root container.

const globalForContainer = globalThis as typeof globalThis & {
  __mmlContainer?: Promise<AppContainer>;
};

async function buildContainer(): Promise<AppContainer> {
  const container = createAppContainer();
  registerCore(container);
  registerDb(container, await getOrm());
  registerAuth(container);
  registerAppAuth(container);
  return container;
}

/** Root container, built once per process (survives dev HMR). */
export function getContainer(): Promise<AppContainer> {
  globalForContainer.__mmlContainer ??= buildContainer().catch((error: unknown) => {
    globalForContainer.__mmlContainer = undefined;
    throw error;
  });
  return globalForContainer.__mmlContainer;
}

/**
 * Container scope for the current request. React `cache` makes every Server
 * Component in one request share the same scope, and so the same `em` fork.
 */
export const getRequestScope = cache(async () => {
  const container = await getContainer();
  return container.createScope();
});
