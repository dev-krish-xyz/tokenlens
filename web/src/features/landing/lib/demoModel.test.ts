import { describe, expect, test } from 'bun:test'
import {
  applyRequest,
  createHeroState,
  DEMO_TRAFFIC,
  ENFORCER_CAP,
  softResetHero,
  keyStatus,
  applyControlBump,
  controlKeysFromSpends,
  CONTROL_SPENDS_START,
} from './demoModel.ts'

describe('demoModel', () => {
  test('applyRequest accrues enforcer only for enforcer key', () => {
    const start = createHeroState()
    const anthropic = DEMO_TRAFFIC.find((t) => t.keyId === 'k2')!
    const { state, didBlock } = applyRequest(start, anthropic)
    expect(didBlock).toBe(false)
    expect(state.enforcerSpend).toBe(start.enforcerSpend)
    expect(state.keys.find((k) => k.id === 'k2')!.spend).toBeGreaterThan(
      start.keys.find((k) => k.id === 'k2')!.spend,
    )
  })

  test('applyRequest blocks when enforcer would exceed cap', () => {
    let state = createHeroState({ enforcerSpend: ENFORCER_CAP - 0.5 })
    const openai = DEMO_TRAFFIC.find((t) => t.keyId === 'k1' && t.enforcerDelta > 0.5)!
    const result = applyRequest(state, openai)
    expect(result.didBlock).toBe(true)
    expect(result.state.blocked).toBe(true)
    expect(result.state.enforcerSpend).toBe(ENFORCER_CAP)
    expect(result.state.logs.at(-1)?.status).toBe('429')
    expect(result.state.logs.at(-1)?.cost).toBe(0)
  })

  test('softReset restores keys and enforcer without wiping counters', () => {
    const s = createHeroState({ requests: 2000, blockedCount: 40, blocked: true })
    const next = softResetHero(s)
    expect(next.blocked).toBe(false)
    expect(next.requests).toBe(2000)
    expect(next.blockedCount).toBe(40)
  })

  test('keyStatus thresholds', () => {
    expect(keyStatus(50, 100)).toBe('ok')
    expect(keyStatus(90, 100)).toBe('near')
    expect(keyStatus(100, 100)).toBe('blocked')
  })

  test('control bumps use shared seed ids', () => {
    const keys = controlKeysFromSpends(CONTROL_SPENDS_START)
    const next = applyControlBump(keys, 'k3', 200)
    expect(next.find((k) => k.id === 'k3')!.spend).toBe(386)
  })
})
