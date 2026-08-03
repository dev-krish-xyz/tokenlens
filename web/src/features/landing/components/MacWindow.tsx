import type { ReactNode } from 'react'

/**
 * Shared Mac-style window chrome for landing demos.
 * Visual shell only — no animation or demo logic.
 */
export function MacWindow({
  title,
  titleExtra,
  footer,
  children,
  className = '',
  bodyClassName = '',
  tone = 'light',
}: {
  title?: ReactNode
  titleExtra?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  /** `dark` = IDE chrome for code stage */
  tone?: 'light' | 'dark'
}) {
  const titleColor = tone === 'dark' ? 'text-white/45' : 'text-[#6B6B6B]'

  return (
    <div className={`lp-mac ${tone === 'dark' ? 'lp-mac-dark' : ''} ${className}`}>
      <div className="lp-mac-titlebar">
        <div className="lp-mac-lights" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        {title != null && (
          <div className="lp-mac-title">
            {typeof title === 'string' ? (
              <span className={`lp-mono text-[11px] font-medium ${titleColor}`}>{title}</span>
            ) : (
              title
            )}
          </div>
        )}
        {titleExtra != null && <div className="relative z-10 ml-auto">{titleExtra}</div>}
      </div>
      <div className={bodyClassName}>{children}</div>
      {footer != null && <div className="lp-mac-footer">{footer}</div>}
    </div>
  )
}
