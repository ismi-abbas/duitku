import { ReceiptText } from "lucide-react"
import { createRoute } from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PageHero } from "@/features/budget/components/page-hero"
import { SectionTable } from "@/features/budget/components/section-table"
import { useBudgetStore } from "@/features/budget/hooks/use-budget-store"
import { currency } from "@/features/budget/lib/budget-utils"
import { rootRoute } from "@/routes/root"

function ExpensesPage() {
  const { monthData, totals } = useBudgetStore()

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Expenses"
        title="Plan commitments and mark progress as the month moves."
        description="This screen focuses on recurring obligations and actual spending so you can search categories quickly and clear items as they are paid."
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center border bg-muted/30">
              <ReceiptText className="size-4" />
            </div>
            <div>
              <p className="font-medium">Expense watchlist</p>
              <p className="text-muted-foreground">
                Search categories and close them off when paid.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              Budget {currency.format(totals.expenseBudget)}
            </Badge>
            <Badge variant="secondary">
              Actual {currency.format(totals.expenseActual)}
            </Badge>
            <Badge variant="secondary">
              Left {currency.format(totals.expenseLeftToPay)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <SectionTable
        section="expenses"
        title="Monthly expenses"
        description="Budget, actual spending, and remaining unpaid items for each category."
        rows={monthData.expenses}
        addLabel="Add expense"
        searchable
        searchPlaceholder="Search expenses like wifi, groceries, zakat"
        showDone
        columns={[
          { key: "name", label: "Category" },
          { key: "category", label: "Group" },
          { key: "dueDate", label: "Due", type: "date" },
          {
            key: "budget",
            label: "Budget",
            type: "currency",
            sum: true,
            payable: true,
          },
          { key: "actual", label: "Actual", type: "currency", sum: true },
          { key: "tags", label: "Tags", type: "tags" },
        ]}
      />
    </div>
  )
}

export const expensesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/expenses",
  component: ExpensesPage,
})
