import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

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
  variant?: 'solid' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  active?: boolean
}

const SIZES = {
  sm: 'h-8 px-3 text-2xs tracking-[0.09em] uppercase',
  md: 'h-11 px-4 text-xs tracking-[0.08em] uppercase',
  lg: 'h-14 px-6 text-sm tracking-[0.06em] uppercase',
} as const

export function Button({
  variant = 'outline',
  size = 'md',
  active = false,
  className,
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium select-none ' +
    'transition-colors duration-100 ease-[var(--ease-out-quick)] ' +
    'disabled:opacity-30 disabled:pointer-events-none'

  const variants = {
    solid: 'bg-fg text-bg hover:opacity-90 active:opacity-80',
    outline: active
      ? 'bg-fg text-bg border border-fg'
      : 'border border-line text-fg hover:border-line-strong hover:bg-surface',
    ghost: active ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg hover:bg-surface',
  } as const

  return <button type="button" className={cx(base, SIZES[size], variants[variant], className)} {...rest} />
}

/** A square icon button — the one shape used everywhere in the toolbars. */
export function IconButton({
  className,
  active,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex size-11 shrink-0 items-center justify-center border transition-colors',
        'duration-100 ease-[var(--ease-out-quick)] disabled:opacity-30',
        active ? 'border-fg bg-fg text-bg' : 'border-line text-fg hover:border-line-strong hover:bg-surface',
        className,
      )}
      {...rest}
    />
  )
}

/* ----------------------------------------------------------------- chips -- */

export function Chip({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode
  tone?: 'default' | 'strong' | 'quiet'
  className?: string
}) {
  const tones = {
    default: 'border-line text-fg',
    strong: 'border-fg bg-fg text-bg',
    quiet: 'border-transparent bg-surface-2 text-muted',
  } as const
  return (
    <span
      className={cx(
        'inline-flex h-6 items-center border px-2 text-2xs tracking-[0.04em] whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* --------------------------------------------------------------- layout -- */

export function Rule({ className }: { className?: string }) {
  return <div className={cx('h-px w-full bg-line', className)} />
}

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
    <div className={cx('flex min-w-0 flex-col gap-1.5', className)}>
      <Label>{label}</Label>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** Value with −/+ on either side. Used for key and tempo. */
export function Stepper({
  value,
  onDecrease,
  onIncrease,
  onReset,
  canDecrease = true,
  canIncrease = true,
  decreaseLabel,
  increaseLabel,
}: {
  value: ReactNode
  onDecrease: () => void
  onIncrease: () => void
  onReset?: () => void
  canDecrease?: boolean
  canIncrease?: boolean
  decreaseLabel: string
  increaseLabel: string
}) {
  return (
    <div className="inline-flex h-11 items-stretch border border-line">
      <button
        type="button"
        aria-label={decreaseLabel}
        disabled={!canDecrease}
        onClick={onDecrease}
        className="w-10 text-fg transition-colors hover:bg-surface disabled:opacity-25"
      >
        −
      </button>
      <button
        type="button"
        onClick={onReset}
        disabled={!onReset}
        className={cx(
          'sc-num flex min-w-14 items-center justify-center border-x border-line px-2 text-base',
          onReset ? 'hover:bg-surface' : 'cursor-default',
        )}
        title={onReset ? 'Sıfırla' : undefined}
      >
        {value}
      </button>
      <button
        type="button"
        aria-label={increaseLabel}
        disabled={!canIncrease}
        onClick={onIncrease}
        className="w-10 text-fg transition-colors hover:bg-surface disabled:opacity-25"
      >
        +
      </button>
    </div>
  )
}

/** Bottom sheet. Square, hairline top border, no rounded corners anywhere. */
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
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Kapat"
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />
      <div className="safe-b relative max-h-[80vh] overflow-y-auto border-t border-line-strong bg-bg">
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-bg px-4 py-3">
          <Label>{title}</Label>
          <button type="button" onClick={onClose} className="text-muted hover:text-fg" aria-label="Kapat">
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

export function Empty({ children }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
      {children}
    </div>
  )
}
