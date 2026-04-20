export type BudgetSection =
  | "income"
  | "expenses"
  | "creditCard"
  | "installments"

export type IncomeRow = {
  id: string
  name: string
  amount: number
  gross: number
}

export type ExpenseRow = {
  id: string
  name: string
  budget: number
  actual: number
  done: boolean
}

export type CreditCardRow = {
  id: string
  name: string
  estimate: number
  actual: number
  done: boolean
}

export type InstallmentRow = {
  id: string
  name: string
  amount: number
  done: boolean
}

export type Statement = {
  outstandingBalance: number
  minimumPayment: number
  totalPayment: number
}

export type BudgetMonth = {
  income: IncomeRow[]
  expenses: ExpenseRow[]
  creditCard: CreditCardRow[]
  installments: InstallmentRow[]
  statement: Statement
  notes: string
}

export type BudgetData = {
  selectedMonth: string
  months: Record<string, BudgetMonth>
}

export type BudgetRowMap = {
  income: IncomeRow
  expenses: ExpenseRow
  creditCard: CreditCardRow
  installments: InstallmentRow
}

export type BudgetTotals = {
  incomeTotal: number
  incomeGross: number
  dailyExpenseBudget: number
  expenseBudget: number
  expenseActual: number
  creditBudget: number
  creditActual: number
  installmentTotal: number
  expenseLeftToPay: number
  creditLeftToPay: number
  installmentLeftToPay: number
  totalLeftToPay: number
  remainingBudget: number
  actualBalance: number
  creditCleared: number
  currentOutstandingBalance: number
}

export type EditorField = {
  key: string
  label: string
  type?: "text" | "number"
}
