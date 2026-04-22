import { ArrowDownCircle, ArrowUpCircle, HandCoins } from "lucide-react"
import { createRoute } from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PageHero } from "@/features/budget/components/page-hero"
import { SectionTable } from "@/features/budget/components/section-table"
import { useBudgetStore } from "@/features/budget/hooks/use-budget-store"
import { currency } from "@/features/budget/lib/budget-utils"
import { rootRoute } from "@/routes/root"

function DebtLendPage() {
  const { monthData, totals } = useBudgetStore()

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Debt & Lend"
        title="Track who you owe and who still owes you."
        description="Keep personal debts and money you lent in one place so due dates, partial payments, and outstanding balances stay visible every month."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="flex h-full flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center border bg-muted/30">
                <ArrowDownCircle className="size-4" />
              </div>
              <div>
                <p className="font-medium">Debt to settle</p>
                <p className="text-sm text-muted-foreground">
                  What you still need to pay back.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Total {currency.format(totals.debtTotal)}</Badge>
              <Badge variant="secondary">Paid {currency.format(totals.debtPaid)}</Badge>
              <Badge variant="secondary">Left {currency.format(totals.debtLeftToPay)}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex h-full flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center border bg-muted/30">
                <ArrowUpCircle className="size-4" />
              </div>
              <div>
                <p className="font-medium">Money you lent</p>
                <p className="text-sm text-muted-foreground">
                  Follow collections and partial repayments.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Total {currency.format(totals.lendTotal)}</Badge>
              <Badge variant="secondary">
                Collected {currency.format(totals.lendCollected)}
              </Badge>
              <Badge variant="secondary">
                Left {currency.format(totals.lendLeftToCollect)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex h-full flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center border bg-muted/30">
                <HandCoins className="size-4" />
              </div>
              <div>
                <p className="font-medium">Net exposure</p>
                <p className="text-sm text-muted-foreground">
                  Outstanding lent money minus debt you still owe.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Net {currency.format(totals.netExposure)}</Badge>
              <Badge variant="secondary">Open debt {monthData.debts.filter((row) => !row.done).length}</Badge>
              <Badge variant="secondary">Open lends {monthData.lends.filter((row) => !row.done).length}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionTable
          section="debts"
          title="Debt list"
          description="Record who you owe, how much has already been paid, and what remains outstanding."
          rows={monthData.debts}
          addLabel="Add debt"
          searchable
          searchPlaceholder="Search debt by person, category, or tag"
          showDone
          remainingLabel="Left to pay"
          columns={[
            { key: "name", label: "Who" },
            { key: "category", label: "Category" },
            { key: "dueDate", label: "Due", type: "date" },
            { key: "amount", label: "Amount", type: "currency", sum: true, payable: true },
            { key: "paid", label: "Paid", type: "currency", sum: true },
            { key: "tags", label: "Tags", type: "tags" },
          ]}
        />

        <SectionTable
          section="lends"
          title="Lend list"
          description="Track money you lent out, collections received, and who still has an outstanding balance."
          rows={monthData.lends}
          addLabel="Add lend entry"
          searchable
          searchPlaceholder="Search lends by person, category, or tag"
          showDone
          remainingLabel="Left to collect"
          columns={[
            { key: "name", label: "Who" },
            { key: "category", label: "Category" },
            { key: "dueDate", label: "Due", type: "date" },
            { key: "amount", label: "Amount", type: "currency", sum: true, payable: true },
            { key: "collected", label: "Collected", type: "currency", sum: true },
            { key: "tags", label: "Tags", type: "tags" },
          ]}
        />
      </div>
    </div>
  )
}

export const debtLendRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/debt-lend",
  component: DebtLendPage,
})
