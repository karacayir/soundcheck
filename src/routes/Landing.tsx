import { ArrowRight, Disc3, Gauge, ListMusic, Mic2, Music4, WifiOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { band, concerts, songs } from '@/content'
import { Foot, Masthead, Page } from '@/app/Shell'
import { Button, Eyebrow, Facts, SectionHead, Tag } from '@/design/primitives'

const FEATURES = [
  {
    icon: ListMusic,
    title: 'The setlist, not a spreadsheet',
    body: 'Song order, who plays what, keys and tempos. Say who you are once and it becomes your setlist — your songs marked, the ones you sit out faded back.',
  },
  {
    icon: Mic2,
    title: 'Singers get words',
    body: 'Lyrics set in a serif at whatever size reaches your eyes from the stand, with section headings so you can find the second chorus at a glance.',
  },
  {
    icon: Music4,
    title: 'Players get the chart',
    body: 'Bar grids straight from the band’s iReal book, with cues, repeats and the transitions into and out of every song.',
  },
  {
    icon: Gauge,
    title: 'Your key, your tempo',
    body: 'Transpose to suit the voice on the night. Every chord respells itself properly — up a semitone from A gives B♭, not A♯.',
  },
  {
    icon: Disc3,
    title: 'Click and a backing band',
    body: 'A count-in and a rock-solid click, plus keys, bass and drums built from the chart when you want to rehearse against something.',
  },
  {
    icon: WifiOff,
    title: 'Fine when the wifi is not',
    body: 'Everything is cached the first time you open it. Venue internet has no say in whether you can read your own setlist.',
  },
]

export function Landing() {
  const songCount = Object.keys(songs).length
  const next = concerts[0]

  return (
    <>
      <Masthead>
        <Eyebrow>
          <span>Soundcheck</span>
          <span>Live performance companion</span>
          <span>v{__APP_VERSION__}</span>
        </Eyebrow>

        <h1 className="sc-display m-0 text-[clamp(34px,6.4vw,58px)]">
          Everything the band needs, on the stand.
        </h1>

        <p className="sc-prose m-0 max-w-[54ch] !text-[19px]">
          One link the whole band opens at soundcheck. Tap a song and you get exactly your view of
          it — words if you sing, the chart if you play, and the key, tempo and cues either way.
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-3">
          <Link to="/bands">
            <Button variant="solid" size="md">
              Browse bands <ArrowRight size={12} strokeWidth={2.5} />
            </Button>
          </Link>
          {next && (
            <Link to={`/bands/${band.slug}/${next.slug}`}>
              <Button size="md">
                Go to {next.title}
              </Button>
            </Link>
          )}
        </div>

        <div className="mt-2">
          <Facts
            items={[
              { label: 'Bands', value: '1' },
              { label: 'Songs', value: songCount },
              { label: 'Concerts', value: concerts.length },
              { label: 'Offline', value: 'Yes' },
              { label: 'Sign-in', value: 'None' },
            ]}
          />
        </div>
      </Masthead>

      <Page className="pt-14">
        <section>
          <SectionHead num="01" tag="What it does" tagTone="accent" title="Six things, done properly">
            Built for the twenty minutes before a show and the two hours during it, not for a
            product demo.
          </SectionHead>

          <div className="sc-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(248px, 1fr))' }}>
            {FEATURES.map((feature) => (
              <div key={feature.title} className="bg-panel px-5 py-5">
                <feature.icon size={17} strokeWidth={1.6} className="mb-3 text-accent" />
                <h3 className="m-0 mb-1.5 text-[16px] font-semibold tracking-[-0.012em]">
                  {feature.title}
                </h3>
                <p className="sc-prose m-0 !text-[15.5px] !leading-[1.55]">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pt-14">
          <SectionHead num="02" tag="Who's using it" title="Bands">
            One band so far. The content model takes as many as you point it at.
          </SectionHead>

          <Link
            to={`/bands/${band.slug}`}
            className="group flex items-center gap-4 border border-line bg-panel px-5 py-5 transition-colors hover:border-accent"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="m-0 text-[19px] font-semibold tracking-[-0.02em]">{band.name}</h3>
                <Tag>{band.members.length} members</Tag>
                <Tag>{concerts.length} concert{concerts.length === 1 ? '' : 's'}</Tag>
              </div>
              <p className="sc-prose m-0 mt-1 !text-[15.5px]">{band.tagline}</p>
            </div>
            <ArrowRight
              size={16}
              strokeWidth={1.75}
              className="shrink-0 text-line transition-all group-hover:translate-x-0.5 group-hover:text-accent"
            />
          </Link>
        </section>
      </Page>

      <Foot />
    </>
  )
}
