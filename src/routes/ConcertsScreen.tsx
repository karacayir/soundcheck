import { Link } from 'react-router-dom'
import { band, concerts, setlistItems } from '@/content'
import { Empty, Label, Num } from '@/design/primitives'

export function ConcertsScreen() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 safe-t">
      <header className="pt-10 pb-6">
        <Label>{band.tagline ?? 'Soundcheck'}</Label>
        <h1 className="mt-2 text-2xl leading-none font-semibold sc-tight">{band.name}</h1>
      </header>

      <div className="border-t border-line">
        {concerts.length === 0 ? (
          <Empty>Henüz konser yok.</Empty>
        ) : (
          concerts.map((concert) => {
            const songs = setlistItems(concert).filter((i) => i.kind === 'song').length
            return (
              <Link
                key={concert.slug}
                to={`/${band.slug}/${concert.slug}`}
                className="flex items-center justify-between gap-4 border-b border-line py-5 transition-colors hover:bg-surface"
              >
                <div className="min-w-0">
                  <h2 className="truncate text-base font-medium sc-tight">{concert.title}</h2>
                  <p className="mt-1 text-xs text-muted">
                    <Num>{songs}</Num> şarkı
                    {concert.venue && <> · {concert.venue}</>}
                  </p>
                </div>
                <span aria-hidden className="text-dim">
                  →
                </span>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
