import { useEffect, useRef } from "react"
import type { Dispatch, SetStateAction } from "react"

import {
  loadBudgetSnapshot,
  saveBudgetSnapshot,
} from "@/features/budget/lib/budget-sync"
import type { BudgetData } from "@/features/budget/types"
import { isSupabaseConfigured } from "@/lib/supabase/client"

export function useBudgetSync(
  data: BudgetData,
  setData: Dispatch<SetStateAction<BudgetData>>
) {
  const hydratedRef = useRef(false)
  const lastSyncedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured || hydratedRef.current) {
      return
    }

    let cancelled = false

    loadBudgetSnapshot()
      .then((remoteData) => {
        if (!remoteData || cancelled) {
          hydratedRef.current = true
          return
        }

        lastSyncedRef.current = JSON.stringify(remoteData)
        setData(remoteData)
        hydratedRef.current = true
      })
      .catch(() => {
        hydratedRef.current = true
      })

    return () => {
      cancelled = true
    }
  }, [setData])

  useEffect(() => {
    if (!isSupabaseConfigured || !hydratedRef.current) {
      return
    }

    const serialized = JSON.stringify(data)
    if (serialized === lastSyncedRef.current) {
      return
    }

    lastSyncedRef.current = serialized
    void saveBudgetSnapshot(data).catch(() => {
      lastSyncedRef.current = null
    })
  }, [data])
}
