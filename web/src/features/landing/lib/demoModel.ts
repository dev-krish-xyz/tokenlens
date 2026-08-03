/**
 * Shared pure demo model for landing budget / virtual-key theaters.
 * UI components render state; only this module mutates the story math.
 */

export type DemoKey = {
  id: string
  name: string
  provider: string
  spend: number
  cap: number
}

export type DemoKeyStatus = 'ok' | 'near' | 'blocked'

export type DemoLog = {
  id: number
  model: string
  key: string
  tokens: string
  cost: number
  ms: number
  status: 'ok' | '429'
}

export type DemoRequest = {
  model: string
  keyId: string
  key: string
  tokens: string
  /** Display cost in the log (provider $). */
  cost: number
  /** Dollars added to the key's monthly spend bar. */
  keyDelta: number
  /** Dollars added to the focused key enforcer meter (only if keyId matches). */
  enforcerDelta: number
  ms: number
}

export type HeroDemoState = {
  keys: DemoKey[]
  enforcerSpend: number
  enforcerCap: number
  enforcerKeyId: string
  blocked: boolean
  logs: DemoLog[]
  requests: number
  blockedCount: number
  activeKey: string | null
  toast: string | null
  nextLogId: number
}

export const WS_CAP = 5000
export const ENFORCER_CAP = 100
export const ENFORCER_START = 86.4
export const ENFORCER_KEY_ID = 'k1'
export const LOG_SLOTS = 5

export const DEMO_KEYS_SEED: DemoKey[] = [
  { id: 'k1', name: 'prod-openai', provider: 'OpenAI', spend: 1240, cap: 2000 },
  { id: 'k2', name: 'prod-anthropic', provider: 'Anthropic', spend: 890, cap: 1500 },
  { id: 'k3', name: 'staging-gemini', provider: 'Gemini', spend: 312, cap: 500 },
]

/**
 * Explicit deltas — no magic multipliers in the animation loop.
 * Enforcer starts at 86.4 / 100; k1 deltas sized so a 429 lands in ~6–8s of ticks.
 */
export const DEMO_TRAFFIC: DemoRequest[] = [
  {
    model: 'gpt-4o',
    keyId: 'k1',
    key: 'prod-openai',
    tokens: '1,842',
    cost: 0.042,
    keyDelta: 3.4,
    enforcerDelta: 3.2,
    ms: 412,
  },
  {
    model: 'claude-sonnet',
    keyId: 'k2',
    key: 'prod-anthropic',
    tokens: '2,104',
    cost: 0.038,
    keyDelta: 3.0,
    enforcerDelta: 0,
    ms: 388,
  },
  {
    model: 'gpt-4o',
    keyId: 'k1',
    key: 'prod-openai',
    tokens: '2,210',
    cost: 0.055,
    keyDelta: 4.4,
    enforcerDelta: 4.0,
    ms: 445,
  },
  {
    model: 'gemini-2.0',
    keyId: 'k3',
    key: 'staging-gemini',
    tokens: '980',
    cost: 0.014,
    keyDelta: 1.1,
    enforcerDelta: 0,
    ms: 301,
  },
  {
    model: 'gpt-4o-mini',
    keyId: 'k1',
    key: 'prod-openai',
    tokens: '640',
    cost: 0.006,
    keyDelta: 0.5,
    enforcerDelta: 3.5,
    ms: 210,
  },
  {
    model: 'claude-sonnet',
    keyId: 'k2',
    key: 'prod-anthropic',
    tokens: '1,540',
    cost: 0.048,
    keyDelta: 3.8,
    enforcerDelta: 0,
    ms: 360,
  },
  {
    model: 'gpt-4o',
    keyId: 'k1',
    key: 'prod-openai',
    tokens: '1,920',
    cost: 0.048,
    keyDelta: 3.8,
    enforcerDelta: 4.5,
    ms: 390,
  },
]

export function keyStatus(spend: number, cap: number): DemoKeyStatus {
  if (spend >= cap) return 'blocked'
  if (spend / cap >= 0.85) return 'near'
  return 'ok'
}

export function createHeroState(partial?: Partial<HeroDemoState>): HeroDemoState {
  return {
    keys: DEMO_KEYS_SEED.map((k) => ({ ...k })),
    enforcerSpend: ENFORCER_START,
    enforcerCap: ENFORCER_CAP,
    enforcerKeyId: ENFORCER_KEY_ID,
    blocked: false,
    logs: [],
    requests: 1284,
    blockedCount: 12,
    activeKey: null,
    toast: null,
    nextLogId: 1,
    ...partial,
  }
}

