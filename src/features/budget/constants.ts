import { makeId } from "@/features/budget/lib/budget-utils"
import type {
  BudgetData,
  BudgetSection,
  EditorField,
} from "@/features/budget/types"

export function createDefaultBudgetData(): BudgetData {
  return {
    selectedMonth: "2026-05",
    months: {
      "2026-05": {
        income: [
          { id: makeId(), name: "Gaji bersih", amount: 5864.15, gross: 6048 },
          { id: makeId(), name: "Partime", amount: 0, gross: 0 },
          { id: makeId(), name: "Gaji Sayang", amount: 2750, gross: 5800 },
          { id: makeId(), name: "Saving ngarut", amount: 1900, gross: 0 },
          {
            id: makeId(),
            name: "Saving ngarut sayang",
            amount: 3000,
            gross: 0,
          },
        ],
        expenses: [
          {
            id: makeId(),
            name: "Sewa rumah",
            budget: 700,
            actual: 0,
            done: false,
          },
          {
            id: makeId(),
            name: "Credit card installment",
            budget: 648.49,
            actual: 0,
            done: false,
          },
          { id: makeId(), name: "PTPTN", budget: 200, actual: 0, done: false },
          { id: makeId(), name: "Wifi", budget: 252.3, actual: 0, done: false },
          {
            id: makeId(),
            name: "Takaful",
            budget: 193,
            actual: 0,
            done: false,
          },
          {
            id: makeId(),
            name: "Mobile internet",
            budget: 68,
            actual: 0,
            done: false,
          },
          { id: makeId(), name: "Coway", budget: 65, actual: 0, done: false },
          {
            id: makeId(),
            name: "Mak ayah",
            budget: 350,
            actual: 0,
            done: false,
          },
          {
            id: makeId(),
            name: "Zakat",
            budget: 69.32,
            actual: 0,
            done: false,
          },
          {
            id: makeId(),
            name: "Youtube Premium",
            budget: 40,
            actual: 0,
            done: false,
          },
          {
            id: makeId(),
            name: "Google One",
            budget: 8.49,
            actual: 0,
            done: false,
          },
          { id: makeId(), name: "Nafkah", budget: 300, actual: 0, done: false },
          {
            id: makeId(),
            name: "Minyak moto",
            budget: 60,
            actual: 0,
            done: false,
          },
          {
            id: makeId(),
            name: "Groceries",
            budget: 0,
            actual: 0,
            done: false,
          },
          {
            id: makeId(),
            name: "Makan (office)",
            budget: 0,
            actual: 0,
            done: false,
          },
          {
            id: makeId(),
            name: "Makan (lain-lain)",
            budget: 240,
            actual: 0,
            done: false,
          },
          {
            id: makeId(),
            name: "Bil elektrik",
            budget: 200,
            actual: 0,
            done: false,
          },
          { id: makeId(), name: "Saving", budget: 0, actual: 0, done: false },
          { id: makeId(), name: "S70", budget: 1200, actual: 0, done: false },
          { id: makeId(), name: "Taska", budget: 0, actual: 0, done: false },
          {
            id: makeId(),
            name: "Pampers",
            budget: 100,
            actual: 0,
            done: false,
          },
          {
            id: makeId(),
            name: "Commitment Sayang",
            budget: 2000,
            actual: 0,
            done: false,
          },
        ],
        creditCard: [
          {
            id: makeId(),
            name: "Wifi",
            estimate: 648.49,
            actual: 0,
            done: false,
          },
          {
            id: makeId(),
            name: "Takaful",
            estimate: 193,
            actual: 0,
            done: false,
          },
          {
            id: makeId(),
            name: "Mobile Internet (Include Kakak)",
            estimate: 111,
            actual: 0,
            done: false,
          },
          { id: makeId(), name: "Coway", estimate: 65, actual: 0, done: false },
          {
            id: makeId(),
            name: "Youtube Premium",
            estimate: 40,
            actual: 0,
            done: false,
          },
          {
            id: makeId(),
            name: "Google One",
            estimate: 8.49,
            actual: 0,
            done: false,
          },
          {
            id: makeId(),
            name: "Others",
            estimate: 215.25,
            actual: 0,
            done: false,
          },
        ],
        installments: [
          { id: makeId(), name: "Aircond", amount: 398.05, done: false },
        ],
        statement: {
          outstandingBalance: 5008.74,
          minimumPayment: 250.44,
          totalPayment: 250.44,
        },
        notes: "Imported from My Budget - May 2026.csv",
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
