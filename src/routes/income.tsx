import { Landmark } from "lucide-react"
import { createRoute } from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PageHero } from "@/features/budget/components/page-hero"
import { SectionTable } from "@/features/budget/components/section-table"
import { useBudgetStore } from "@/features/budget/hooks/use-budget-store"
import { currency } from "@/features/budget/lib/budget-utils"
import { rootRoute } from "@/routes/root"

function IncomePage() {
  const { monthData, totals } = useBudgetStore()

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Income"
        title="Track every source with net and gross visibility."
        description="Use this page as the funding side of the budget. Keep salary, shared income, and savings transfers visible before you allocate commitments elsewhere."
      />

      <Card className="border-0 ring-1 ring-foreground/10">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center border border-border/60 bg-muted/30">
              <Landmark className="size-4" />
            </div>
            <div>
              <p className="font-medium">Funding snapshot</p>
              <p className="text-muted-foreground">
                Current month intake versus gross earnings.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              Net {currency.format(totals.incomeTotal)}
            </Badge>
            <Badge variant="secondary">
              Gross {currency.format(totals.incomeGross)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <SectionTable
        section="income"
        title="Income sources"
        description="Capture salary, transfers, and side income for the selected month."
        rows={monthData.income}
        addLabel="Add income source"
        columns={[
          { key: "name", label: "Source" },
          { key: "category", label: "Category" },
          { key: "amount", label: "Net", type: "currency", sum: true },
          { key: "gross", label: "Gross", type: "currency", sum: true },
          { key: "tags", label: "Tags", type: "tags" },
        ]}
      />
    </div>
  )
}

export const incomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/income",
  component: IncomePage,
})