export function softResetHero(state: HeroDemoState): HeroDemoState {
  return {
    ...state,
    keys: DEMO_KEYS_SEED.map((k) => ({ ...k })),
    enforcerSpend: ENFORCER_START,
    blocked: false,
    activeKey: null,
    toast: null,
  }
}

export function freezeHeroBlocked(): HeroDemoState {
  return {
    keys: DEMO_KEYS_SEED.map((k) =>
      k.id === 'k3' ? { ...k, spend: k.cap } : { ...k },
    ),
    enforcerSpend: ENFORCER_CAP,
    enforcerCap: ENFORCER_CAP,
    enforcerKeyId: ENFORCER_KEY_ID,
    blocked: true,
    logs: [
      {
        id: 1,
        model: 'gpt-4o',
        key: 'prod-openai',
        tokens: '1,842',
        cost: 0.042,
        ms: 412,
        status: 'ok',
      },
      {
        id: 2,
        model: 'gpt-4o',
        key: 'prod-openai',
        tokens: '—',
        cost: 0,
        ms: 4,
        status: '429',
      },
    ],
    requests: 1284,
    blockedCount: 13,
    activeKey: null,
    toast: 'HTTP 429 · Budget exceeded',
    nextLogId: 3,
  }
}

/**
 * Apply one traffic event. Pure. Enforcer only charges enforcerKeyId.
 * When over cap → 429 log, no key spend increase, blocked flag set.
 */
export function applyRequest(
  state: HeroDemoState,
  req: DemoRequest,
): { state: HeroDemoState; didBlock: boolean } {
  const hitsEnforcer = req.keyId === state.enforcerKeyId && req.enforcerDelta > 0
  const nextEnf = hitsEnforcer ? state.enforcerSpend + req.enforcerDelta : state.enforcerSpend
  const willBlock = hitsEnforcer && nextEnf > state.enforcerCap
  const logId = state.nextLogId

  if (willBlock) {
    const log: DemoLog = {
      id: logId,
      model: req.model,
      key: req.key,
      tokens: '—',
      cost: 0,
      ms: 4,
      status: '429',
    }
    return {
      didBlock: true,
      state: {
        ...state,
        activeKey: req.keyId,
        blocked: true,
        enforcerSpend: state.enforcerCap,
        blockedCount: state.blockedCount + 1,
        requests: state.requests + 1,
        toast: 'HTTP 429 · Budget exceeded',
        logs: [...state.logs, log].slice(-LOG_SLOTS),
        nextLogId: logId + 1,
      },
    }
  }

  const log: DemoLog = {
    id: logId,
    model: req.model,
    key: req.key,
    tokens: req.tokens,
    cost: req.cost,
    ms: req.ms,
    status: 'ok',
  }

  return {
    didBlock: false,
    state: {
      ...state,
      activeKey: req.keyId,
      enforcerSpend: hitsEnforcer ? Math.min(state.enforcerCap, nextEnf) : state.enforcerSpend,
      requests: state.requests + 1,
      keys: state.keys.map((k) =>
        k.id === req.keyId
          ? { ...k, spend: Math.min(k.cap, k.spend + req.keyDelta) }
          : k,
      ),
      logs: [...state.logs, log].slice(-LOG_SLOTS),
      nextLogId: logId + 1,
    },
  }
}

export function workspaceSpend(keys: DemoKey[]): number {
  return keys.reduce((s, k) => s + k.spend, 0)
}

/* ── Control unit (section 03) ─────────────────────────────── */

export type ControlKey = DemoKey & { status: DemoKeyStatus }

export const CONTROL_SPENDS_START = [1240, 890, 186] as const
export const CONTROL_SPENDS_FROZEN = [1820, 1410, 500] as const

export const CONTROL_BUMPS: Array<{ id: string; add: number }> = [
  { id: 'k1', add: 120 },
  { id: 'k2', add: 95 },
  { id: 'k3', add: 140 },
  { id: 'k1', add: 80 },
  { id: 'k3', add: 90 },
]

export function controlKeysFromSpends(spends: readonly number[]): ControlKey[] {
  return DEMO_KEYS_SEED.map((k, i) => {
    const spend = spends[i] ?? k.spend
    return { ...k, spend, status: keyStatus(spend, k.cap) }
  })
}

export function applyControlBump(keys: ControlKey[], id: string, add: number): ControlKey[] {
  return keys.map((k) => {
    if (k.id !== id) return k
    const spend = Math.min(k.cap, k.spend + add)
    return { ...k, spend, status: keyStatus(spend, k.cap) }
  })
}

export function blockControlKey(keys: ControlKey[], id: string): ControlKey[] {
  return keys.map((k) =>
    k.id === id ? { ...k, spend: k.cap, status: 'blocked' as const } : k,
  )
}
