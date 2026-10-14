import { connection } from "next/server";
import { apiHandler, json } from "@mml-bookmark/core/http";

// Reference route for the standards: wrapped in apiHandler, no try/catch, no database access,
// so it answers even when PostgreSQL is down. `connection()` keeps it out of prerendering.
export const GET = apiHandler(async () => {
  await connection();
  return json({ status: "ok" });
});
