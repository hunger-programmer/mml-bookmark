import { LoaderCircleIcon } from "lucide-react"
import { cn } from "cn"

export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground", className)}>
      <LoaderCircleIcon className="size-4 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  )
}
