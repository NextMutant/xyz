import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-secondary text-foreground border-transparent",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    danger: "bg-danger/10 text-danger border-danger/20",
    outline: "text-muted-foreground border-border",
  };

  return (
    <div className={cn("inline-flex items-center rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold transition-colors", variants[variant], className)} {...props} />
  )
}

export { Badge }
