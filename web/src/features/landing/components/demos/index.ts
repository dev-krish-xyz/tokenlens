import type { ComponentType } from 'react'
import { DemoAlerts } from './DemoAlerts.tsx'
import { DemoBudget } from './DemoBudget.tsx'
import { DemoForecast } from './DemoForecast.tsx'
import { DemoLogs } from './DemoLogs.tsx'
import { DemoMargin } from './DemoMargin.tsx'

export type FeatureId = 'budget' | 'margin' | 'alerts' | 'logs' | 'forecast'

export const FEATURE_DEMOS: Record<FeatureId, ComponentType> = {
  budget: DemoBudget,
  margin: DemoMargin,
  alerts: DemoAlerts,
  logs: DemoLogs,
  forecast: DemoForecast,
}

export { DemoAlerts, DemoBudget, DemoForecast, DemoLogs, DemoMargin }
