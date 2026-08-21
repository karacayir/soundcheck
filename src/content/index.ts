import dataset from 'virtual:soundcheck-content'
import type { Concert, SetlistItem, Song } from './types'

export const { band, concerts, songs, todos } = dataset

export const roleById = new Map(band.roles.map((r) => [r.id, r]))
export const memberById = new Map(band.members.map((m) => [m.id, m]))

export function getConcert(slug: string | undefined): Concert | undefined {
  return concerts.find((c) => c.slug === slug)
}

export function getSong(id: string | undefined): Song | undefined {
  return id ? songs[id] : undefined
}

export function memberName(id: string): string {
  return memberById.get(id)?.name ?? id
}

/**
 * The setlist with song numbers attached. Breaks do not consume a number —
 * "song 16" should mean the 16th thing you play, not the 17th row.
 */
export function setlistItems(concert: Concert): SetlistItem[] {
  let number = 0
  return concert.setlist.map((entry, position) => {
    if (entry.kind === 'break') return { ...entry, position }
    number += 1
    return { ...entry, position, number, song_: songs[entry.song]! }
  })
}

export function playableItems(concert: Concert) {
  return setlistItems(concert).filter((item) => item.kind === 'song')
}

/** Which roles a member covers in a given song, if any. */
export function rolesInSong(item: SetlistItem, memberId: string | null): string[] {
  if (!memberId || item.kind !== 'song') return []
  return Object.entries(item.lineup)
    .filter(([, people]) => people.includes(memberId))
    .map(([roleId]) => roleId)
}
