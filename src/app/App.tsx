import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { band } from '@/content'
import { SetlistScreen } from '@/features/setlist/SetlistScreen'
import { SongScreen } from '@/features/song/SongScreen'
import { ConcertsScreen } from '@/routes/ConcertsScreen'
import { NotFound } from '@/routes/NotFound'
import { PrintScreen } from '@/routes/PrintScreen'
import { UpdatePrompt } from './UpdatePrompt'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={`/${band.slug}`} replace />} />
        <Route path="/:bandSlug" element={<ConcertsScreen />} />
        <Route path="/:bandSlug/:concertSlug" element={<SetlistScreen />} />
        {/* Static segment before the dynamic one so "print" is not read as a song id. */}
        <Route path="/:bandSlug/:concertSlug/print" element={<PrintScreen />} />
        <Route path="/:bandSlug/:concertSlug/:songId" element={<SongScreen />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <UpdatePrompt />
    </BrowserRouter>
  )
}
