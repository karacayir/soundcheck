import { ArrowRight, CalendarDays } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { band, concerts, roleById, setlistItems } from '@/content'
import { CrumbBar, Foot, Masthead, Page } from '@/app/Shell'
import { Eyebrow, Facts, SectionHead, Tag } from '@/design/primitives'
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
      <Masthead>
        <Eyebrow>
          <span>Band</span>
          <span>{band.members.length} members</span>
          <span>
            {concerts.length} concert{concerts.length === 1 ? '' : 's'}
          </span>
        </Eyebrow>
        <h1 className="sc-display m-0 text-[clamp(30px,5.4vw,46px)]">{band.name}</h1>
        <p className="sc-prose m-0 max-w-[52ch] !text-[18px]">{band.tagline}</p>
      </Masthead>

      <CrumbBar
        crumbs={[
          { label: 'Soundcheck', to: '/' },
          { label: 'Bands', to: '/bands' },
          { label: band.name },
        ]}
      />

      <Page className="pt-12">
        <section>
          <SectionHead num="01" tag="Upcoming" tagTone="accent" title="Concerts">
            Each concert holds its own running order and its own lineup — the personnel change
            song to song and show to show.
          </SectionHead>

          <div className="flex flex-col gap-2">
            {concerts.map((concert) => {
              const items = setlistItems(concert)
              const count = items.filter((i) => i.kind === 'song').length
              const breaks = items.length - count
              return (
                <Link
                  key={concert.slug}
                  to={`/bands/${band.slug}/${concert.slug}`}
                  className="group flex items-center gap-4 border border-line bg-panel px-5 py-5 transition-colors hover:border-accent"
                >
                  <CalendarDays size={17} strokeWidth={1.6} className="shrink-0 text-accent" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="m-0 text-[19px] font-semibold tracking-[-0.02em]">
                        {concert.title}
                      </h3>
                      {concert.date ? <Tag>{concert.date}</Tag> : <Tag>Date TBC</Tag>}
                    </div>
                    <p className="sc-num mt-1.5 text-[11px] text-muted">
                      {count} songs
                      {breaks > 0 && ` · ${breaks} break`}
                      {concert.venue && ` · ${concert.venue}`}
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    strokeWidth={1.75}
                    className="shrink-0 text-line transition-all group-hover:translate-x-0.5 group-hover:text-accent"
                  />
                </Link>
              )
            })}
          </div>
        </section>

        <section className="pt-14">
          <SectionHead num="02" title="The roster">
            Who can cover what. The lineup for any given song is set per concert.
          </SectionHead>

          <div className="sc-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
            {roster.map(({ role, members }) => (
              <div key={role.id} className="bg-panel px-4 py-4">
                <div className="sc-label mb-2.5">
                  {roleById.get(role.id)?.label ?? role.id}
                  <span className="ml-1.5 text-line">{role.slots}</span>
                </div>
                <ul className="m-0 flex list-none flex-col gap-1 p-0">
                  {members.map((m) => (
                    <li key={m.id} className="text-[15px] font-medium tracking-[-0.01em]">
                      {m.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <Facts
              items={[
                { label: 'Members', value: band.members.length },
                { label: 'Roles', value: band.roles.length },
                { label: 'Concerts', value: concerts.length },
              ]}
            />
          </div>
        </section>
      </Page>

      <Foot />
    </>
  )
}
