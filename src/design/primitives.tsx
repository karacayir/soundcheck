import { X } from 'lucide-react'
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/* ------------------------------------------------------------------ text -- */

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('sc-eyebrow flex flex-wrap items-baseline gap-x-3.5 gap-y-2', className)}>
      {children}
    </div>
  )
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('sc-label', className)}>{children}</div>
}

export function Num({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('sc-num', className)}>{children}</span>
}

export function Tag({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode
  tone?: 'default' | 'accent' | 'ok' | 'warm'
  className?: string
}) {
  const tones = {
    default: '',
    accent: 'sc-tag-accent',
    ok: '!border-ok !text-ok',
    warm: '!border-warm !text-warm',
  } as const
  return <span className={cx('sc-tag', tones[tone], className)}>{children}</span>
}

/**
 * Masthead section heading: mono number, optional tag, headline, serif standfirst,
 * all sitting on a heavy ink rule.
 */
export function SectionHead({
  num,
  tag,
  tagTone,
  title,
  children,
  action,
}: {
  num?: string
  tag?: string
  tagTone?: 'default' | 'accent' | 'ok' | 'warm'
  title: ReactNode
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="sc-rule mb-6 flex items-start gap-4 pb-3.5">
      {num && <div className="sc-num pt-1.5 text-xs font-bold tracking-[0.06em] text-accent">{num}</div>}
      <div className="min-w-0 flex-1">
        {tag && (
          <div className="mb-2">
            <Tag tone={tagTone}>{tag}</Tag>
          </div>
        )}
        <h2 className="sc-display m-0 text-[clamp(20px,3vw,27px)] !leading-[1.12] !tracking-[-0.022em]">
          {title}
        </h2>
        {children && <p className="sc-prose mt-1.5 !text-[16px] !text-muted">{children}</p>}
      </div>
      {action && <div className="shrink-0 pt-1">{action}</div>}
    </div>
  )
}

/** The hairline fact grid from the masthead: label over value. */
export function Facts({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl
      className="sc-grid m-0"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}
    >
      {items.map((item) => (
        <div key={item.label} className="bg-panel px-3.5 py-3">
          <dt className="sc-label mb-1">{item.label}</dt>
          <dd className="sc-num m-0 text-[15px] font-semibold tracking-[-0.01em]">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/* --------------------------------------------------------------- buttons -- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'outline' | 'solid' | 'ghost'
  size?: 'sm' | 'md'
  active?: boolean
}

export function Button({
  variant = 'outline',
  size = 'md',
  active = false,
  className,
  ...rest
}: ButtonProps) {
  const sizes = {
    sm: 'h-7 px-2.5 text-[10px] tracking-[0.08em]',
    md: 'h-9 px-3.5 text-[11px] tracking-[0.06em]',
  } as const

  const variants = {
    outline: active
      ? 'border-accent bg-accent-wash text-accent'
      : 'border-line bg-panel text-ink-soft hover:border-accent hover:text-accent',
    solid: 'border-accent bg-accent text-white hover:brightness-110',
    ghost: active
      ? 'border-transparent bg-sunk text-ink'
      : 'border-transparent text-muted hover:bg-sunk hover:text-ink',
  } as const

  return (
    <button
      type="button"
      className={cx(
        'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xs border font-mono',
        'font-medium uppercase transition-colors duration-150',
        'disabled:pointer-events-none disabled:opacity-35',
        sizes[size],
        variants[variant],
        className,
      )}
      {...rest}
    />
  )
}

export function IconButton({
  className,
  active,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-xs border transition-colors',
        'duration-150 disabled:pointer-events-none disabled:opacity-30',
        active
          ? 'border-accent bg-accent text-white'
          : 'border-line bg-panel text-muted hover:border-accent hover:text-accent',
        className,
      )}
      {...rest}
    />
  )
}

/** Mono pill row — used for the lyrics/chart switch and mixer options. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: T; label: ReactNode }>
  value: T
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div role="tablist" className={cx('flex gap-1.5', className)}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cx(
              'flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xs border font-mono',
              'text-[11px] font-medium tracking-[0.06em] uppercase transition-colors duration-150',
              selected
                ? 'border-accent bg-accent text-white'
                : 'border-line bg-panel text-muted hover:border-accent hover:text-accent',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/* ---------------------------------------------------------------- blocks -- */

/** Accent-washed aside, for cues and anything the band must not miss. */
export function Callout({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="border border-accent/25 bg-accent-wash px-4 py-3.5">
      {title && (
        <h3 className="m-0 mb-2 font-mono text-[12px] font-bold tracking-[0.08em] text-accent-ink uppercase">
          {title}
        </h3>
      )}
      <div className="sc-prose !text-[16px]">{children}</div>
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="border border-dashed border-line px-5 py-10 text-center">
      <div className="sc-prose !text-[16px] !text-muted">{children}</div>
    </div>
  )
}

export function Stepper({
  value,
  onDecrease,
  onIncrease,
  onReset,
  canDecrease = true,
  canIncrease = true,
  decreaseLabel,
  increaseLabel,
  highlight = false,
  trailing,
}: {
  value: ReactNode
  onDecrease: () => void
  onIncrease: () => void
  onReset?: () => void
  canDecrease?: boolean
  canIncrease?: boolean
  decreaseLabel: string
  increaseLabel: string
  highlight?: boolean
  trailing?: ReactNode
}) {
  const arrow =
    'flex w-7 items-center justify-center text-base text-muted transition-colors ' +
    'hover:bg-sunk hover:text-ink disabled:opacity-20 disabled:hover:bg-transparent'

  return (
    <div
      className={cx(
        'inline-flex h-9 items-stretch overflow-hidden rounded-xs border bg-panel',
        highlight ? 'border-accent' : 'border-line',
      )}
    >
      <button type="button" aria-label={decreaseLabel} disabled={!canDecrease} onClick={onDecrease} className={arrow}>
        −
      </button>
      <button
        type="button"
        onClick={onReset}
        disabled={!onReset}
        title={onReset ? 'Reset' : undefined}
        className={cx(
          'sc-num flex min-w-12 items-center justify-center border-x px-2 text-[15px] font-semibold',
          highlight ? 'border-accent/40 text-accent' : 'border-line text-ink',
          onReset ? 'hover:bg-sunk' : 'cursor-default',
        )}
      >
        {value}
      </button>
      <button type="button" aria-label={increaseLabel} disabled={!canIncrease} onClick={onIncrease} className={arrow}>
        +
      </button>
      {trailing}
    </div>
  )
}

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:p-6">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/40" />
      <div className="sc-shadow relative mx-auto max-h-[82vh] w-full max-w-lg overflow-y-auto border border-line bg-panel">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-panel px-5 py-3.5">
          <Label>{title}</Label>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-ink">
            <X size={15} strokeWidth={2} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}
