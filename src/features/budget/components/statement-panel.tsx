import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useBudgetStore } from "@/features/budget/hooks/use-budget-store"
import { currency } from "@/features/budget/lib/budget-utils"

export function StatementPanel() {
  const { monthData, setStatement, totals } = useBudgetStore()
  const { statement } = monthData

  return (
    <Card>
      <CardHeader className="gap-3 border-b">
        <div className="space-y-1">
          <CardTitle>Statement command center</CardTitle>
          <CardDescription>
            Keep the latest card figures in sync with your month.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            Live outstanding {currency.format(totals.currentOutstandingBalance)}
          </Badge>
          <Badge variant="secondary">
            Minimum {currency.format(statement.minimumPayment)}
          </Badge>
          <Badge variant="secondary">
            Planned {currency.format(statement.totalPayment)}
          </Badge>
          <Badge variant="secondary">
            Progress {Math.round(totals.statementProgress * 100)}%
          </Badge>
          <Badge variant="secondary">
            Cleared from card items {currency.format(totals.creditCleared)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="grid gap-2">
          <Label htmlFor="outstanding-balance">
            Starting statement balance
          </Label>
          <Input
            id="outstanding-balance"
            type="number"
            value={statement.outstandingBalance}
            onChange={(event) =>
              setStatement("outstandingBalance", event.target.value)
            }
          />
          <p className="text-xs text-muted-foreground">
            Current outstanding updates automatically after cleared card items.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="minimum-payment">Minimum payment</Label>
          <Input
            id="minimum-payment"
            type="number"
            value={statement.minimumPayment}
            onChange={(event) =>
              setStatement("minimumPayment", event.target.value)
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="total-payment">Total payment</Label>
          <Input
            id="total-payment"
            type="number"
            value={statement.totalPayment}
            onChange={(event) =>
              setStatement("totalPayment", event.target.value)
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="statement-closing-date">Statement close date</Label>
          <Input
            id="statement-closing-date"
            type="date"
            value={statement.closingDate}
            onChange={(event) => setStatement("closingDate", event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="statement-payment-due-date">Payment due date</Label>
          <Input
            id="statement-payment-due-date"
            type="date"
            value={statement.paymentDueDate}
            onChange={(event) => setStatement("paymentDueDate", event.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
