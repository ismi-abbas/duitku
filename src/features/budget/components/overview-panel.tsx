import {
  AlertCircle,
  ArrowRight,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { Link } from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MetricCard } from "@/features/budget/components/metric-card"
import { useBudgetStore } from "@/features/budget/hooks/use-budget-store"
import { currency } from "@/features/budget/lib/budget-utils"

export function OverviewPanel() {
  const { monthData, selectedMonth, totals } = useBudgetStore()
  const nextExpenses = monthData.expenses.filter((row) => !row.done).slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Income"
          value={currency.format(totals.incomeTotal)}
          subtitle={`Gross ${currency.format(totals.incomeGross)}`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Expenses"
          value={currency.format(totals.expenseBudget)}
          subtitle={`Left ${currency.format(totals.expenseLeftToPay)}`}
          icon={Wallet}
        />
        <MetricCard
          title="Card"
          value={currency.format(totals.creditBudget)}
          subtitle={`Left ${currency.format(totals.creditLeftToPay)}`}
          icon={CreditCard}
        />
        <MetricCard
          title="Runway"
          value={currency.format(totals.remainingBudget)}
          subtitle={`Actual ${currency.format(totals.actualBalance)}`}
          icon={PiggyBank}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-0 ring-1 ring-foreground/10">
          <CardHeader className="border-b border-border/60">
            <CardTitle>Priority expenses</CardTitle>
            <CardDescription>
              What still needs attention in {selectedMonth}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {nextExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between border border-border/60 bg-muted/20 p-3"
              >
                <div className="space-y-1">
                  <p className="font-medium">{expense.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Budgeted {currency.format(expense.budget)}
                  </p>
                </div>
                <Badge variant="outline">Open</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 ring-1 ring-foreground/10">
          <CardHeader className="border-b border-border/60">
            <CardTitle>Budget signals</CardTitle>
            <CardDescription>
              Quick reads before you move into detail pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <SignalRow
              icon={AlertCircle}
              label="Total left to clear"
              value={currency.format(totals.totalLeftToPay)}
            />
            <SignalRow
              icon={CreditCard}
              label="Live outstanding"
              value={currency.format(totals.currentOutstandingBalance)}
            />
            <SignalRow
              icon={PiggyBank}
              label="Installments"
              value={currency.format(totals.installmentTotal)}
            />

            <Button asChild className="w-full justify-between">
              <Link to="/expenses">
                Open expense planner
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

type SignalRowProps = {
  icon: typeof AlertCircle
  label: string
  value: string
}

function SignalRow({ icon: Icon, label, value }: SignalRowProps) {
  return (
    <div className="flex items-center gap-3 border border-border/60 bg-muted/20 p-3">
      <div className="flex size-9 items-center justify-center border border-border/60 bg-background">
        <Icon className="size-4" />
      </div>
      <div className="flex-1">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  )
}
