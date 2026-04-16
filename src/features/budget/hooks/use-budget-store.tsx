import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { PropsWithChildren } from "react"

import { createDefaultBudgetData } from "@/features/budget/constants"
import { useBudgetSync } from "@/features/budget/hooks/use-budget-sync"
import {
  computeTotals,
  currentMonthKey,
  ensureMonth,
  makeId,
  STORAGE_KEY,
  toNumber,
} from "@/features/budget/lib/budget-utils"
import type {
  BudgetData,
  BudgetRowMap,
  BudgetSection,
  Statement,
} from "@/features/budget/types"

type BudgetContextValue = {
  data: BudgetData
  monthKeys: string[]
  selectedMonth: string
  monthData: BudgetData["months"][string]
  totals: ReturnType<typeof computeTotals>
  setSelectedMonth: (monthKey: string) => void
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
}

const BudgetContext = createContext<BudgetContextValue | null>(null)

function readInitialData() {
  const fallback = createDefaultBudgetData()
  const saved = localStorage.getItem(STORAGE_KEY)

  if (!saved) {
    return fallback
  }

  try {
    return JSON.parse(saved) as BudgetData
  } catch {
    return fallback
  }
}

export function BudgetProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<BudgetData>(readInitialData)

  useBudgetSync(data, setData)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const monthKeys = useMemo(
    () => Object.keys(data.months).sort(),
    [data.months]
  )
  const selectedMonth = data.selectedMonth || monthKeys[0] || currentMonthKey()
  const monthData = data.months[selectedMonth]
  const totals = useMemo(() => computeTotals(monthData), [monthData])

  const value = useMemo<BudgetContextValue>(
    () => ({
      data,
      monthKeys,
      selectedMonth,
      monthData,
      totals,
      setSelectedMonth: (monthKey) => {
        setData((prev) => ({
          ...ensureMonth(prev, monthKey),
          selectedMonth: monthKey,
        }))
      },
      upsertRow: (section, payload) => {
        setData((prev) => {
          const row = {
            ...payload,
            id: payload.id || makeId(),
          }

          const currentRows = prev.months[selectedMonth][section]
          const exists = currentRows.some((item) => item.id === row.id)
          const nextRows = exists
            ? currentRows.map((item) => (item.id === row.id ? row : item))
            : [...currentRows, row]

          return {
            ...prev,
            months: {
              ...prev.months,
              [selectedMonth]: {
                ...prev.months[selectedMonth],
                [section]: nextRows,
              },
            },
          }
        })
      },
      toggleDone: (section, id) => {
        setData((prev) => ({
          ...prev,
          months: {
            ...prev.months,
            [selectedMonth]: {
              ...prev.months[selectedMonth],
              [section]: prev.months[selectedMonth][section].map((item) =>
                item.id === id ? { ...item, done: !item.done } : item
              ),
            },
          },
        }))
      },
      deleteRow: (section, id) => {
        setData((prev) => ({
          ...prev,
          months: {
            ...prev.months,
            [selectedMonth]: {
              ...prev.months[selectedMonth],
              [section]: prev.months[selectedMonth][section].filter(
                (item) => item.id !== id
              ),
            },
          },
        }))
      },
      setStatement: (key, value) => {
        setData((prev) => ({
          ...prev,
          months: {
            ...prev.months,
            [selectedMonth]: {
              ...prev.months[selectedMonth],
              statement: {
                ...prev.months[selectedMonth].statement,
                [key]: toNumber(value),
              },
            },
          },
        }))
      },
    }),
    [data, monthData, monthKeys, selectedMonth, totals]
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
