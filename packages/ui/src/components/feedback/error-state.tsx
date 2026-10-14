import type { ReactNode } from "react"
import { cn } from "cn"

/** `action` is a slot (e.g. a retry button or link) so this stays a server-renderable, presentational component. */
export function ErrorState({
  title = "Something went wrong",
  message,
  action,
  className,
}: {
  title?: string
  message?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div role="alert" className={cn("flex flex-col items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-10 text-center", className)}>
      <p className="font-medium text-destructive">{title}</p>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
