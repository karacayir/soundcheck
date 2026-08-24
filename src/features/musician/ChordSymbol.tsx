const CHORD_RE = /^([A-G])([#b]{0,2})(.*?)(?:\/([A-G][#b]{0,2}))?$/

/**
 * Renders a chord the way a chart does: full-size root, raised quality, and a
 * quieter slash bass. Anything unrecognised (N.C., a rehearsal note) is printed
 * as-is rather than mangled.
 */
export function ChordSymbol({
  symbol,
  className,
  muted = 'text-muted',
}: {
  symbol: string
  className?: string
  muted?: string
}) {
  const match = symbol.match(CHORD_RE)
  if (!match) return <span className={className}>{symbol}</span>

  const [, letter, accidental, quality, bass] = match

  return (
    <span className={className}>
      <span>{letter}</span>
      {accidental && <span className="text-[0.78em]">{pretty(accidental)}</span>}
      {quality && <span className="text-[0.66em] tracking-tight">{quality}</span>}
      {bass && (
        <span className={`text-[0.7em] ${muted}`}>
          /{bass.slice(0, 1)}
          {bass.length > 1 && pretty(bass.slice(1))}
        </span>
      )}
    </span>
  )
}

function pretty(raw: string): string {
  return raw.replaceAll('b', '♭').replaceAll('#', '♯')
}
