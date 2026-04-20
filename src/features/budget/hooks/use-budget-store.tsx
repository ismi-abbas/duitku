import { createContext, useContext, useMemo, useState } from "react"
import type { PropsWithChildren } from "react"

import {
  createDefaultBudgetData,
} from "@/features/budget/constants"
import { useBudgetSync } from "@/features/budget/hooks/use-budget-sync"
import {
  createEditableMonth,
  computeTotals,
  currentMonthKey,
  ensureMonth,
  makeId,
  previousMonthKey,
  toNumber,
} from "@/features/budget/lib/budget-utils"
import type {
  BudgetData,
  BudgetMonth,
  BudgetRowMap,
  BudgetSection,
  Statement,
} from "@/features/budget/types"

type BudgetContextValue = {
  data: BudgetData
  monthKeys: string[]
  selectedMonth: string
  monthData: BudgetData["months"][string]
  previousMonthData: BudgetMonth | null
  totals: ReturnType<typeof computeTotals>
  previousTotals: ReturnType<typeof computeTotals> | null
  isSyncHydrated: boolean
  isPopulatingMonth: boolean
  isResettingData: boolean
  setSelectedMonth: (monthKey: string) => void
  populateDefaultMonth: (monthKey: string) => Promise<void>
  resetBudgetData: () => Promise<void>
  carryForwardMonth: (monthKey: string) => void
  upsertRow: <Section extends BudgetSection>(
    section: Section,
    payload: BudgetRowMap[Section]
  ) => void
  toggleDone: <Section extends Exclude<BudgetSection, "income">>(
    section: Section,
    id: string
  ) => void
  deleteRow: <Section extends BudgetSection>(
    section: Section,
    id: string
  ) => void
  setStatement: (key: keyof Statement, value: number | string) => void
  setMonthNotes: (value: string) => void
}

const BudgetContext = createContext<BudgetContextValue | null>(null)

