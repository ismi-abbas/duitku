import { currentMonthKey } from "@/features/budget/lib/budget-utils"
import type {
  BudgetData,
  BudgetMonth,
  BudgetSection,
  EditorField,
} from "@/features/budget/types"

export function createEmptyBudgetMonth(): BudgetMonth {
  return {
    income: [],
    expenses: [],
    creditCard: [],
    installments: [],
    savingsGoals: [],
    debts: [],
    lends: [],
    statement: {
      outstandingBalance: 0,
      minimumPayment: 0,
      totalPayment: 0,
      closingDate: "",
      paymentDueDate: "",
    },
    notes: "",
  }
}

export function createDefaultBudgetData(): BudgetData {
  const monthKey = currentMonthKey()

  return {
    selectedMonth: monthKey,
    months: {
      [monthKey]: createEmptyBudgetMonth(),
    },
  }
}

export const editorFields: Record<BudgetSection, EditorField[]> = {
  income: [
    { key: "name", label: "Name" },
    { key: "amount", label: "Net amount", type: "number" },
    { key: "gross", label: "Gross amount", type: "number" },
    { key: "category", label: "Category" },
    { key: "tags", label: "Tags", type: "tags" },
    { key: "recurring", label: "Recurring", type: "boolean" },
  ],
  expenses: [
    { key: "name", label: "Name" },
    { key: "budget", label: "Budget", type: "number" },
    { key: "actual", label: "Actual", type: "number" },
    { key: "category", label: "Category" },
    { key: "dueDate", label: "Due date", type: "date" },
    { key: "tags", label: "Tags", type: "tags" },
    { key: "recurring", label: "Recurring", type: "boolean" },
  ],
  creditCard: [
    { key: "name", label: "Name" },
    { key: "estimate", label: "Estimate", type: "number" },
    { key: "actual", label: "Actual", type: "number" },
    { key: "category", label: "Category" },
    { key: "dueDate", label: "Due date", type: "date" },
    { key: "tags", label: "Tags", type: "tags" },
    { key: "recurring", label: "Recurring", type: "boolean" },
  ],
  installments: [
    { key: "name", label: "Name" },
    { key: "amount", label: "Amount", type: "number" },
    { key: "category", label: "Category" },
    { key: "dueDate", label: "Due date", type: "date" },
    { key: "tags", label: "Tags", type: "tags" },
    { key: "recurring", label: "Recurring", type: "boolean" },
  ],
  savingsGoals: [
    { key: "name", label: "Goal" },
    { key: "target", label: "Target", type: "number" },
    {
      key: "saved",
      label: "Saved",
      type: "number",
      copySourceKey: "target",
      copyLabel: "Same as target",
    },
    { key: "category", label: "Category" },
    { key: "dueDate", label: "Target date", type: "date" },
    { key: "tags", label: "Tags", type: "tags" },
    { key: "recurring", label: "Recurring", type: "boolean" },
  ],
  debts: [
    { key: "name", label: "Who" },
    { key: "amount", label: "Amount", type: "number" },
    {
      key: "paid",
      label: "Paid",
      type: "number",
      copySourceKey: "amount",
      copyLabel: "Same as amount",
    },
    { key: "category", label: "Category" },
    { key: "dueDate", label: "Due date", type: "date" },
    { key: "tags", label: "Tags", type: "tags" },
    { key: "recurring", label: "Recurring", type: "boolean" },
  ],
  lends: [
    { key: "name", label: "Who" },
    { key: "amount", label: "Amount", type: "number" },
    {
      key: "collected",
      label: "Collected",
      type: "number",
      copySourceKey: "amount",
      copyLabel: "Same as amount",
    },
    { key: "category", label: "Category" },
    { key: "dueDate", label: "Due date", type: "date" },
    { key: "tags", label: "Tags", type: "tags" },
    { key: "recurring", label: "Recurring", type: "boolean" },
  ],
}
