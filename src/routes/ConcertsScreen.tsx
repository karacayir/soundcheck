import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { band, concerts, setlistItems } from '@/content'
import { Empty, Label, Num } from '@/design/primitives'

export function ConcertsScreen() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-16 safe-t">
      <header className="pt-12 pb-8">
        <Label>{band.tagline ?? 'Soundcheck'}</Label>
        <h1 className="sc-display mt-3 text-4xl">{band.name}</h1>
      </header>

      <div className="flex flex-col gap-2">
        {concerts.length === 0 ? (
          <Empty>No concerts yet.</Empty>
        ) : (
          concerts.map((concert) => {
            const songs = setlistItems(concert).filter((i) => i.kind === 'song').length
            return (
              <Link
                key={concert.slug}
                to={`/${band.slug}/${concert.slug}`}
                className="group flex items-center justify-between gap-4 rounded-lg border border-line bg-surface px-4 py-4 transition-all duration-150 ease-[var(--ease-out-quick)] hover:border-line-2 hover:bg-surface-2"
              >
                <div className="min-w-0">
                  <h2 className="sc-tight truncate text-base font-medium">{concert.title}</h2>
                  <p className="mt-1 text-xs text-muted">
                    <Num>{songs}</Num> songs
                    {concert.venue && <> · {concert.venue}</>}
                  </p>
                </div>
                <ArrowRight
                  size={15}
                  strokeWidth={1.75}
                  className="shrink-0 text-dim transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-fg"
                />
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
