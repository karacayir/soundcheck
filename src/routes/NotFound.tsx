import { Link } from 'react-router-dom'
import { band } from '@/content'
import { Button, Label } from '@/design/primitives'

export function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center gap-6 px-4">
      <div>
        <Label>404</Label>
        <h1 className="mt-2 text-xl font-semibold sc-tight">Burada bir şey yok.</h1>
        <p className="mt-2 text-sm text-muted">
          Aradığın konser ya da şarkı bulunamadı.
        </p>
      </div>
      <div>
        <Link to={`/${band.slug}`}>
          <Button size="md">{band.name}</Button>
        </Link>
      </div>
    </div>
  )
}
