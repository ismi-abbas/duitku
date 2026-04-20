import type {
  BudgetData,
  BudgetMonth,
  BudgetRowMap,
  BudgetSection,
  BudgetTotals,
} from "@/features/budget/types"
import { createEmptyBudgetMonth } from "@/features/budget/constants"

export const currency = new Intl.NumberFormat("ms-MY", {
  style: "currency",
  currency: "MYR",
  minimumFractionDigits: 2,
})

export function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

export function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value
  }

  if (!value) {
    return 0
  }

  const cleaned = String(value).replace(/[^\d.-]/g, "")
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

export function currentMonthKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

export function getDaysInMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number)

  return new Date(year, month || 1, 0).getDate()
}

export function createEditableMonth(month?: BudgetMonth): BudgetMonth {
  return month ?? createEmptyBudgetMonth()
}

export function ensureMonth(data: BudgetData, monthKey: string) {
  if (data.months[monthKey]) {
    return data
  }

  return {
    ...data,
    months: {
      ...data.months,
      [monthKey]: createEmptyBudgetMonth(),
    },
  }
}

export function computeTotals(month: BudgetMonth, monthKey: string): BudgetTotals {
  const creditCleared = month.creditCard.reduce((sum, row) => {
    if (!row.done) {
      return sum
    }

    return sum + toNumber(row.actual || row.estimate)
  }, 0)
  const incomeTotal = month.income.reduce(
    (sum, row) => sum + toNumber(row.amount),
    0
  )
  const incomeGross = month.income.reduce(
    (sum, row) => sum + toNumber(row.gross),
    0
  )
  const expenseBudget = month.expenses.reduce(
    (sum, row) => sum + toNumber(row.budget),
    0
  )
  const dailyExpenseBudget = expenseBudget / getDaysInMonth(monthKey)
  const expenseActual = month.expenses.reduce(
    (sum, row) => sum + toNumber(row.actual),
    0
  )
  const creditBudget = month.creditCard.reduce(
    (sum, row) => sum + toNumber(row.estimate),
    0
  )
  const creditActual = month.creditCard.reduce(
    (sum, row) => sum + toNumber(row.actual),
    0
  )
  const installmentTotal = month.installments.reduce(
    (sum, row) => sum + toNumber(row.amount),
    0
  )
  const expenseLeftToPay = month.expenses.reduce(
    (sum, row) => sum + (row.done ? 0 : toNumber(row.budget)),
    0
  )
  const creditLeftToPay = month.creditCard.reduce(
    (sum, row) => sum + (row.done ? 0 : toNumber(row.estimate)),
    0
  )
  const installmentLeftToPay = month.installments.reduce(
    (sum, row) => sum + (row.done ? 0 : toNumber(row.amount)),
    0
  )

  return {
    incomeTotal,
    incomeGross,
    dailyExpenseBudget,
    expenseBudget,
    expenseActual,
    creditBudget,
    creditActual,
    installmentTotal,
    expenseLeftToPay,
    creditLeftToPay,
    installmentLeftToPay,
    totalLeftToPay: expenseLeftToPay + creditLeftToPay + installmentLeftToPay,
    remainingBudget: incomeTotal - expenseBudget,
    actualBalance: incomeTotal - expenseActual,
    creditCleared,
    currentOutstandingBalance: Math.max(
      0,
      toNumber(month.statement.outstandingBalance) - creditCleared
    ),
  }
}

export function sumColumn<Section extends BudgetSection>(
  rows: BudgetRowMap[Section][],
  key: keyof BudgetRowMap[Section]
) {
  return rows.reduce((sum, row) => sum + toNumber(row[key]), 0)
}

export function normalizeFormValues<T extends Record<string, unknown>>(
  form: T
): T {
  return Object.fromEntries(
    Object.entries(form).map(([key, value]) => [
      key,
      typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)
        ? Number(value)
        : value,
    ])
  ) as T
}