export function BudgetProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<BudgetData>(createDefaultBudgetData)

  const { isHydrated, isPopulatingMonth, isResetting, populateDefaultMonth, resetBudgetData } =
    useBudgetSync(data, setData)

  const monthKeys = useMemo(
    () => Object.keys(data.months).sort(),
    [data.months]
  )
  const selectedMonth = data.selectedMonth || monthKeys[0] || currentMonthKey()
  const monthData = createEditableMonth(data.months[selectedMonth])
  const previousMonthData = data.months[previousMonthKey(selectedMonth)]
    ? createEditableMonth(data.months[previousMonthKey(selectedMonth)])
    : null
  const totals = useMemo(
    () => computeTotals(monthData, selectedMonth),
    [monthData, selectedMonth]
  )
  const previousTotals = useMemo(
    () =>
      previousMonthData
        ? computeTotals(previousMonthData, previousMonthKey(selectedMonth))
        : null,
    [previousMonthData, selectedMonth]
  )

  const value = useMemo<BudgetContextValue>(
    () => ({
      data,
      monthKeys,
      selectedMonth,
      monthData,
      previousMonthData,
      totals,
      previousTotals,
      isSyncHydrated: isHydrated,
      isPopulatingMonth,
      isResettingData: isResetting,
      setSelectedMonth: (monthKey) => {
        setData((prev) => {
          const nextData = ensureMonth(prev, monthKey)

          return {
            ...nextData,
            selectedMonth: monthKey,
          }
        })
      },
      populateDefaultMonth,
      resetBudgetData,
      carryForwardMonth: (monthKey) => {
        setData((prev) => {
          const sourceMonth = prev.months[previousMonthKey(monthKey)]
          const nextData = ensureMonth(prev, monthKey)

          if (!sourceMonth) {
            return {
              ...nextData,
              selectedMonth: monthKey,
            }
          }

          const targetMonth = createEditableMonth(nextData.months[monthKey])

          return {
            ...nextData,
            selectedMonth: monthKey,
            months: {
              ...nextData.months,
              [monthKey]: {
                ...targetMonth,
                income: mergeRows(targetMonth.income, sourceMonth.income, (row) => row.recurring),
                expenses: mergeRows(
                  targetMonth.expenses,
                  sourceMonth.expenses,
                  (row) => row.recurring || !row.done,
                  (row) => ({ ...row, actual: 0, done: false })
                ),
                creditCard: mergeRows(
                  targetMonth.creditCard,
                  sourceMonth.creditCard,
                  (row) => row.recurring || !row.done,
                  (row) => ({ ...row, actual: 0, done: false })
                ),
                installments: mergeRows(
                  targetMonth.installments,
                  sourceMonth.installments,
                  (row) => row.recurring || !row.done,
                  (row) => ({ ...row, done: false })
                ),
                savingsGoals: mergeRows(
                  targetMonth.savingsGoals,
                  sourceMonth.savingsGoals,
                  (row) => row.recurring || !row.done,
                  (row) => ({ ...row, done: false })
                ),
                statement: {
                  ...targetMonth.statement,
                  closingDate:
                    targetMonth.statement.closingDate || sourceMonth.statement.closingDate,
                  paymentDueDate:
                    targetMonth.statement.paymentDueDate || sourceMonth.statement.paymentDueDate,
                },
              },
            },
          }
        })
      },
      upsertRow: (section, payload) => {
        setData((prev) => {
          const row = {
            ...payload,
            id: payload.id || makeId(),
          }
          const nextData = ensureMonth(prev, selectedMonth)
          const currentMonth = createEditableMonth(nextData.months[selectedMonth])

          const currentRows = currentMonth[section]
          const exists = currentRows.some((item) => item.id === row.id)
          const nextRows = exists
            ? currentRows.map((item) => (item.id === row.id ? row : item))
            : [...currentRows, row]

          return {
            ...nextData,
            months: {
              ...nextData.months,
              [selectedMonth]: {
                ...currentMonth,
                [section]: nextRows,
              },
            },
          }
        })
      },
      toggleDone: (section, id) => {
        setData((prev) => {
          const nextData = ensureMonth(prev, selectedMonth)
          const currentMonth = createEditableMonth(nextData.months[selectedMonth])

          return {
            ...nextData,
            months: {
              ...nextData.months,
              [selectedMonth]: {
                ...currentMonth,
                [section]: currentMonth[section].map((item) =>
                  item.id === id ? { ...item, done: !item.done } : item
                ),
              },
            },
          }
        })
      },
      deleteRow: (section, id) => {
        setData((prev) => {
          const nextData = ensureMonth(prev, selectedMonth)
          const currentMonth = createEditableMonth(nextData.months[selectedMonth])

          return {
            ...nextData,
            months: {
              ...nextData.months,
              [selectedMonth]: {
                ...currentMonth,
                [section]: currentMonth[section].filter((item) => item.id !== id),
              },
            },
          }
        })
      },
      setStatement: (key, value) => {
        setData((prev) => {
          const nextData = ensureMonth(prev, selectedMonth)
          const currentMonth = createEditableMonth(nextData.months[selectedMonth])

          return {
            ...nextData,
            months: {
              ...nextData.months,
              [selectedMonth]: {
                ...currentMonth,
                statement: {
                  ...currentMonth.statement,
                  [key]: toNumber(value),
                },
              },
            },
          }
        })
      },
      setMonthNotes: (value) => {
        setData((prev) => {
          const nextData = ensureMonth(prev, selectedMonth)
          const currentMonth = createEditableMonth(nextData.months[selectedMonth])

          return {
            ...nextData,
            months: {
              ...nextData.months,
              [selectedMonth]: {
                ...currentMonth,
                notes: value,
              },
            },
          }
        })
      },
    }),
    [
      data,
      isHydrated,
      isPopulatingMonth,
      isResetting,
      monthData,
      monthKeys,
      populateDefaultMonth,
      previousMonthData,
      previousTotals,
      resetBudgetData,
      selectedMonth,
      totals,
    ]
  )

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  )
}

export function useBudgetStore() {
  const context = useContext(BudgetContext)

  if (!context) {
    throw new Error("useBudgetStore must be used within BudgetProvider")
  }

  return context
}

function mergeRows<Row extends { id: string }>(
  currentRows: Row[],
  sourceRows: Row[],
  shouldCopy: (row: Row) => boolean,
  mapRow: (row: Row) => Row = (row) => ({
    ...row,
    id: makeId(),
  })
) {
  const existingIds = new Set(currentRows.map((row) => row.id))
  const copiedRows = sourceRows
    .filter(shouldCopy)
    .filter((row) => !existingIds.has(row.id))
    .map(mapRow)

  return [...currentRows, ...copiedRows]
}
