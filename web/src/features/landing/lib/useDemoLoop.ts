'use client'

import { useEffect, type MutableRefObject } from 'react'

export type DemoLoopApi = {
  /** Resolves after ms, or immediately if cancelled mid-wait. */
  wait: (ms: number) => Promise<void>
  cancelled: () => boolean
  /** Spin until unpaused (or cancelled). */
  waitWhilePaused: () => Promise<void>
}

type Options = {
  /** When true, skip the loop and call onReduce once. */
  reduce: boolean | null | undefined
  /** Optional external pause signal (e.g. off-screen). */
  pausedRef?: MutableRefObject<boolean>
  onReduce?: () => void
  /** When false, do not run (in addition to reduce). Default true. */
  enabled?: boolean
}

/**
 * Canonical async demo loop for landing theaters.
 * Handles cancel, pause polling, and reduced-motion freeze.
 */
export function useDemoLoop(
  script: (api: DemoLoopApi) => Promise<void>,
  deps: readonly unknown[],
  { reduce, pausedRef, onReduce, enabled = true }: Options,
): void {
  useEffect(() => {
    if (!enabled) return

    if (reduce) {
      onReduce?.()
      return
    }

    let cancelled = false
    let timer: number | undefined

    const clear = () => {
      if (timer !== undefined) {
        window.clearTimeout(timer)
        timer = undefined
      }
    }

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        clear()
        timer = window.setTimeout(() => {
          timer = undefined
          resolve()
        }, ms)
      })

    const waitWhilePaused = async () => {
      while (!cancelled && pausedRef?.current) {
        await wait(400)
      }
    }

    const api: DemoLoopApi = {
      wait,
      cancelled: () => cancelled,
      waitWhilePaused,
    }

    // Script owns its own cycle loop; hook only provides wait/cancel/pause.
    void script(api)

    return () => {
      cancelled = true
      clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller owns deps
  }, [reduce, enabled, ...deps])
}
