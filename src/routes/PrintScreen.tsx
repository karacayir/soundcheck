import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { band, getConcert, memberName, setlistItems } from '@/content'
import { NotFound } from './NotFound'

/**
 * The paper fallback: the whole concert as one grid, laid out like the
 * spreadsheet everyone already knows. Prints black-on-white regardless of the
 * app theme, because that is what a printer and a dark stage both want.
 */
export function PrintScreen() {
  const { concertSlug } = useParams()
  const concert = getConcert(concertSlug)
  const items = useMemo(() => (concert ? setlistItems(concert) : []), [concert])

  if (!concert) return <NotFound />

  return (
    <div className="print-sheet mx-auto w-full max-w-5xl px-4 py-8 text-black">
      <style>{PRINT_CSS}</style>

      <header className="mb-4 flex items-end justify-between border-b-2 border-black pb-2">
        <div>
          <div className="font-mono text-[10px] tracking-[0.14em] uppercase">{band.name}</div>
          <h1 className="text-2xl leading-none font-bold tracking-[-0.028em]">{concert.title}</h1>
        </div>
        <div className="text-right text-[10px]">
          {concert.date && <div>{concert.date}</div>}
          {concert.venue && <div>{concert.venue}</div>}
        </div>
      </header>

      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr>
            <th className="w-6 border border-black px-1 py-1 text-left">#</th>
            <th className="border border-black px-1 py-1 text-left">Song</th>
            <th className="w-10 border border-black px-1 py-1 text-left">Key</th>
            <th className="w-10 border border-black px-1 py-1 text-left">BPM</th>
            {band.roles.map((role) => (
              <th key={role.id} className="border border-black px-1 py-1 text-left">
                {role.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) =>
            item.kind === 'break' ? (
              <tr key={`break-${item.position}`}>
                <td
                  colSpan={4 + band.roles.length}
                  className="border border-black bg-black px-1 py-1 text-center text-[10px] font-bold tracking-[0.14em] text-white uppercase"
                >
                  {item.title}
                  {item.minutes ? ` — ${item.minutes} MIN` : ''}
                </td>
              </tr>
            ) : (
              <tr key={item.song} className="break-inside-avoid">
                <td className="border border-black px-1 py-1 text-right tabular-nums">
                  {item.number}
                </td>
                <td className="border border-black px-1 py-1">
                  <span className="font-semibold">{item.song_.title}</span>
                  {item.song_.artist && (
                    <span className="text-[9px] opacity-70"> · {item.song_.artist}</span>
                  )}
                  {item.segue && <span className="text-[9px] font-bold"> ↓</span>}
                </td>
                <td className="border border-black px-1 py-1 tabular-nums">
                  {item.song_.key ?? ''}
                </td>
                <td className="border border-black px-1 py-1 tabular-nums">
                  {item.song_.tempo ?? ''}
                </td>
                {band.roles.map((role) => (
                  <td key={role.id} className="border border-black px-1 py-1">
                    {(item.lineup[role.id] ?? []).map(memberName).join(', ')}
                  </td>
                ))}
              </tr>
            ),
          )}
        </tbody>
      </table>

      <p className="mt-3 text-[9px] opacity-60">↓ = runs straight on into the next song</p>

      <button
        type="button"
        onClick={() => window.print()}
        className="no-print mt-6 border border-black px-4 py-2 text-[11px] tracking-[0.09em] uppercase"
      >
        Print
      </button>
    </div>
  )
}

const PRINT_CSS = `
  .print-sheet { background: #fff; min-height: 100dvh; }
  @media print {
    @page { size: A4 landscape; margin: 10mm; }
    .no-print { display: none !important; }
    .print-sheet { padding: 0; max-width: none; }
  }
`
