import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { MonthPicker } from "@/features/budget/components/month-picker"
import { useBudgetStore } from "@/features/budget/hooks/use-budget-store"
import { currency } from "@/features/budget/lib/budget-utils"

type PageHeroProps = {
  eyebrow: string
  title: string
  description: string
}

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  const { monthData, totals } = useBudgetStore()

  return (
    <Card className="overflow-hidden border-0 bg-card ring-1 ring-foreground/10">
      <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
        <div className="space-y-4">
          <Badge
            variant="secondary"
            className="w-fit border border-border/70 bg-background/70"
          >
            {eyebrow}
          </Badge>
          <div className="space-y-2">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{monthData.notes}</span>
            <Separator orientation="vertical" className="hidden h-4 sm:block" />
            <span>Actual balance {currency.format(totals.actualBalance)}</span>
          </div>
        </div>

        <div className="grid gap-4 self-start border border-border/60 bg-background/70 p-4 backdrop-blur-sm">
          <MonthPicker />
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1 border border-border/60 bg-muted/50 p-3">
              <p className="tracking-[0.18em] text-muted-foreground uppercase">
                Income
              </p>
              <p className="text-lg font-semibold">
                {currency.format(totals.incomeTotal)}
              </p>
            </div>
            <div className="space-y-1 border border-border/60 bg-muted/50 p-3">
              <p className="tracking-[0.18em] text-muted-foreground uppercase">
                Outstanding
              </p>
              <p className="text-lg font-semibold">
                {currency.format(totals.currentOutstandingBalance)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
