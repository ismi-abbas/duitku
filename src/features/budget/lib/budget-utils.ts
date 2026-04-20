import type {
  BudgetAlert,
  BudgetData,
  BudgetMonth,
  BudgetRowMap,
  BudgetSection,
  BudgetTotals,
  ComparisonMetric,
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

export function previousMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number)
  const date = new Date(year, (month || 1) - 2, 1)

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function getDaysInMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number)

  return new Date(year, month || 1, 0).getDate()
}

export function createEditableMonth(month?: BudgetMonth): BudgetMonth {
  const emptyMonth = createEmptyBudgetMonth()

  if (!month) {
    return emptyMonth
  }

  return {
    ...emptyMonth,
    ...month,
    income: (month.income ?? []).map((row) => ({
      ...row,
      category: row.category ?? "",
      tags: row.tags ?? [],
      recurring: row.recurring ?? false,
    })),
    expenses: (month.expenses ?? []).map((row) => ({
      ...row,
      category: row.category ?? "",
      tags: row.tags ?? [],
      dueDate: row.dueDate ?? "",
      recurring: row.recurring ?? false,
    })),
    creditCard: (month.creditCard ?? []).map((row) => ({
      ...row,
      category: row.category ?? "",
      tags: row.tags ?? [],
      dueDate: row.dueDate ?? "",
      recurring: row.recurring ?? false,
    })),
    installments: (month.installments ?? []).map((row) => ({
      ...row,
      category: row.category ?? "",
      tags: row.tags ?? [],
      dueDate: row.dueDate ?? "",
      recurring: row.recurring ?? false,
    })),
    savingsGoals: (month.savingsGoals ?? []).map((row) => ({
      ...row,
      target: row.target ?? 0,
      saved: row.saved ?? 0,
      dueDate: row.dueDate ?? "",
      category: row.category ?? "",
      tags: row.tags ?? [],
      recurring: row.recurring ?? false,
      done: row.done ?? false,
    })),
    statement: {
      ...emptyMonth.statement,
      ...month.statement,
    },
  }
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
  const savingsTarget = month.savingsGoals.reduce(
    (sum, row) => sum + toNumber(row.target),
    0
  )
  const savingsSaved = month.savingsGoals.reduce(
    (sum, row) => sum + toNumber(row.saved),
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
  const savingsLeftToFund = month.savingsGoals.reduce((sum, row) => {
    if (row.done) {
      return sum
    }

    return sum + Math.max(0, toNumber(row.target) - toNumber(row.saved))
  }, 0)
  const plannedStatementPayment = toNumber(month.statement.totalPayment)
  const currentOutstandingBalance = Math.max(
    0,
    toNumber(month.statement.outstandingBalance) - creditCleared
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
    currentOutstandingBalance,
    statementProgress:
      currentOutstandingBalance > 0
        ? Math.min(1, plannedStatementPayment / currentOutstandingBalance)
        : 1,
    savingsTarget,
    savingsSaved,
    savingsLeftToFund,
    committedTotal:
      expenseBudget + creditBudget + installmentTotal + plannedStatementPayment,
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
      key === "tags" && typeof value === "string"
        ? value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : typeof value === "string" && (value === "true" || value === "false")
          ? value === "true"
          : typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)
            ? Number(value)
            : value,
    ])
  ) as T
}

export function serializeFormValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(", ")
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false"
  }

  return String(value ?? "")
}

export function createBudgetAlerts(month: BudgetMonth, totals: BudgetTotals): BudgetAlert[] {
  const alerts: BudgetAlert[] = []

  if (totals.actualBalance < 0) {
    alerts.push({
      id: "actual-balance",
      severity: "danger",
      title: "Actual spending is ahead of income",
      detail: `You are over by ${currency.format(Math.abs(totals.actualBalance))}.`,
    })
  }

  if (totals.remainingBudget < 0) {
    alerts.push({
      id: "planned-balance",
      severity: "danger",
      title: "Planned commitments exceed income",
      detail: `The month is short by ${currency.format(Math.abs(totals.remainingBudget))}.`,
    })
  }

  if (toNumber(month.statement.totalPayment) < toNumber(month.statement.minimumPayment)) {
    alerts.push({
      id: "minimum-payment",
      severity: "warning",
      title: "Statement payment is below the minimum",
      detail: "Increase the planned card payment to avoid falling behind.",
    })
  }

  if (totals.totalLeftToPay > Math.max(0, totals.incomeTotal - totals.expenseActual)) {
    alerts.push({
      id: "left-to-pay",
      severity: "warning",
      title: "Open obligations are higher than the current cash buffer",
      detail: `There is still ${currency.format(totals.totalLeftToPay)} left to clear.`,
    })
  }

  const overdueCount = [
    ...month.expenses,
    ...month.creditCard,
    ...month.installments,
    ...month.savingsGoals,
  ].filter((row) => row.dueDate && !row.done && row.dueDate < new Date().toISOString().slice(0, 10)).length

  if (overdueCount > 0) {
    alerts.push({
      id: "overdue-items",
      severity: "warning",
      title: `${overdueCount} item${overdueCount === 1 ? " is" : "s are"} overdue`,
      detail: "Review due dates and close anything that should already be paid or funded.",
    })
  }

  return alerts
}

export function buildComparisonMetrics(
  current: BudgetTotals,
  previous?: BudgetTotals
): ComparisonMetric[] {
  const baseline = previous ?? computeTotals(createEmptyBudgetMonth(), currentMonthKey())

  return [
    createComparisonMetric("Income", current.incomeTotal, baseline.incomeTotal),
    createComparisonMetric("Expenses", current.expenseActual, baseline.expenseActual),
    createComparisonMetric("Card spend", current.creditActual, baseline.creditActual),
    createComparisonMetric("Runway", current.actualBalance, baseline.actualBalance),
  ]
}

function createComparisonMetric(
  label: string,
  current: number,
  previous: number
): ComparisonMetric {
  return {
    label,
    current,
    previous,
    delta: current - previous,
  }
}
