import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { band, concerts, songs } from '@/content'
import { Logo, Page, PageHead, TopBar } from '@/app/Shell'
import { Chip } from '@/design/primitives'

export function BandsScreen() {
  const bands = [band]
  const songCount = Object.keys(songs).length

  return (
    <>
      <TopBar back="/" backLabel="Home" title="Bands" />

      <Page>
        <PageHead title="Bands" lead="Every band with a setlist here. Pick one to see its shows." />

        <div className="flex flex-col gap-3">
          {bands.map((b) => (
            <Link
              key={b.slug}
              to={`/bands/${b.slug}`}
              className="sc-card sc-card-hover group flex items-center gap-4 p-5"
            >
              <Logo className="!size-12 !rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="sc-tight m-0 text-[19px] font-bold">{b.name}</h2>
                  <Chip tone="accent">
                    {concerts.length} concert{concerts.length === 1 ? '' : 's'}
                  </Chip>
                </div>
                <p className="m-0 mt-0.5 text-[14px] text-ink-2">
                  {b.members.length} members · {songCount} songs
                </p>
                <p className="mt-2 truncate text-[13px] text-ink-3">
                  {b.members.map((m) => m.name).join(' · ')}
                </p>
              </div>
              <ArrowRight
                size={18}
                strokeWidth={2}
                className="shrink-0 text-ink-3 transition-transform duration-200 ease-[var(--ease-smooth)] group-hover:translate-x-0.5"
              />
            </Link>
          ))}
        </div>
      </Page>
    </>
  )
}
