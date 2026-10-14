import { Suspense } from "react";
import { connection } from "next/server";
import { Button } from "@mml-bookmark/ui/components/button";
import { getRequestScope } from "@/server/container";

async function DatabaseStatus() {
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

export default function AdminPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Checking database…</p>}>
        <DatabaseStatus />
      </Suspense>
      <div>
        <Button>shadcn/ui button</Button>
      </div>
    </main>
  );
}
