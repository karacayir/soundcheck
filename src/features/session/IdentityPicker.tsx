import { Check, ChevronDown, Monitor, Moon, Sun, UserRound } from 'lucide-react'
import { band, memberById, roleById } from '@/content'
import { Button, Label, SegmentedControl, Sheet, cx } from '@/design/primitives'
import { setPrefs, usePrefs } from './prefs'

/**
 * "I am ___". Picking yourself once turns the setlist from a spreadsheet into
 * *your* setlist: your songs marked, the ones you sit out dimmed, and each
 * song opening in the view your instrument actually needs.
 */
export function IdentityButton({ onClick }: { onClick: () => void }) {
  const { memberId } = usePrefs()
  const member = memberId ? memberById.get(memberId) : undefined

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'group flex items-center gap-2.5 rounded-lg border py-2 pr-3 pl-3 transition-all',
        'duration-150 ease-[var(--ease-out-quick)] active:scale-[0.98]',
        member
          ? 'border-line bg-surface hover:border-line-2 hover:bg-surface-2'
          : 'border-accent/40 bg-accent/10 hover:bg-accent/15',
      )}
    >
      <UserRound size={14} strokeWidth={1.75} className={member ? 'text-muted' : 'text-accent'} />
      {member ? (
        <span className="sc-tight text-sm font-medium">{member.name}</span>
      ) : (
        <span className="text-xs font-medium tracking-[0.07em] text-accent uppercase">
          Who are you?
        </span>
      )}
      <ChevronDown
        size={14}
        strokeWidth={2}
        className="text-dim transition-colors group-hover:text-muted"
      />
    </button>
  )
}

export function IdentitySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const prefs = usePrefs()

  return (
    <Sheet open={open} onClose={onClose} title="Who are you?">
      <p className="mb-5 text-sm text-muted">
        Your songs get marked, the ones you sit out fade back, and each song opens in the view your
        instrument needs.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {band.members.map((member) => {
          const selected = prefs.memberId === member.id
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => {
                // Choosing a person clears any manual view override, so the
                // default follows the new instrument.
                setPrefs({ memberId: member.id, view: null })
                onClose()
              }}
              className={cx(
                'flex flex-col items-start gap-1.5 rounded-lg border px-3 py-3 text-left',
                'transition-all duration-150 ease-[var(--ease-out-quick)] active:scale-[0.98]',
                selected
                  ? 'border-accent bg-accent/12'
                  : 'border-line bg-surface hover:border-line-2 hover:bg-surface-2',
              )}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="sc-tight truncate text-sm font-medium">{member.name}</span>
                {selected && <Check size={13} strokeWidth={2.5} className="shrink-0 text-accent" />}
              </span>
              <span className={cx('sc-label', selected && '!text-accent')}>
                {member.roles.map((r) => roleById.get(r)?.label ?? r).join(' · ')}
              </span>
            </button>
          )
        })}
      </div>

      {prefs.memberId && (
        <div className="mt-5 flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setPrefs({ memberId: null, view: null })
              onClose()
            }}
          >
            Clear
          </Button>
          <span className="text-2xs text-dim">Saved on this device only.</span>
        </div>
      )}
    </Sheet>
  )
}

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const prefs = usePrefs()

  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <div className="flex flex-col gap-7">
        <section className="flex flex-col gap-2.5">
          <Label>Appearance</Label>
          <SegmentedControl
            value={prefs.theme}
            onChange={(theme) => setPrefs({ theme })}
            options={[
              {
                value: 'dark',
                label: (
                  <>
                    <Moon size={13} strokeWidth={1.75} /> Dark
                  </>
                ),
              },
              {
                value: 'light',
                label: (
                  <>
                    <Sun size={13} strokeWidth={1.75} /> Light
                  </>
                ),
              },
            ]}
          />
          <p className="text-2xs text-dim">Dark is easier on the eyes under stage lighting.</p>
        </section>

        <section className="flex flex-col gap-2.5">
          <Label>Default view</Label>
          <SegmentedControl
            value={prefs.view ?? 'auto'}
            onChange={(view) => setPrefs({ view: view === 'auto' ? null : view })}
            options={[
              {
                value: 'auto',
                label: (
                  <>
                    <Monitor size={13} strokeWidth={1.75} /> Auto
                  </>
                ),
              },
              { value: 'singer', label: 'Lyrics' },
              { value: 'musician', label: 'Chart' },
            ]}
          />
          <p className="text-2xs text-dim">
            Auto follows your instrument: vocalists get lyrics, everyone else gets the chart.
          </p>
        </section>

        <section className="flex flex-col gap-2.5">
          <Label>Screen</Label>
          <Button
            size="md"
            active={prefs.keepAwake}
            onClick={() => setPrefs({ keepAwake: !prefs.keepAwake })}
            className="justify-start"
          >
            {prefs.keepAwake && <Check size={13} strokeWidth={2.5} />}
            Keep screen awake
          </Button>
          <p className="text-2xs text-dim">Your phone won&rsquo;t sleep while a song is open.</p>
        </section>

        <div className="flex items-center gap-2 border-t border-line pt-5">
          <span className="sc-num text-2xs text-dim">Soundcheck v{__APP_VERSION__}</span>
        </div>
      </div>
    </Sheet>
  )
}
