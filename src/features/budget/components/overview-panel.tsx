import {
  AlertCircle,
  ArrowRight,
  CreditCard,
  Goal,
  HandCoins,
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
import { Textarea } from "@/components/ui/textarea"
import { MetricCard } from "@/features/budget/components/metric-card"
import { useBudgetStore } from "@/features/budget/hooks/use-budget-store"
import {
  buildComparisonMetrics,
  createBudgetAlerts,
  currency,
} from "@/features/budget/lib/budget-utils"

export function OverviewPanel() {
  const { monthData, previousTotals, selectedMonth, setMonthNotes, totals } =
    useBudgetStore()
  const nextExpenses = monthData.expenses.filter((row) => !row.done).slice(0, 5)
  const alerts = createBudgetAlerts(monthData, totals)
  const comparisonMetrics = buildComparisonMetrics(totals, previousTotals ?? undefined)
  const dueSoon = [
    ...monthData.expenses,
    ...monthData.creditCard,
    ...monthData.installments,
    ...monthData.savingsGoals,
    ...monthData.debts,
    ...monthData.lends,
  ]
    .filter((row) => row.dueDate && !row.done)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
    .slice(0, 5)

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
          title="Savings"
          value={currency.format(totals.savingsSaved)}
          subtitle={`Left ${currency.format(totals.savingsLeftToFund)}`}
          icon={PiggyBank}
        />
        <MetricCard
          title="Debt & lend"
          value={currency.format(totals.netExposure)}
          subtitle={`Debt left ${currency.format(totals.debtLeftToPay)} • Collect ${currency.format(
            totals.lendLeftToCollect
          )}`}
          icon={HandCoins}
        />
        <MetricCard
          title="Runway"
          value={currency.format(totals.actualBalance)}
          subtitle={`Committed ${currency.format(totals.committedTotal)}`}
          icon={Goal}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Priority expenses</CardTitle>
            <CardDescription>
              What still needs attention in {selectedMonth}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {nextExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between border bg-muted/20 p-3"
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

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Budget alerts</CardTitle>
            <CardDescription>
              Quick reads before you move into detail pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <SignalRow
                  key={alert.id}
                  icon={AlertCircle}
                  label={alert.title}
                  value={alert.detail}
                  tone={alert.severity}
                />
              ))
            ) : (
              <SignalRow
                icon={PiggyBank}
                label="No active risks"
                value="Income, payments, and due items are all in a healthy range."
              />
            )}

            <Button asChild className="w-full justify-between">
              <Link to="/debt-lend">
                Open debt & lend tracker
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Month comparison</CardTitle>
            <CardDescription>
              This month against the previous saved month.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-4">
            {comparisonMetrics.map((metric) => (
              <div
                key={metric.label}
                className="flex items-center justify-between border bg-muted/20 p-3"
              >
                <div>
                  <p className="font-medium">{metric.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Previous {currency.format(metric.previous)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{currency.format(metric.current)}</p>
                  <p className="text-xs text-muted-foreground">
                    {metric.delta >= 0 ? "+" : ""}
                    {currency.format(metric.delta)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Month notes and due dates</CardTitle>
            <CardDescription>
              Capture context for {selectedMonth} and keep the next deadlines visible.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="grid gap-2">
              <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                Notes
              </p>
              <Textarea
                value={monthData.notes}
                onChange={(event) => setMonthNotes(event.target.value)}
                placeholder="What changed this month, what to watch, and what should roll forward next time."
              />
            </div>
            <div className="space-y-3">
              <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                Due soon
              </p>
              {dueSoon.length > 0 ? (
                dueSoon.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border bg-muted/20 p-3"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.category || "Uncategorized"}
                      </p>
                    </div>
                    <Badge variant="outline">{item.dueDate}</Badge>
                  </div>
                ))
              ) : (
                <div className="border border-dashed p-3 text-xs text-muted-foreground">
                  Add due dates to expenses, card items, installments, savings goals, debt payments, or money you lent to surface them here.
                </div>
              )}
            </div>
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
  tone?: "warning" | "danger"
}

function SignalRow({ icon: Icon, label, value, tone }: SignalRowProps) {
  return (
    <div className="flex items-center gap-3 border bg-muted/20 p-3">
      <div
        className={[
          "flex size-9 items-center justify-center border bg-background",
          tone === "danger"
            ? "border-destructive/40 text-destructive"
            : tone === "warning"
              ? "border-amber-500/40 text-amber-600"
              : "border",
        ].join(" ")}
      >
        <Icon className="size-4" />
      </div>
      <div className="flex-1">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  )
}
