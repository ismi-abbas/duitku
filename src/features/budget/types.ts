export type BudgetSection =
  | "income"
  | "expenses"
  | "creditCard"
  | "installments"
  | "savingsGoals"

export type RecurrenceRule = "none" | "monthly"

export type BudgetAlert = {
  id: string
  severity: "warning" | "danger"
  title: string
  detail: string
}

export type ComparisonMetric = {
  label: string
  current: number
  previous: number
  delta: number
}

export type IncomeRow = {
  id: string
  name: string
  amount: number
  gross: number
  category: string
  tags: string[]
  recurring: boolean
}

export type ExpenseRow = {
  id: string
  name: string
  budget: number
  actual: number
  done: boolean
  category: string
  tags: string[]
  dueDate: string
  recurring: boolean
}

export type CreditCardRow = {
  id: string
  name: string
  estimate: number
  actual: number
  done: boolean
  category: string
  tags: string[]
  dueDate: string
  recurring: boolean
}

export type InstallmentRow = {
  id: string
  name: string
  amount: number
  done: boolean
  category: string
  tags: string[]
  dueDate: string
  recurring: boolean
}

export type SavingsGoalRow = {
  id: string
  name: string
  target: number
  saved: number
  dueDate: string
  category: string
  tags: string[]
  recurring: boolean
  done: boolean
}

export type Statement = {
  outstandingBalance: number
  minimumPayment: number
  totalPayment: number
  closingDate: string
  paymentDueDate: string
}

export type BudgetMonth = {
  income: IncomeRow[]
  expenses: ExpenseRow[]
  creditCard: CreditCardRow[]
  installments: InstallmentRow[]
  savingsGoals: SavingsGoalRow[]
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
  savingsGoals: SavingsGoalRow
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
  statementProgress: number
  savingsTarget: number
  savingsSaved: number
  savingsLeftToFund: number
  committedTotal: number
}

export type EditorField = {
  key: string
  label: string
  type?: "text" | "number" | "date" | "boolean" | "tags"
}
