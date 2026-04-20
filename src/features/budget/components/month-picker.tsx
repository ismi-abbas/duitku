import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBudgetStore } from "@/features/budget/hooks/use-budget-store"

export function MonthPicker() {
  const { monthKeys, selectedMonth, setSelectedMonth } = useBudgetStore()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
        <SelectTrigger className="min-w-full">
          <SelectValue placeholder="Select month" />
        </SelectTrigger>
        <SelectContent>
          {monthKeys.map((monthKey) => (
            <SelectItem key={monthKey} value={monthKey}>
              {formatMonthKey(monthKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function formatMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number)

  return new Date(year, (month || 1) - 1, 1).toLocaleDateString("en-MY", {
    month: "short",
    year: "numeric",
  })
}
