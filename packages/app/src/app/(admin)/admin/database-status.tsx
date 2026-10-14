import { connection } from "next/server";
import { getRequestScope } from "@/server/container";

export async function DatabaseStatus() {
  // DB queries are invisible to Next.js; opt this subtree into request time.
  await connection();
  const { em } = (await getRequestScope()).cradle;
  const status = await em.getConnection().checkConnection();

  return status.ok ? (
    <p className="text-sm text-muted-foreground">Database: connected</p>
  ) : (
    <p className="text-sm text-destructive">Database: {status.reason}</p>
  );
}
