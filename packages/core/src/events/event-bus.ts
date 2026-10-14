import type { Logger } from "../logger";
import type { EventMap } from "./event-map";

type Handler<K extends keyof EventMap> = (payload: EventMap[K]) => void | Promise<void>;

/**
 * In-process typed emitter for side effects (enqueue enrichment, audit). Not a queue:
 * nothing is persisted or retried. A failing handler is logged and never breaks the emitter
 * or the other handlers.
 */
export class EventBus {
  private readonly handlers = new Map<keyof EventMap, Set<Handler<keyof EventMap>>>();

  constructor(private readonly logger: Logger) {}

  on<K extends keyof EventMap>(event: K, handler: Handler<K>): () => void {
    const set = this.handlers.get(event) ?? new Set();
    set.add(handler as Handler<keyof EventMap>);
    this.handlers.set(event, set);
    return () => set.delete(handler as Handler<keyof EventMap>);
  }

  async emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): Promise<void> {
    for (const handler of this.handlers.get(event) ?? []) {
      try {
        await handler(payload);
      } catch (error) {
        this.logger.error("Event handler failed", { event, error });
      }
    }
  }
}
