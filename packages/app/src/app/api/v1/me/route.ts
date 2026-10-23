import { apiHandler, json, requireSession } from "@mml-bookmark/core/http";
import { getRequestScope } from "@/server/container";

/** The signed-in user, by cookie session or Bearer token. */
export const GET = apiHandler(async (request) => {
  const { cradle } = await getRequestScope();
  const session = await requireSession(cradle.sessionReader, request);
  return json({ id: session.userId, email: session.email, isAdmin: session.isAdmin });
});
