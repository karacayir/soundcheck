import { Check, ChevronDown, UserRound } from 'lucide-react'
import { band, memberById, roleById } from '@/content'
import { Button, Label, Segmented, Sheet, cx } from '@/design/primitives'
import { setPrefs, usePrefs } from './prefs'

/**
 * "Who are you". Picking yourself once turns the setlist from a running order
 * into *your* running order: your songs marked with an accent rail, the ones
 * you sit out faded back, and each song opening in the view your instrument
 * actually needs.
 */
export function IdentityButton({ onClick }: { onClick: () => void }) {
  const { memberId } = usePrefs()
  const member = memberId ? memberById.get(memberId) : undefined

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'group flex items-center gap-2 rounded-xs border py-1.5 pr-2 pl-2.5 transition-colors',
        member
          ? 'border-line bg-panel hover:border-accent'
          : 'border-accent bg-accent-wash hover:brightness-[0.98]',
      )}
    >
      <UserRound size={13} strokeWidth={1.75} className={member ? 'text-muted' : 'text-accent'} />
      {member ? (
        <span className="text-[14px] font-medium tracking-[-0.01em]">{member.name}</span>
      ) : (
        <span className="font-mono text-[11px] font-medium tracking-[0.06em] text-accent uppercase">
          Who are you?
        </span>
      )}
      <ChevronDown size={12} strokeWidth={2} className="text-muted" />
    </button>
  )
}

export function IdentitySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const prefs = usePrefs()

  return (
    <Sheet open={open} onClose={onClose} title="Who are you?">
      <p className="sc-prose mb-5 !text-[16px]">
        Your songs get an accent rail, the ones you sit out fade back, and each song opens in the
        view your instrument needs. Saved on this device only.
      </p>

      <div className="sc-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
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
                'flex flex-col items-start gap-1 px-3.5 py-3 text-left transition-colors',
                selected ? 'bg-accent-wash' : 'bg-panel hover:bg-sunk',
              )}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span
                  className={cx(
                    'truncate text-[15px] font-semibold tracking-[-0.012em]',
                    selected && 'text-accent-ink',
                  )}
                >
                  {member.name}
                </span>
                {selected && <Check size={13} strokeWidth={2.5} className="shrink-0 text-accent" />}
              </span>
              <span className={cx('sc-label', selected && '!text-accent')}>
                {member.roles.map((r) => roleById.get(r)?.label ?? r).join(' · ')}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex flex-col gap-2.5">
        <Label>Default view</Label>
        <Segmented
          value={prefs.view ?? 'auto'}
          onChange={(view) => setPrefs({ view: view === 'auto' ? null : view })}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'singer', label: 'Lyrics' },
            { value: 'musician', label: 'Chart' },
          ]}
        />
        <p className="sc-prose m-0 !text-[14.5px]">
          Auto follows your instrument — vocalists get lyrics, everyone else gets the chart.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-2.5">
        <Label>Appearance</Label>
        <Segmented
          value={prefs.theme}
          onChange={(theme) => setPrefs({ theme })}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </div>

      <div className="mt-6 flex flex-col gap-2.5">
        <Label>Screen</Label>
        <Button
          active={prefs.keepAwake}
          onClick={() => setPrefs({ keepAwake: !prefs.keepAwake })}
          className="justify-start"
        >
          {prefs.keepAwake && <Check size={12} strokeWidth={2.5} />} Keep screen awake
        </Button>
      </div>

      {prefs.memberId && (
        <div className="mt-6 border-t border-line pt-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setPrefs({ memberId: null, view: null })
              onClose()
            }}
          >
            Clear selection
          </Button>
        </div>
      )}
    </Sheet>
  )
}
