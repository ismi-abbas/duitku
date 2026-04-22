import { createRouter } from "@tanstack/react-router"

import { creditCardRoute } from "@/routes/credit-card"
import { expensesRoute } from "@/routes/expenses"
import { incomeRoute } from "@/routes/income"
import { indexRoute } from "@/routes/index"
import { installmentsRoute } from "@/routes/installments"
import { rootRoute } from "@/routes/root"
import { savingsRoute } from "@/routes/savings"
import { debtLendRoute } from "@/routes/debt-lend"

const routeTree = rootRoute.addChildren([
  indexRoute,
  incomeRoute,
  expensesRoute,
  creditCardRoute,
  installmentsRoute,
  savingsRoute,
  debtLendRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
