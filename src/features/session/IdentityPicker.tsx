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
        'group flex items-center gap-2 rounded-full py-2 pr-3 pl-3.5 transition-all',
        'duration-200 ease-[var(--ease-smooth)] active:scale-[0.97]',
        member
          ? 'bg-card shadow-[var(--sc-sh-sm)] hover:bg-sunk'
          : 'bg-accent text-on-accent hover:bg-accent-hover',
      )}
    >
      <UserRound size={14} strokeWidth={2.25} className={member ? 'text-ink-3' : ''} />
      <span className="sc-tight text-[14.5px] font-semibold">
        {member ? member.name : 'Who are you?'}
      </span>
      <ChevronDown size={13} strokeWidth={2.25} className={member ? 'text-ink-3' : 'opacity-70'} />
    </button>
  )
}

export function IdentitySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const prefs = usePrefs()

  return (
    <Sheet open={open} onClose={onClose} title="Who are you?">
      <p className="mb-5 text-[14.5px] leading-relaxed text-ink-2">
        Your songs get highlighted, the ones you sit out fade back, and each song opens in the view
        your instrument needs. Saved on this device only.
      </p>

      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
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
                'flex flex-col items-start gap-0.5 rounded-xl px-3.5 py-3 text-left transition-all',
                'duration-200 ease-[var(--ease-smooth)] active:scale-[0.98]',
                selected ? 'bg-accent text-on-accent' : 'bg-sunk hover:bg-card hover:shadow-[var(--sc-sh-sm)]',
              )}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="sc-tight truncate text-[15px] font-bold">{member.name}</span>
                {selected && <Check size={14} strokeWidth={2.75} className="shrink-0" />}
              </span>
              <span className={cx('text-[12.5px]', selected ? 'opacity-75' : 'text-ink-3')}>
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
            { value: 'musician', label: 'Chords' },
          ]}
        />
        <p className="m-0 text-[13.5px] text-ink-3">
          Auto follows your instrument — singers get lyrics, everyone else gets the chords.
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
          variant={prefs.keepAwake ? 'solid' : 'soft'}
          onClick={() => setPrefs({ keepAwake: !prefs.keepAwake })}
        >
          {prefs.keepAwake && <Check size={14} strokeWidth={2.75} />} Keep screen awake
        </Button>
      </div>

      {prefs.memberId && (
        <div className="mt-6">
          <Button
            size="sm"
            variant="quiet"
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
