import { createRoute } from "@tanstack/react-router"

import { OverviewPanel } from "@/features/budget/components/overview-panel"
import { PageHero } from "@/features/budget/components/page-hero"
import { rootRoute } from "@/routes/root"

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => {
    return (
      <div className="space-y-6">
        <PageHero
          eyebrow="Overview"
          title="A route-based budget workspace for monthly planning."
          description="The app keeps your data model intact, but the interface now separates high-level signals from detailed editors so each budget job has its own place."
        />
        <OverviewPanel />
      </div>
    )
  },
})
