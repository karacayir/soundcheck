import { Link } from 'react-router-dom'
import { Button, Eyebrow } from '@/design/primitives'
import { Masthead, Page } from '@/app/Shell'

export function NotFound() {
  return (
    <>
      <Masthead>
        <Eyebrow>
          <span>404</span>
        </Eyebrow>
        <h1 className="sc-display m-0 text-[clamp(30px,5.4vw,46px)]">Nothing here.</h1>
        <p className="sc-prose m-0 max-w-[46ch] !text-[18px]">
          That band, concert or song doesn&rsquo;t exist. It may have been renamed in{' '}
          <code className="bg-sunk px-1 font-mono text-[0.85em]">content/</code>.
        </p>
        <div className="mt-1 flex gap-2">
          <Link to="/">
            <Button variant="solid">Home</Button>
          </Link>
          <Link to="/bands">
            <Button>Bands</Button>
          </Link>
        </div>
      </Masthead>
      <Page className="pt-10">{null}</Page>
    </>
  )
}
