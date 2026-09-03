import { ChevronLeft, Moon, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cx } from '@/design/primitives'
import { effectiveTheme, setPrefs, usePrefs } from '@/features/session/prefs'

/**
 * Top bar: a back affordance on the left, a title that appears as you scroll
 * past the page heading, and the theme switch. Floats on a blurred wash of the
 * page rather than sitting in a ruled band.
 */
export function TopBar({
  back,
  backLabel,
  title,
}: {
  back?: string
  backLabel?: string
  title?: string
}) {
  const { theme } = usePrefs()
  const showing = effectiveTheme(theme)

  return (
    <div className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[900px] items-center gap-2 px-5">
        {back ? (
          <Link
            to={back}
            className="group -ml-2 flex items-center gap-1 rounded-full py-1.5 pr-3 pl-2 text-[14px] font-semibold text-ink-2 transition-colors hover:bg-sunk hover:text-ink"
          >
            <ChevronLeft
              size={16}
              strokeWidth={2.25}
              className="transition-transform duration-200 ease-[var(--ease-smooth)] group-hover:-translate-x-0.5"
            />
            {backLabel ?? 'Back'}
          </Link>
        ) : (
          <Link to="/" className="-ml-1 flex items-center gap-2 rounded-full px-2 py-1.5">
            <Logo />
            <span className="sc-tight text-[15px] font-bold">Soundcheck</span>
          </Link>
        )}

        {title && (
          <span className="sc-tight mx-auto hidden truncate text-[14px] font-semibold text-ink-2 sm:block">
            {title}
          </span>
        )}

        <button
          type="button"
          aria-label={showing === 'dark' ? 'Switch to light' : 'Switch to dark'}
          onClick={() => setPrefs({ theme: showing === 'dark' ? 'light' : 'dark' })}
          className="ml-auto flex size-9 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-sunk hover:text-ink"
        >
          {showing === 'dark' ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
        </button>
      </div>
    </div>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'flex size-7 items-center justify-center rounded-lg bg-accent text-on-accent',
        className,
      )}
      aria-hidden
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1" y="5" width="2" height="4" rx="1" fill="currentColor" />
        <rect x="4.5" y="2" width="2" height="10" rx="1" fill="currentColor" />
        <rect x="8" y="0" width="2" height="14" rx="1" fill="currentColor" />
        <rect x="11.5" y="4" width="2" height="6" rx="1" fill="currentColor" />
      </svg>
    </span>
  )
}

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cx('mx-auto max-w-[900px] px-5 pb-24', className)}>{children}</main>
}

/** Big page heading with an optional kicker above and lead paragraph below. */
export function PageHead({
  kicker,
  title,
  lead,
  children,
}: {
  kicker?: ReactNode
  title: ReactNode
  lead?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="pt-6 pb-7">
      {kicker && (
        <div className="mb-2.5 flex flex-wrap items-center gap-2 text-[13px] font-semibold text-ink-3">
          {kicker}
        </div>
      )}
      <h1 className="sc-display m-0 text-[clamp(30px,5.6vw,44px)]">{title}</h1>
      {lead && <p className="mt-3 max-w-[52ch] text-[16.5px] leading-relaxed text-ink-2">{lead}</p>}
      {children && <div className="mt-5">{children}</div>}
    </header>
  )
}

export function Dot() {
  return <span className="text-ink-3/50">·</span>
}
