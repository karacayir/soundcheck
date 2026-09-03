import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { band, concerts } from '@/content'
import { CrumbBar, Foot, Masthead, Page } from '@/app/Shell'
import { Eyebrow, SectionHead, Tag } from '@/design/primitives'

export function BandsScreen() {
  const bands = [band]

  return (
    <>
      <Masthead>
        <Eyebrow>
          <span>Soundcheck</span>
          <span>Directory</span>
        </Eyebrow>
        <h1 className="sc-display m-0 text-[clamp(30px,5.4vw,46px)]">Bands</h1>
        <p className="sc-prose m-0 max-w-[52ch] !text-[18px]">
          Every band with a setlist in here. Pick one to see its concerts.
        </p>
      </Masthead>

      <CrumbBar crumbs={[{ label: 'Soundcheck', to: '/' }, { label: 'Bands' }]} />

      <Page className="pt-12">
        <SectionHead num="01" title="All bands">
          Adding another is a folder and a <code className="font-mono text-[0.9em]">band.yaml</code>.
        </SectionHead>

        <div className="flex flex-col gap-2">
          {bands.map((b) => (
            <Link
              key={b.slug}
              to={`/bands/${b.slug}`}
              className="group flex items-center gap-4 border border-line bg-panel px-5 py-5 transition-colors hover:border-accent"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="m-0 text-[19px] font-semibold tracking-[-0.02em]">{b.name}</h3>
                  <Tag>{b.members.length} members</Tag>
                  <Tag tone="accent">
                    {concerts.length} concert{concerts.length === 1 ? '' : 's'}
                  </Tag>
                </div>
                <p className="sc-prose m-0 mt-1 !text-[15.5px]">{b.tagline}</p>
                <p className="sc-num mt-2.5 text-[11px] text-muted">
                  {b.members.map((m) => m.name).join(' · ')}
                </p>
              </div>
              <ArrowRight
                size={16}
                strokeWidth={1.75}
                className="shrink-0 text-line transition-all group-hover:translate-x-0.5 group-hover:text-accent"
              />
            </Link>
          ))}
        </div>
      </Page>

      <Foot />
    </>
  )
}
