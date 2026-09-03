import { ArrowRight, CalendarDays } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { band, concerts, roleById, setlistItems } from '@/content'
import { Page, PageHead, TopBar } from '@/app/Shell'
import { Chip, SectionHead, Stats } from '@/design/primitives'
import { NotFound } from './NotFound'

export function BandScreen() {
  const { bandSlug } = useParams()
  if (bandSlug !== band.slug) return <NotFound />

  const roster = band.roles.map((role) => ({
    role,
    members: band.members.filter((m) => m.roles.includes(role.id)),
  }))

  return (
    <>
      <TopBar back="/bands" backLabel="Bands" title={band.name} />

      <Page>
        <PageHead
          title={band.name}
          lead={band.tagline}
          kicker={
            <>
              <span>{band.members.length} members</span>
              <span className="text-ink-3/50">·</span>
              <span>
                {concerts.length} concert{concerts.length === 1 ? '' : 's'}
              </span>
            </>
          }
        />

        <section className="pb-12">
          <SectionHead title="Shows">
            Each show keeps its own running order and its own lineup.
          </SectionHead>

          <div className="flex flex-col gap-3">
            {concerts.map((concert) => {
              const items = setlistItems(concert)
              const count = items.filter((i) => i.kind === 'song').length
              const breaks = items.length - count
              return (
                <Link
                  key={concert.slug}
                  to={`/bands/${band.slug}/${concert.slug}`}
                  className="sc-card sc-card-hover group flex items-center gap-4 p-5"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <CalendarDays size={19} strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="m-0 text-[18px] font-bold">{concert.title}</h3>
                      {concert.date ? <Chip>{concert.date}</Chip> : <Chip>Date to be confirmed</Chip>}
                    </div>
                    <p className="m-0 mt-0.5 text-[14px] text-ink-2">
                      {count} songs
                      {breaks > 0 && `, ${breaks} break`}
                      {concert.venue && ` · ${concert.venue}`}
                    </p>
                  </div>
                  <ArrowRight
                    size={18}
                    strokeWidth={2}
                    className="shrink-0 text-ink-3 transition-transform duration-200 ease-[var(--ease-smooth)] group-hover:translate-x-0.5"
                  />
                </Link>
              )
            })}
          </div>
        </section>

        <section>
          <SectionHead title="The band">Who can cover what. Lineups are set per show.</SectionHead>

          <div
            className="mb-3 grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}
          >
            {roster.map(({ role, members }) => (
              <div key={role.id} className="sc-card p-4">
                <div className="mb-2.5 text-[13px] font-bold text-accent">
                  {roleById.get(role.id)?.label ?? role.id}
                </div>
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                  {members.map((m) => (
                    <li key={m.id} className="sc-tight text-[15px] font-medium">
                      {m.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Stats
            items={[
              { label: 'Members', value: band.members.length },
              { label: 'Roles', value: band.roles.length },
              { label: 'Shows', value: concerts.length },
            ]}
          />
        </section>
      </Page>
    </>
  )
}
