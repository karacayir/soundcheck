import { Link } from 'react-router-dom'
import { band } from '@/content'
import { Button, Label } from '@/design/primitives'

export function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center gap-7 px-5">
      <div>
        <Label>404</Label>
        <h1 className="sc-display mt-3 text-2xl">Nothing here.</h1>
        <p className="mt-2 text-sm text-muted">That concert or song doesn&rsquo;t exist.</p>
      </div>
      <div>
        <Link to={`/${band.slug}`}>
          <Button size="md">{band.name}</Button>
        </Link>
      </div>
    </div>
  )
}
