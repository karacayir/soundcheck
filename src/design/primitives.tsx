import { X } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useEffect } from 'react'

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

/* --------------------------------------------------------------- buttons -- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'solid' | 'outline' | 'ghost' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  active?: boolean
}

const SIZES = {
  sm: 'h-8 px-3 text-2xs tracking-[0.09em] uppercase gap-1.5',
  md: 'h-10 px-4 text-xs tracking-[0.07em] uppercase gap-2',
  lg: 'h-12 px-6 text-sm tracking-[0.05em] uppercase gap-2',
} as const

export function Button({
  variant = 'outline',
  size = 'md',
  active = false,
  className,
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-md font-medium select-none ' +
    'transition-all duration-150 ease-[var(--ease-out-quick)] active:scale-[0.98] ' +
    'disabled:pointer-events-none disabled:opacity-30'

  const variants = {
    solid: 'bg-fg text-bg hover:opacity-90',
    accent: 'bg-accent text-accent-fg hover:brightness-105',
    outline: active
      ? 'border border-accent bg-accent text-accent-fg'
      : 'border border-line bg-surface text-fg hover:border-line-2 hover:bg-surface-2',
    ghost: active ? 'bg-surface-2 text-fg' : 'text-muted hover:bg-surface hover:text-fg',
  } as const

  return <button type="button" className={cx(base, SIZES[size], variants[variant], className)} {...rest} />
}

export function IconButton({
  className,
  active,
  tone = 'default',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean
  tone?: 'default' | 'accent'
}) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-md border',
        'transition-all duration-150 ease-[var(--ease-out-quick)] active:scale-[0.94]',
        'disabled:pointer-events-none disabled:opacity-25',
        active
          ? tone === 'accent'
            ? 'border-accent bg-accent text-accent-fg'
            : 'border-fg bg-fg text-bg'
          : 'border-line bg-surface text-muted hover:border-line-2 hover:bg-surface-2 hover:text-fg',
        className,
      )}
      {...rest}
    />
  )
}

/** Two or more mutually exclusive options in one enclosure. */
export function SegmentedControl<T extends string>({
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
    <div
      role="tablist"
      className={cx('grid gap-1 rounded-lg border border-line bg-surface p-1', className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
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
              'flex h-9 items-center justify-center gap-2 rounded-md text-xs font-medium',
              'tracking-[0.07em] uppercase transition-all duration-150 ease-[var(--ease-out-quick)]',
              selected
                ? 'bg-fg text-bg shadow-sm'
                : 'text-muted hover:bg-surface-2 hover:text-fg',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/* ----------------------------------------------------------------- chips -- */

export function Chip({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode
  tone?: 'default' | 'accent' | 'solid' | 'quiet'
  className?: string
}) {
  const tones = {
    default: 'border-line bg-surface-2 text-fg',
    accent: 'border-accent/40 bg-accent/12 text-accent',
    solid: 'border-fg bg-fg text-bg',
    quiet: 'border-transparent bg-surface-2 text-muted',
  } as const
  return (
    <span
      className={cx(
        'inline-flex h-6 items-center gap-1 rounded-sm border px-2 text-2xs font-medium',
        'tracking-[0.02em] whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** A small filled dot that breathes while something is live. */
export function LiveDot({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={cx(
        'block size-1.5 rounded-full transition-colors',
        active ? 'bg-accent' : 'bg-dim',
      )}
      style={active ? { animation: 'sc-pulse 1.6s ease-in-out infinite' } : undefined}
    />
  )
}

/* --------------------------------------------------------------- layout -- */

export function Field({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cx('flex min-w-0 flex-col gap-2', className)}>
      <Label>{label}</Label>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** Value with −/+ on either side. Tapping the value resets it. */
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
  /** Optional extra segment welded onto the right-hand end. */
  trailing?: ReactNode
}) {
  const arrow =
    'flex w-7 items-center justify-center text-base text-muted transition-colors ' +
    'hover:bg-surface-2 hover:text-fg disabled:opacity-20 disabled:hover:bg-transparent'

  return (
    <div
      className={cx(
        'inline-flex h-10 items-stretch overflow-hidden rounded-md border bg-surface',
        highlight ? 'border-accent/50' : 'border-line',
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
          'sc-num flex min-w-12 items-center justify-center border-x px-2 text-base font-medium',
          highlight ? 'border-accent/30 text-accent' : 'border-line text-fg',
          onReset ? 'hover:bg-surface-2' : 'cursor-default',
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

/** Bottom sheet. Escape and backdrop both close it. */
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
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        style={{ animation: 'sc-rise 180ms var(--ease-out-quick)' }}
      />
      <div
        className="safe-b relative max-h-[82vh] overflow-y-auto rounded-t-xl border-t border-line-2 bg-bg"
        style={{ animation: 'sc-rise 240ms var(--ease-spring)' }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-bg/95 px-5 py-4 backdrop-blur">
          <Label>{title}</Label>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted transition-colors hover:text-fg"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line px-5 py-10 text-center text-sm text-muted">
      {children}
    </div>
  )
}
