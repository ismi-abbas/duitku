import { WalletCards } from "lucide-react"
import { createRoute } from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PageHero } from "@/features/budget/components/page-hero"
import { SectionTable } from "@/features/budget/components/section-table"
import { useBudgetStore } from "@/features/budget/hooks/use-budget-store"
import { currency } from "@/features/budget/lib/budget-utils"
import { rootRoute } from "@/routes/root"

function InstallmentsPage() {
  const { monthData, totals } = useBudgetStore()
  const openInstallments = monthData.installments.filter(
    (row) => !row.done
  ).length

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Installments"
        title="Manage fixed monthly obligations without losing the bigger picture."
        description="This page isolates financed commitments so you can see exactly what remains open while still preserving the original shared budget structure."
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center border bg-muted/30">
              <WalletCards className="size-4" />
            </div>
            <div>
              <p className="font-medium">Installment tracker</p>
              <p className="text-muted-foreground">
                Follow the fixed items that should not disappear into normal
                expenses.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              Total {currency.format(totals.installmentTotal)}
            </Badge>
            <Badge variant="secondary">
              Left {currency.format(totals.installmentLeftToPay)}
            </Badge>
            <Badge variant="secondary">Open items {openInstallments}</Badge>
          </div>
        </CardContent>
      </Card>

      <SectionTable
        section="installments"
        title="Installment commitments"
        description="Financed or fixed installment obligations for the selected month."
        rows={monthData.installments}
        addLabel="Add installment"
        showDone
        columns={[
          { key: "name", label: "Item" },
          { key: "category", label: "Category" },
          { key: "dueDate", label: "Due", type: "date" },
          {
            key: "amount",
            label: "Amount",
            type: "currency",
            sum: true,
            payable: true,
          },
          { key: "tags", label: "Tags", type: "tags" },
        ]}
      />
    </div>
  )
}

export const installmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/installments",
  component: InstallmentsPage,
})
