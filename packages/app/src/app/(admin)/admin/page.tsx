import { Suspense } from "react";
import { Button } from "@mml-bookmark/ui/components/button";
import { DatabaseStatus } from "./database-status";

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
