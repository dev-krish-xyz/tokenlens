'use client'

import { useEffect, useState, type RefObject } from 'react'
import {
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'

const TILTED_SHADOW =
  '0 1px 0 rgba(255,255,255,0.7) inset, 0 1px 1px rgba(0,0,0,0.04), 0 16px 32px -8px rgba(15,23,42,0.14), 0 36px 64px -16px rgba(15,23,42,0.18), 0 56px 90px -24px rgba(15,23,42,0.14)'
const FLAT_SHADOW =
  '0 1px 0 rgba(255,255,255,0.7) inset, 0 1px 1px rgba(0,0,0,0.04), 0 8px 20px -6px rgba(15,23,42,0.08), 0 16px 32px -12px rgba(15,23,42,0.08)'
const STATIC_SHADOW = '0 1px 1px rgba(0,0,0,0.04), 0 12px 32px -12px rgba(15,23,42,0.1)'

export type ScrollFlatten = {
  enable3d: boolean
  rotateX: MotionValue<number> | number
  scale: MotionValue<number> | number
  boxShadow: MotionValue<string> | string
  glowOpacity: MotionValue<number>
}

/** Desktop scroll-linked 3D tilt → flat. Mobile / reduced-motion stay flat. */
export function useScrollFlatten(target: RefObject<HTMLElement | null>): ScrollFlatten {
  const reduce = useReducedMotion()
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const apply = () => setIsDesktop(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const { scrollYProgress } = useScroll({
    target,
    offset: ['start 0.92', 'start 0.22'],
  })

  const enable3d = isDesktop && !reduce
  const rotateXRaw = useTransform(scrollYProgress, [0, 1], [12, 0])
  const scaleRaw = useTransform(scrollYProgress, [0, 1], [0.98, 1])
  const rotateX = useSpring(rotateXRaw, { stiffness: 80, damping: 26, mass: 0.55 })
  const scale = useSpring(scaleRaw, { stiffness: 80, damping: 26, mass: 0.55 })
  const boxShadow = useTransform(scrollYProgress, [0, 1], [TILTED_SHADOW, FLAT_SHADOW])
  const glowOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0])

  return {
    enable3d: !!enable3d,
    rotateX: enable3d ? rotateX : 0,
    scale: enable3d ? scale : 1,
    boxShadow: enable3d ? boxShadow : STATIC_SHADOW,
    glowOpacity,
  }
}
