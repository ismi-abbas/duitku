import { Menu, Moon, RotateCcw, Sun } from "lucide-react"
import { Link, Outlet, useRouterState } from "@tanstack/react-router"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import { useBudgetStore } from "@/features/budget/hooks/use-budget-store"

const navigation = [
  { to: "/", label: "Overview" },
  { to: "/income", label: "Income" },
  { to: "/expenses", label: "Expenses" },
  { to: "/credit-card", label: "Credit Card" },
  { to: "/installments", label: "Installments" },
] as const

export function AppShell() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const { theme, setTheme } = useTheme()
  const { isResettingData, isSyncHydrated, resetBudgetData } = useBudgetStore()

  const handleReset = async () => {
    const shouldReset = window.confirm(
      "Reset all budget data in Supabase back to the default starter dataset?"
    )

    if (!shouldReset) {
      return
    }

    await resetBudgetData()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon-sm" className="lg:hidden">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="border-r border-border/60 bg-background p-0"
              >
                <SheetHeader className="border-b border-border/60">
                  <SheetTitle>Budget routes</SheetTitle>
                </SheetHeader>
                <nav className="grid gap-1 p-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        buttonVariants({
                          variant: pathname === item.to ? "default" : "ghost",
                        }),
                        "justify-start"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            <div>
              <p className="text-[11px] tracking-[0.26em] text-muted-foreground uppercase">
                Household planner
              </p>
              <p className="font-medium tracking-tight">
                Monthly Budget Manager
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 lg:flex">
            {navigation.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  buttonVariants({
                    variant: pathname === item.to ? "default" : "ghost",
                    size: "sm",
                  })
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!isSyncHydrated || isResettingData}
              onClick={() => void handleReset()}
            >
              <RotateCcw className="size-4" />
              {isResettingData ? "Resetting..." : "Reset data"}
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
