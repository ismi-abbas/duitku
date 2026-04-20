import { currentMonthKey } from "@/features/budget/lib/budget-utils"
import type {
  BudgetData,
  BudgetSection,
  EditorField,
} from "@/features/budget/types"

export function createDefaultBudgetData(): BudgetData {
  const monthKey = currentMonthKey()

  return {
    selectedMonth: monthKey,
    months: {
      [monthKey]: {
        income: [],
        expenses: [],
        creditCard: [],
        installments: [],
        statement: {
          outstandingBalance: 0,
          minimumPayment: 0,
          totalPayment: 0,
        },
        notes: "",
      },
    },
  }
}

export const editorFields: Record<BudgetSection, EditorField[]> = {
  income: [
    { key: "name", label: "Name" },
    { key: "amount", label: "Net amount", type: "number" },
    { key: "gross", label: "Gross amount", type: "number" },
  ],
  expenses: [
    { key: "name", label: "Name" },
    { key: "budget", label: "Budget", type: "number" },
    { key: "actual", label: "Actual", type: "number" },
  ],
  creditCard: [
    { key: "name", label: "Name" },
    { key: "estimate", label: "Estimate", type: "number" },
    { key: "actual", label: "Actual", type: "number" },
  ],
  installments: [
    { key: "name", label: "Name" },
    { key: "amount", label: "Amount", type: "number" },
  ],
}
