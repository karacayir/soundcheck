import { X } from 'lucide-react'
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/* ------------------------------------------------------------------ text -- */

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('sc-label', className)}>{children}</div>
}

export function Num({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('sc-num', className)}>{children}</span>
}

/** Soft pill. Replaces the old outlined mono tag. */
export function Chip({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode
  tone?: 'default' | 'accent' | 'solid' | 'warm'
  className?: string
}) {
  const tones = {
    default: 'bg-sunk text-ink-2',
    accent: 'bg-accent-soft text-accent',
    solid: 'bg-accent text-on-accent',
    warm: 'bg-warm/12 text-warm',
  } as const
  return (
    <span
      className={cx(
        'inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[11.5px] font-semibold',
        'whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Section heading. Title, optional supporting line, optional action. */
export function SectionHead({
  title,
  children,
  action,
  className,
}: {
  title: ReactNode
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('mb-4 flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 className="m-0 text-[19px] font-bold">{title}</h2>
        {children && <p className="m-0 mt-1 text-[14px] leading-snug text-ink-2">{children}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/** Rounded stat tiles. Soft cards, not a ruled table. */
export function Stats({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(112px, 1fr))' }}
    >
      {items.map((item) => (
        <div key={item.label} className="sc-card px-3.5 py-3">
          <div className="text-[12px] font-medium text-ink-3">{item.label}</div>
          <div className="sc-num sc-tight mt-0.5 text-[19px] font-bold">{item.value}</div>
        </div>
      ))}
    </div>
  )
}

/* --------------------------------------------------------------- buttons -- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'solid' | 'soft' | 'quiet'
  size?: 'sm' | 'md' | 'lg'
  active?: boolean
}

export function Button({
  variant = 'soft',
  size = 'md',
  active = false,
  className,
  ...rest
}: ButtonProps) {
  const sizes = {
    sm: 'h-8 px-3 text-[13px] gap-1.5',
    md: 'h-10 px-4 text-[14px] gap-2',
    lg: 'h-12 px-5 text-[15px] gap-2',
  } as const

  const variants = {
    solid: 'bg-accent text-on-accent hover:bg-accent-hover sc-sh-md',
    soft: active
      ? 'bg-accent-soft text-accent'
      : 'bg-card text-ink shadow-[var(--sc-sh-sm)] hover:bg-sunk',
    quiet: active ? 'bg-sunk text-ink' : 'text-ink-2 hover:bg-sunk hover:text-ink',
  } as const

  return (
    <button
      type="button"
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        'transition-all duration-200 ease-[var(--ease-smooth)] active:scale-[0.97]',
        'disabled:pointer-events-none disabled:opacity-40',
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
  size = 'md',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full transition-all',
        'duration-200 ease-[var(--ease-smooth)] active:scale-90',
        'disabled:pointer-events-none disabled:opacity-30',
        size === 'sm' ? 'size-8' : 'size-10',
        active
          ? 'bg-accent text-on-accent'
          : 'bg-card text-ink-2 shadow-[var(--sc-sh-sm)] hover:bg-sunk hover:text-ink',
        className,
      )}
      {...rest}
    />
  )
}

/** Sliding-feel segmented control on a sunk track. */
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
    <div role="tablist" className={cx('flex gap-1 rounded-full bg-sunk p-1', className)}>
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
              'flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-[14px]',
              'font-semibold transition-all duration-200 ease-[var(--ease-smooth)]',
              selected
                ? 'bg-card text-ink shadow-[var(--sc-sh-sm)]'
                : 'text-ink-3 hover:text-ink',
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

/** Soft accent aside, for cues and anything the band must not miss. */
export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg bg-accent-soft px-4 py-3.5 text-[15px] leading-snug text-accent">
      {children}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="sc-card px-6 py-12 text-center">
      <div className="mx-auto max-w-[34ch] text-[14.5px] leading-relaxed text-ink-3">
        {children}
      </div>
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
    'flex w-8 items-center justify-center text-[17px] text-ink-3 transition-colors ' +
    'hover:text-ink disabled:opacity-25 disabled:hover:text-ink-3'

  return (
    <div
      className={cx(
        'inline-flex h-10 items-stretch overflow-hidden rounded-full transition-colors',
        highlight ? 'bg-accent-soft' : 'bg-sunk',
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
          'sc-num flex min-w-11 items-center justify-center px-1 text-[16px] font-bold',
          highlight ? 'text-accent' : 'text-ink',
          onReset ? 'hover:opacity-70' : 'cursor-default',
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
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
        style={{ animation: 'sc-fade 200ms var(--ease-smooth)' }}
      />
      <div
        className="sc-sh-lg relative mx-auto max-h-[84vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card sm:rounded-2xl"
        style={{ animation: 'sc-rise 280ms var(--ease-smooth)' }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-card px-5 pt-5 pb-3">
          <h2 className="m-0 text-[17px] font-bold">{title}</h2>
          <IconButton size="sm" onClick={onClose} aria-label="Close">
            <X size={15} strokeWidth={2.25} />
          </IconButton>
        </div>
        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>
  )
}
