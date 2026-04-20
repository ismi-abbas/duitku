import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBudgetStore } from "@/features/budget/hooks/use-budget-store"

export function MonthPicker() {
  const {
    isPopulatingMonth,
    monthData,
    selectedMonth,
    setSelectedMonth,
    populateDefaultMonth,
  } = useBudgetStore()

  const [selectedYear, selectedMonthNumber] = selectedMonth.split("-")
  const monthHasData =
    monthData.income.length > 0 ||
    monthData.expenses.length > 0 ||
    monthData.creditCard.length > 0 ||
    monthData.installments.length > 0 ||
    monthData.notes.length > 0 ||
    monthData.statement.outstandingBalance > 0 ||
    monthData.statement.minimumPayment > 0 ||
    monthData.statement.totalPayment > 0

  return (
    <div className="grid gap-3 sm:grid-cols-[0.9fr_1fr_auto] sm:items-center">
      <Select
        value={selectedYear}
        onValueChange={(year) =>
          setSelectedMonth(`${year}-${selectedMonthNumber}`)
        }
      >
        <SelectTrigger className="min-w-full">
          <SelectValue placeholder="Select year" />
        </SelectTrigger>
        <SelectContent>
          {getYearOptions(selectedYear).map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={selectedMonthNumber}
        onValueChange={(monthNumber) =>
          setSelectedMonth(`${selectedYear}-${monthNumber}`)
        }
      >
        <SelectTrigger className="min-w-full">
          <SelectValue placeholder="Select month" />
        </SelectTrigger>
        <SelectContent>
          {MONTH_OPTIONS.map((month) => (
            <SelectItem key={month.value} value={month.value}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant={monthHasData ? "outline" : "default"}
        disabled={isPopulatingMonth}
        onClick={() => void populateDefaultMonth(selectedMonth)}
      >
        {isPopulatingMonth ? "Populating..." : "Populate default"}
      </Button>
    </div>
  )
}

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1).padStart(2, "0"),
  label: new Date(2026, index, 1).toLocaleDateString("en-MY", {
    month: "long",
  }),
}))

function getYearOptions(selectedYear: string) {
  const currentYear = new Date().getFullYear()
  const baseYears = Array.from({ length: 12 }, (_, index) =>
    String(currentYear - 5 + index)
  )

  return Array.from(new Set([...baseYears, selectedYear])).sort()
}
