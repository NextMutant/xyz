import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-secondary text-foreground border-transparent",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    danger: "bg-red-50 text-red-700 border-red-100",
    outline: "text-muted-foreground border-border",
  };

  return (
    <div className={cn("inline-flex items-center rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold transition-colors", variants[variant], className)} {...props} />
  )
}

export { Badge }
