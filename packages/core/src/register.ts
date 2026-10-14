import { asFunction, asValue } from "awilix";
import type { AppContainer } from "./container";
import { EventBus } from "./events/event-bus";
import { logger, type Logger } from "./logger";

declare module "./container" {
  interface Cradle {
    logger: Logger;
    eventBus: EventBus;
  }
}

/** Registers the cross-cutting singletons every concept relies on. */
export function registerCore(container: AppContainer): void {
  container.register({
    logger: asValue(logger),
    eventBus: asFunction(({ logger }: { logger: Logger }) => new EventBus(logger)).singleton(),
  });
}
