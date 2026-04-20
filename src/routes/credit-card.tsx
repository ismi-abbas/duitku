import { CreditCard } from "lucide-react"
import { createRoute } from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PageHero } from "@/features/budget/components/page-hero"
import { SectionTable } from "@/features/budget/components/section-table"
import { StatementPanel } from "@/features/budget/components/statement-panel"
import { useBudgetStore } from "@/features/budget/hooks/use-budget-store"
import { currency } from "@/features/budget/lib/budget-utils"
import { rootRoute } from "@/routes/root"

function CreditCardPage() {
  const { monthData, totals } = useBudgetStore()

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Credit Card"
        title="Separate card charges from cash expenses and statement totals."
        description="Use this page for planned card spending, then keep the live statement summary updated below so payment pressure stays visible."
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center border bg-muted/30">
              <CreditCard className="size-4" />
            </div>
            <div>
              <p className="font-medium">Card spending ledger</p>
              <p className="text-muted-foreground">
                Recurring charges and statement planning live together here.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              Estimated {currency.format(totals.creditBudget)}
            </Badge>
            <Badge variant="secondary">
              Actual {currency.format(totals.creditActual)}
            </Badge>
            <Badge variant="secondary">
              Outstanding {currency.format(totals.currentOutstandingBalance)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <SectionTable
        section="creditCard"
        title="Card charges"
        description="Recurring and planned charges that land on the card statement."
        rows={monthData.creditCard}
        addLabel="Add card item"
        showDone
        columns={[
          { key: "name", label: "Item" },
          { key: "category", label: "Category" },
          { key: "dueDate", label: "Due", type: "date" },
          {
            key: "estimate",
            label: "Estimate",
            type: "currency",
            sum: true,
            payable: true,
          },
          { key: "actual", label: "Actual", type: "currency", sum: true },
          { key: "tags", label: "Tags", type: "tags" },
        ]}
      />

      <StatementPanel />
    </div>
  )
}

export const creditCardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/credit-card",
  component: CreditCardPage,
})
