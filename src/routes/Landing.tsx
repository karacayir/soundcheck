import { ArrowRight, Disc3, Gauge, ListMusic, Mic2, Music4, WifiOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { band, concerts, songs } from '@/content'
import { Logo, Page, TopBar } from '@/app/Shell'
import { Button, Chip, SectionHead } from '@/design/primitives'

const FEATURES = [
  {
    icon: ListMusic,
    title: 'Your setlist, not just the setlist',
    body: 'Say who you are once. Your songs get marked, the ones you sit out fade back, and every song opens in the view your instrument needs.',
  },
  {
    icon: Mic2,
    title: 'Singers get the words',
    body: 'Lyrics at whatever size reaches your eyes from the stand, with section headings so you can find the second chorus at a glance.',
  },
  {
    icon: Music4,
    title: 'Players get the chart',
    body: 'Bar-by-bar chords with repeats, cues, and the transitions into and out of every song in the running order.',
  },
  {
    icon: Gauge,
    title: 'Your key, your tempo',
    body: 'Transpose to suit the voice on the night. Every chord respells itself properly — up a semitone from A gives B♭, not A♯.',
  },
  {
    icon: Disc3,
    title: 'Click and a backing band',
    body: 'A count-in and a rock-solid click, plus keys, bass and drums built from the chart when you want something to rehearse against.',
  },
  {
    icon: WifiOff,
    title: 'Fine when the wifi is not',
    body: 'Everything is saved to your phone the first time you open it. Venue internet gets no say in whether you can read your own setlist.',
  },
]

export function Landing() {
  const songCount = Object.keys(songs).length
  const next = concerts[0]

  return (
    <>
      <TopBar />

      <Page className="pb-16">
        <section className="pt-10 pb-14 sm:pt-16">
          <Chip tone="accent" className="mb-5">
            Live performance companion
          </Chip>

          <h1 className="sc-display m-0 max-w-[16ch] text-[clamp(38px,8vw,68px)]">
            Everything the band needs, on the stand.
          </h1>

          <p className="mt-5 max-w-[50ch] text-[17.5px] leading-relaxed text-ink-2">
            One link the whole band opens at soundcheck. Tap a song and you get exactly your view
            of it — words if you sing, the chart if you play, and the key, tempo and cues either
            way.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/bands">
              <Button variant="solid" size="lg">
                Browse bands <ArrowRight size={16} strokeWidth={2.25} />
              </Button>
            </Link>
            {next && (
              <Link to={`/bands/${band.slug}/${next.slug}`}>
                <Button size="lg">Open {next.title}</Button>
              </Link>
            )}
          </div>
        </section>

        <section className="pb-14">
          <SectionHead title="Built for the gig">
            For the twenty minutes before a show and the two hours during it.
          </SectionHead>

          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(258px, 1fr))' }}
          >
            {FEATURES.map((feature) => (
              <div key={feature.title} className="sc-card p-5">
                <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <feature.icon size={18} strokeWidth={2} />
                </span>
                <h3 className="sc-tight m-0 mb-1.5 text-[16px] font-bold">{feature.title}</h3>
                <p className="m-0 text-[14.5px] leading-relaxed text-ink-2">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHead title="Bands">Pick a band to see its shows.</SectionHead>

          <Link
            to={`/bands/${band.slug}`}
            className="sc-card sc-card-hover group flex items-center gap-4 p-5"
          >
            <Logo className="!size-11 !rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="sc-tight m-0 text-[18px] font-bold">{band.name}</h3>
                <Chip>{band.members.length} members</Chip>
              </div>
              <p className="m-0 mt-0.5 text-[14px] text-ink-2">
                {songCount} songs · {concerts.length} concert{concerts.length === 1 ? '' : 's'}
              </p>
            </div>
            <ArrowRight
              size={18}
              strokeWidth={2}
              className="shrink-0 text-ink-3 transition-transform duration-200 ease-[var(--ease-smooth)] group-hover:translate-x-0.5"
            />
          </Link>
        </section>
      </Page>
    </>
  )
}
