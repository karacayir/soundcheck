import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { band } from '@/content'
import { SetlistScreen } from '@/features/setlist/SetlistScreen'
import { SongScreen } from '@/features/song/SongScreen'
import { BandScreen } from '@/routes/BandScreen'
import { BandsScreen } from '@/routes/BandsScreen'
import { Landing } from '@/routes/Landing'
import { NotFound } from '@/routes/NotFound'
import { PrintScreen } from '@/routes/PrintScreen'
import { UpdatePrompt } from './UpdatePrompt'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/bands" element={<BandsScreen />} />
        <Route path="/bands/:bandSlug" element={<BandScreen />} />
        <Route path="/bands/:bandSlug/:concertSlug" element={<SetlistScreen />} />
        {/* Static segment before the dynamic one so "print" is not read as a song id. */}
        <Route path="/bands/:bandSlug/:concertSlug/print" element={<PrintScreen />} />
        <Route path="/bands/:bandSlug/:concertSlug/:songId" element={<SongScreen />} />
        {/* The old flat URLs people may have bookmarked. */}
        <Route path={`/${band.slug}`} element={<Navigate to={`/bands/${band.slug}`} replace />} />
        <Route
          path={`/${band.slug}/:concertSlug/*`}
          element={<LegacyRedirect />}
        />
        <Route path={`/${band.slug}/:concertSlug`} element={<LegacyRedirect />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <UpdatePrompt />
    </BrowserRouter>
  )
}

/** `/funky-monkey/february/...` → `/bands/funky-monkey/february/...` */
function LegacyRedirect() {
  const path = window.location.pathname.replace(/^\//, '')
  return <Navigate to={`/bands/${path}`} replace />
}
