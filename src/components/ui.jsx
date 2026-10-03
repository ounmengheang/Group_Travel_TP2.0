// Small layout primitives shared by every screen.

const BUTTON_STYLES = {
  primary: 'bg-brand-500 text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600',
  secondary: 'bg-slate-100 text-ink hover:bg-slate-200',
  danger: 'bg-rose-500 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-600',
  ghost: 'text-brand-600 hover:bg-brand-50',
}

export function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${BUTTON_STYLES[variant]} ${className}`}
      {...props}
    />
  )
}

export function Card({ className = '', ...props }) {
  return <div className={`rounded-3xl border border-slate-100 bg-white p-5 shadow-card ${className}`} {...props} />
}

// Screen wrapper: scrollable body + optional sticky footer CTA.
export function Screen({ children, footer }) {
  return (
    <div className="flex min-h-full animate-fade-up flex-col">
      <div className="flex-1 space-y-4 px-5 pb-6 pt-5">{children}</div>
      {footer && (
        <div className="sticky bottom-0 z-10 space-y-2 border-t border-slate-100 bg-white/95 px-5 pb-6 pt-3 backdrop-blur">
          {footer}
        </div>
      )}
    </div>
  )
}

export function ScreenTitle({ eyebrow, title, subtitle }) {
  return (
    <div className="space-y-1.5 pb-1">
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{eyebrow}</p>}
      <h1 className="text-[26px] font-bold leading-tight tracking-tight">{title}</h1>
      {subtitle && <p className="text-[15px] leading-relaxed text-muted">{subtitle}</p>}
    </div>
  )
}

export function ProgressBar({ value, max, dark = false }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0
  const full = value >= max
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full ${dark ? 'bg-white/15' : 'bg-slate-100'}`}>
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${dark ? (full ? 'bg-brand-200' : 'bg-white') : 'bg-brand-500'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function Caption({ children }) {
  return <p className="text-center text-xs text-muted">{children}</p>
}
