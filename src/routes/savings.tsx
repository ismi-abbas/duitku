import { PiggyBank } from "lucide-react"
import { createRoute } from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PageHero } from "@/features/budget/components/page-hero"
import { SectionTable } from "@/features/budget/components/section-table"
import { useBudgetStore } from "@/features/budget/hooks/use-budget-store"
import { currency } from "@/features/budget/lib/budget-utils"
import { rootRoute } from "@/routes/root"

function SavingsPage() {
  const { monthData, totals } = useBudgetStore()

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Savings"
        title="Fund annual costs and longer goals without guessing."
        description="Use sinking funds for planned future spending, emergency reserves, and milestones that should not compete with day-to-day bills."
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center border bg-muted/30">
              <PiggyBank className="size-4" />
            </div>
            <div>
              <p className="font-medium">Savings runway</p>
              <p className="text-muted-foreground">
                Track what has already been set aside and what still needs funding.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Saved {currency.format(totals.savingsSaved)}</Badge>
            <Badge variant="secondary">Target {currency.format(totals.savingsTarget)}</Badge>
            <Badge variant="secondary">Left {currency.format(totals.savingsLeftToFund)}</Badge>
          </div>
        </CardContent>
      </Card>

      <SectionTable
        section="savingsGoals"
        title="Savings goals"
        description="Planned reserves, annual obligations, and future purchases for the selected month."
        rows={monthData.savingsGoals}
        addLabel="Add savings goal"
        searchable
        searchPlaceholder="Search goals like emergency fund, road tax, travel"
        showDone
        remainingLabel="Left to fund"
        columns={[
          { key: "name", label: "Goal" },
          { key: "category", label: "Category" },
          { key: "dueDate", label: "Target date", type: "date" },
          { key: "target", label: "Target", type: "currency", sum: true, payable: true },
          { key: "saved", label: "Saved", type: "currency", sum: true },
          { key: "tags", label: "Tags", type: "tags" },
        ]}
      />
    </div>
  )
}

export const savingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/savings",
  component: SavingsPage,
})
