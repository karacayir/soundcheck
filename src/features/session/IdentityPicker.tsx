import { band, memberById, roleById } from '@/content'
import { Button, Chip, Label, Sheet } from '@/design/primitives'
import { setPrefs, usePrefs } from './prefs'

/**
 * "I am ___". Picking yourself once turns the setlist from a spreadsheet into
 * *your* setlist: your songs highlighted, the ones you sit out dimmed, and
 * songs opening in the view your instrument needs.
 */
export function IdentityButton({ onClick }: { onClick: () => void }) {
  const { memberId } = usePrefs()
  const member = memberId ? memberById.get(memberId) : undefined

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-2 border border-line px-3 py-2 text-left transition-colors hover:border-line-strong hover:bg-surface"
    >
      <span className="sc-label">Ben</span>
      <span className="text-sm font-medium sc-tight">{member ? member.name : 'Seç'}</span>
      <span className="text-dim transition-colors group-hover:text-muted">▾</span>
    </button>
  )
}

export function IdentitySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const prefs = usePrefs()

  return (
    <Sheet open={open} onClose={onClose} title="Ben kimim?">
      <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3">
        {band.members.map((member) => {
          const selected = prefs.memberId === member.id
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => {
                // Choosing a person clears any manual view override so the
                // default follows the new instrument.
                setPrefs({ memberId: member.id, view: null })
                onClose()
              }}
              className={
                'flex flex-col items-start gap-1.5 px-3 py-3 text-left transition-colors ' +
                (selected ? 'bg-fg text-bg' : 'bg-bg hover:bg-surface')
              }
            >
              <span className="text-sm font-medium sc-tight">{member.name}</span>
              <span
                className={
                  'text-2xs uppercase tracking-[0.09em] ' + (selected ? 'text-bg/70' : 'text-muted')
                }
              >
                {member.roles.map((r) => roleById.get(r)?.label ?? r).join(' · ')}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setPrefs({ memberId: null, view: null })
            onClose()
          }}
        >
          Seçimi temizle
        </Button>
        <span className="text-2xs text-dim">
          Bu seçim yalnızca bu cihazda saklanır.
        </span>
      </div>
    </Sheet>
  )
}

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const prefs = usePrefs()

  return (
    <Sheet open={open} onClose={onClose} title="Ayarlar">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label>Tema</Label>
          <div className="flex gap-px">
            {(['dark', 'light'] as const).map((theme) => (
              <Button
                key={theme}
                size="md"
                active={prefs.theme === theme}
                onClick={() => setPrefs({ theme })}
              >
                {theme === 'dark' ? 'Karanlık' : 'Aydınlık'}
              </Button>
            ))}
          </div>
          <p className="text-2xs text-dim">Sahnede karanlık tema gözü yormaz.</p>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Ekran</Label>
          <Button
            size="md"
            active={prefs.keepAwake}
            onClick={() => setPrefs({ keepAwake: !prefs.keepAwake })}
          >
            {prefs.keepAwake ? 'Ekran açık kalsın ✓' : 'Ekran açık kalsın'}
          </Button>
          <p className="text-2xs text-dim">
            Bir şarkı açıkken telefon uykuya geçmez.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Görünüm</Label>
          <div className="flex flex-wrap gap-px">
            <Button size="md" active={prefs.view === null} onClick={() => setPrefs({ view: null })}>
              Enstrümanıma göre
            </Button>
            <Button
              size="md"
              active={prefs.view === 'singer'}
              onClick={() => setPrefs({ view: 'singer' })}
            >
              Hep sözler
            </Button>
            <Button
              size="md"
              active={prefs.view === 'musician'}
              onClick={() => setPrefs({ view: 'musician' })}
            >
              Hep akorlar
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-line pt-4">
          <Chip tone="quiet">v{__APP_VERSION__}</Chip>
          <span className="text-2xs text-dim">Soundcheck</span>
        </div>
      </div>
    </Sheet>
  )
}
