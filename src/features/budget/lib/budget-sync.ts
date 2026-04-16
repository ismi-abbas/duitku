import type { Dispatch, SetStateAction } from "react"

import { createDefaultBudgetData } from "@/features/budget/constants"
import type { BudgetData } from "@/features/budget/types"
import { supabase } from "@/lib/supabase/client"

const SNAPSHOT_ID = "primary-budget"
const TABLE_NAME = "budget_snapshots"

type SnapshotRow = {
  id: string
  payload: BudgetData
}

export async function loadBudgetSnapshot() {
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("id, payload")
    .eq("id", SNAPSHOT_ID)
    .maybeSingle<SnapshotRow>()

  if (error) {
    throw error
  }

  return data?.payload ?? null
}

export async function saveBudgetSnapshot(data: BudgetData) {
  if (!supabase) {
    return
  }

  const { error } = await supabase.from(TABLE_NAME).upsert({
    id: SNAPSHOT_ID,
    payload: data,
  })

  if (error) {
    throw error
  }
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
