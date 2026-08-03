import type { Transition, Variants } from 'framer-motion'

export const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1]

export const fadeUp = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: easeOutExpo, delay },
  },
})

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOutExpo },
  },
}

export const springSoft: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 32,
}

export const lineReveal: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easeOutExpo },
  },
}
