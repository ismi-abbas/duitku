import { useMemo, useState } from "react"
import { CalendarDays, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  const [open, setOpen] = useState(false)

  const selectedDate = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number)
    return new Date(year, (month || 1) - 1, 1)
  }, [selectedMonth])

  const selectedLabel = selectedDate.toLocaleDateString("en-MY", {
    month: "long",
    year: "numeric",
  })

  const handleDateSelect = (date?: Date) => {
    if (!date) {
      return
    }

    const nextMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    setSelectedMonth(nextMonth)
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="min-w-56 justify-between border-border/70 bg-background/80"
          >
            <span className="flex items-center gap-2">
              <CalendarDays className="size-4" />
              {selectedLabel}
            </span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <PopoverHeader className="px-3 pt-3">
            <PopoverTitle>Choose budget month</PopoverTitle>
            <PopoverDescription>
              Pick any day in the month you want to open.
            </PopoverDescription>
          </PopoverHeader>
          <Calendar
            mode="single"
            selected={selectedDate}
            month={selectedDate}
            onSelect={handleDateSelect}
            onMonthChange={handleDateSelect}
            captionLayout="dropdown"
            startMonth={new Date(2024, 0, 1)}
            endMonth={new Date(2035, 11, 1)}
          />
        </PopoverContent>
      </Popover>

      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
        <SelectTrigger className="min-w-40 border-border/70 bg-background/80">
          <SelectValue placeholder="Quick month" />
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
