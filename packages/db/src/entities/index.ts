import type { EntitySchema } from "@mikro-orm/postgresql";

/**
 * Every entity, registered explicitly (no folder discovery, so it works when
 * bundled by Next.js). Define entities with `defineEntity` and add them here.
 */
export const entities: EntitySchema[] = [];
