/** A row of our own `users` table. `id` is the Supabase user id (the JWT `sub`). */
export interface UserRecord {
  id: string;
  email: string;
  isAdmin: boolean;
  suspendedAt: Date | null;
  createdAt: Date;
}

/** Implemented in `@mml-bookmark/db`. */
export interface UserRepository {
  findById(id: string): Promise<UserRecord | null>;
  /** Inserts the row unless one with this id exists. Concurrent first requests produce one row. */
  insertIfAbsent(user: { id: string; email: string }): Promise<void>;
  updateEmail(id: string, email: string): Promise<void>;
}
