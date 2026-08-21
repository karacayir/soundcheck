const CHORD_RE = /^([A-G])([#b]{0,2})(.*?)(?:\/([A-G][#b]{0,2}))?$/

/**
 * Renders a chord the way a chart does: big root, small raised quality,
 * hairline slash bass. Anything unrecognised (N.C., a rehearsal note) is
 * printed as-is rather than mangled.
 */
export function ChordSymbol({ symbol, className }: { symbol: string; className?: string }) {
  const match = symbol.match(CHORD_RE)
  if (!match) return <span className={className}>{symbol}</span>

  const [, letter, accidental, quality, bass] = match

  return (
    <span className={className}>
      <span>{letter}</span>
      {accidental && <span className="text-[0.75em]">{prettyAccidental(accidental)}</span>}
      {quality && <span className="align-super text-[0.62em] tracking-tight">{quality}</span>}
      {bass && (
        <span className="text-[0.7em] text-muted">
          /{bass.slice(0, 1)}
          {bass.length > 1 && prettyAccidental(bass.slice(1))}
        </span>
      )}
    </span>
  )
}

function prettyAccidental(raw: string): string {
  return raw.replaceAll('b', '♭').replaceAll('#', '♯')
}
