import type { Dispatch, SetStateAction } from "react"

import { createDefaultBudgetData } from "@/features/budget/constants"
import type { BudgetData } from "@/features/budget/types"
import { supabase } from "@/lib/supabase/client"

export async function loadBudgetSnapshot() {
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase.rpc("get_budget_data")

  if (error) {
    throw error
  }

  if (!isValidBudgetData(data)) {
    return null
  }

  return data
}

export async function saveBudgetSnapshot(data: BudgetData) {
  if (!supabase) {
    return
  }

  const { error } = await supabase.rpc("save_budget_data", {
    input_payload: data,
  })

  if (error) {
    throw error
  }
}

export async function resetBudgetSnapshot() {
  if (!supabase) {
    return createDefaultBudgetData()
  }

  const { error } = await supabase.rpc("reset_budget_data")

  if (error) {
    throw error
  }

  const nextData = await loadBudgetSnapshot()

  if (!nextData) {
    throw new Error("Supabase reset completed but no budget data was returned")
  }

  return nextData
}

export function createFallbackBudgetData() {
  return createDefaultBudgetData()
}

export function replaceBudgetData(
  setData: Dispatch<SetStateAction<BudgetData>>,
  nextData: BudgetData
) {
  setData(nextData)
}

function isValidBudgetData(value: unknown): value is BudgetData {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as BudgetData
  return (
    typeof candidate.selectedMonth === "string" &&
    !!candidate.months &&
    typeof candidate.months === "object" &&
    Object.keys(candidate.months).length > 0
  )
}
