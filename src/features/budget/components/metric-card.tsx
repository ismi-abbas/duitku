import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

type MetricCardProps = {
  title: string
  value: string
  subtitle: string
  icon: LucideIcon
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: MetricCardProps) {
  return (
    <Card className="border-0 bg-linear-to-br from-card via-card to-muted/40 ring-1 ring-foreground/10">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-1">
          <p className="text-[11px] tracking-[0.24em] text-muted-foreground uppercase">
            {title}
          </p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex size-11 items-center justify-center border border-border/70 bg-background/90">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}
