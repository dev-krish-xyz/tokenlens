import { useId, type CSSProperties } from 'react'

type Props = {
  /** Rendered size in px (square). Default 28. */
  size?: number
  className?: string
  style?: CSSProperties
  /**
   * `mark` — brackets + orb only (no plate). Use on glass/nav bars.
   * `app` — full app icon with white rounded plate (favicons, marketing tiles).
   */
  variant?: 'mark' | 'app'
  /** Accessible title; omit for decorative use next to visible “TokenLens” text. */
  title?: string
}

/**
 * TokenLens logo.
 * Prefer `variant="mark"` in chrome so no white rectangle sits on the nav background.
 */
export function TokenLensLogo({
  size = 28,
  className,
  style,
  variant = 'mark',
  title,
}: Props) {
  const uid = useId().replace(/:/g, '')
  const plateId = `tl-plate-${uid}`
  const orbId = `tl-orb-${uid}`
  const aria = title ? { role: 'img' as const, 'aria-label': title } : { 'aria-hidden': true as const }

  // Mark crops to the symbol only (no empty plate padding)
  const viewBox = variant === 'app' ? '0 0 512 512' : '100 100 312 312'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      fill="none"
      className={className}
      style={{ display: 'block', flexShrink: 0, ...style }}
      {...aria}
    >
      <defs>
        {variant === 'app' && (
          <linearGradient id={plateId} x1="80" y1="40" x2="430" y2="480" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="0.55" stopColor="#F7F7F8" />
            <stop offset="1" stopColor="#ECECEE" />
          </linearGradient>
        )}
        <linearGradient id={orbId} x1="196" y1="176" x2="328" y2="348" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5AB4FF" />
          <stop offset="0.45" stopColor="#2F7BFF" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>

      {variant === 'app' && (
        <>
          <rect x="28" y="28" width="456" height="456" rx="108" fill={`url(#${plateId})`} />
          <rect
            x="28"
            y="28"
            width="456"
            height="456"
            rx="108"
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="2"
          />
        </>
      )}

      <path
        d="M148 220 V332 C148 368 178 398 214 398 H332"
        stroke="#12141A"
        strokeWidth="46"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M364 292 V180 C364 144 334 114 298 114 H180"
        stroke="#12141A"
        strokeWidth="46"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="256" cy="256" r="62" fill={`url(#${orbId})`} />
      <circle cx="236" cy="232" r="16" fill="rgba(255,255,255,0.35)" />
    </svg>
  )
}
