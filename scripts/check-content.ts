#!/usr/bin/env tsx
import { ContentError, loadContent } from '../build/load-content.ts'

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`
const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`

try {
  const { band, concerts, songs, todos } = loadContent()
  const songCount = Object.keys(songs).length

  console.log(green('✓ content ok'))
  console.log(
    `  ${bold(band.name)} — ${band.members.length} members, ${songCount} songs, ` +
      `${concerts.length} concert(s)`,
  )

  for (const concert of concerts) {
    const played = concert.setlist.filter((e) => e.kind === 'song').length
    const breaks = concert.setlist.length - played
    console.log(dim(`  /${band.slug}/${concert.slug} — ${played} songs, ${breaks} break(s)`))
  }

  if (todos.length) {
    console.log('')
    console.log(yellow(`still to fill in (${todos.length} song(s)):`))
    const width = Math.max(...todos.map((t) => t.title.length))
    for (const todo of todos) {
      console.log(`  ${todo.title.padEnd(width)}  ${dim(todo.missing.join(', '))}`)
    }
  }
  process.exit(0)
} catch (err) {
  if (err instanceof ContentError) {
    console.error(red('✗ content validation failed'))
    console.error('')
    console.error(err.problems.join('\n\n'))
    console.error('')
    process.exit(1)
  }
  throw err
}
