import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { BudgetProvider } from "@/features/budget/hooks/use-budget-store.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <BudgetProvider>
        <App />
      </BudgetProvider>
    </ThemeProvider>
  </StrictMode>
)
