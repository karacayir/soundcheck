import { ChevronRight, Moon, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cx } from '@/design/primitives'
import { effectiveTheme, setPrefs, usePrefs } from '@/features/session/prefs'

export interface Crumb {
  label: string
  to?: string
}

/**
 * The masthead: panel-backed, hairline-ruled, and the same on every page so
 * the app reads as one document rather than a stack of screens.
 */
export function Masthead({ children }: { children: ReactNode }) {
  return (
    <header className="border-b border-line bg-panel safe-t">
      <div className="mx-auto flex max-w-[880px] flex-col gap-4 px-6 pt-10 pb-7">{children}</div>
    </header>
  )
}

/** Sticky breadcrumb rail. Blurred paper, one hairline, theme toggle on the end. */
export function CrumbBar({ crumbs }: { crumbs: Crumb[] }) {
  const { theme } = usePrefs()
  const showing = effectiveTheme(theme)

  return (
    <nav className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur-[10px]">
      <div className="mx-auto flex max-w-[880px] items-center gap-2 px-6 py-2">
        <ol className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {crumbs.map((crumb, i) => (
            <li key={`${crumb.label}-${i}`} className="flex shrink-0 items-center gap-1.5">
              {i > 0 && <ChevronRight size={11} strokeWidth={2} className="text-line" />}
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="rounded-xs px-1.5 py-1 font-mono text-[11px] font-medium tracking-[0.04em] text-muted transition-colors hover:bg-sunk hover:text-ink"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="px-1.5 py-1 font-mono text-[11px] font-medium tracking-[0.04em] text-accent">
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
        <button
          type="button"
          aria-label={showing === 'dark' ? 'Switch to light' : 'Switch to dark'}
          onClick={() => setPrefs({ theme: showing === 'dark' ? 'light' : 'dark' })}
          className="flex size-7 shrink-0 items-center justify-center rounded-xs border border-line bg-panel text-muted transition-colors hover:border-accent hover:text-accent"
        >
          {showing === 'dark' ? <Sun size={13} strokeWidth={1.75} /> : <Moon size={13} strokeWidth={1.75} />}
        </button>
      </div>
    </nav>
  )
}

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={cx('mx-auto max-w-[880px] px-6 pb-28', className)}>{children}</main>
  )
}

export function Foot() {
  return (
    <footer className="mx-auto max-w-[880px] px-6 pb-16">
      <div className="border-t border-line pt-5 font-mono text-[11px] leading-[1.7] text-muted">
        Soundcheck v{__APP_VERSION__} — setlists, lyrics and charts for the stand.
        <br />
        Content lives in <code className="bg-sunk px-1 py-0.5 text-ink">content/</code> as plain
        YAML. Works offline once opened.
      </div>
    </footer>
  )
}
