/**
 * Registry of domain events: `concept.entity.action` (past tense) -> payload.
 * Add an event by augmenting this interface next to the service that emits it:
 *
 *   declare module "@mml-bookmark/core/events" {
 *     interface EventMap {
 *       "bookmarks.bookmark.created": { bookmarkId: string; userId: string };
 *     }
 *   }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface EventMap {}
