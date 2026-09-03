import { Link } from 'react-router-dom'
import { Page, PageHead, TopBar } from '@/app/Shell'
import { Button } from '@/design/primitives'

export function NotFound() {
  return (
    <>
      <TopBar back="/" backLabel="Home" />
      <Page>
        <PageHead
          title="We couldn't find that."
          lead="The band, show or song you were looking for isn't here any more."
        >
          <div className="flex gap-3">
            <Link to="/">
              <Button variant="solid">Go home</Button>
            </Link>
            <Link to="/bands">
              <Button>Browse bands</Button>
            </Link>
          </div>
        </PageHead>
      </Page>
    </>
  )
}
