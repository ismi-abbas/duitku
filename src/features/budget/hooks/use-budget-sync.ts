import { useCallback, useEffect, useRef, useState } from "react"
import type { Dispatch, SetStateAction } from "react"

import {
  createFallbackBudgetData,
  loadBudgetSnapshot,
  populateBudgetMonth,
  resetBudgetSnapshot,
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
  const [isHydrated, setIsHydrated] = useState(!isSupabaseConfigured)
  const [isResetting, setIsResetting] = useState(false)
  const [isPopulatingMonth, setIsPopulatingMonth] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured || hydratedRef.current) {
      setIsHydrated(true)
      return
    }

    let cancelled = false

    loadBudgetSnapshot()
      .then((remoteData) => {
        if (cancelled) {
          return
        }

        if (remoteData) {
          lastSyncedRef.current = JSON.stringify(remoteData)
          setData(remoteData)
        } else {
          const fallbackData = createFallbackBudgetData()

          setData(fallbackData)
          lastSyncedRef.current = null
        }

        if (cancelled) {
          return
        }

        hydratedRef.current = true
        setIsHydrated(true)
      })
      .catch(() => {
        hydratedRef.current = true
        setIsHydrated(true)
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

  const resetBudgetData = useCallback(async () => {
    const fallbackData = createFallbackBudgetData()

    setIsResetting(true)

    try {
      if (isSupabaseConfigured) {
        const remoteData = await resetBudgetSnapshot()
        lastSyncedRef.current = JSON.stringify(remoteData)
        setData(remoteData)
      } else {
        setData(fallbackData)
      }
    } finally {
      setIsResetting(false)
    }
  }, [setData])

  const populateDefaultMonth = useCallback(
    async (monthKey: string) => {
      setIsPopulatingMonth(true)

      try {
        if (isSupabaseConfigured) {
          const remoteData = await populateBudgetMonth(monthKey)
          lastSyncedRef.current = JSON.stringify(remoteData)
          setData(remoteData)
          return
        }

        setData((prev) => ({
          ...prev,
          selectedMonth: monthKey,
        }))
      } finally {
        setIsPopulatingMonth(false)
      }
    },
    [setData]
  )

  return {
    isHydrated,
    isPopulatingMonth,
    isResetting,
    populateDefaultMonth,
    resetBudgetData,
  }
}
