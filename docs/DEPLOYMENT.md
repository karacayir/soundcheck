# Deployment

Soundcheck is a static build on **Cloudflare Pages**, deployed by GitHub
Actions. There are two sites:

| | URL | Deployed by |
| --- | --- | --- |
| **dev** | `https://dev.soundcheck-eo3.pages.dev` | every pull request, and every merge |
| **production** | `https://soundcheck-eo3.pages.dev` | every merge to `main` |

Dev is a *preview* deployment pinned to the branch alias `dev`. `dev` is not the
project's production branch, so nothing on the pull-request path can reach the
live site.

## How the pipeline is put together

Three workflows, each defining one thing, layered so no work happens twice.

```
pull request ──▶ dev.yml ──▶ ci.yml (install, typecheck, unit, build, e2e)
                    └──────▶ deploy to dev  ← downloads that build

push to main ──▶ prod.yml ──▶ dev.yml ──▶ ci.yml   (one build)
                     └──────▶ deploy to dev
                     └──────▶ deploy to production ← the same build
```

- **[`ci.yml`](../.github/workflows/ci.yml)** — `workflow_call` only. Nothing
  triggers it directly, so it can never run alongside a deploy that already
  contains it. It installs once, builds once, and uploads `dist` as the
  artifact both deploys use.
- **[`dev.yml`](../.github/workflows/dev.yml)** — the dev deployment, defined
  once, entered either by a pull request or by `prod.yml` on merge.
- **[`prod.yml`](../.github/workflows/prod.yml)** — calls `dev.yml`, then
  ships the same artifact to production.

What this buys:

- **One build per commit.** The deploy jobs never check out, install, or run
  vite — they download the artifact CI tested. Production serves the exact
  bytes the e2e suite ran against.
- **One workflow per event.** A pull request runs `dev.yml` and nothing else; a
  merge runs `prod.yml` and nothing else.
- **One run per branch state.** Pushing three commits to a pull request in
  quick succession cancels the superseded runs (`concurrency`), so only the
  last one is built.
- **Serialised deploys.** Dev deploys queue rather than cancel, so one pull
  request can't fail another's run. Production is grouped and never cancelled
  mid-flight.
- **No e2e rebuild.** Under CI, Playwright's web server is `vite preview`
  alone; the build step already produced `dist`.
- **Cached browser.** Chromium is restored from cache keyed on
  `package-lock.json`; only the system libraries are reinstalled.
- **A dev site that stays one deployment.** Every dev deploy prunes the ones it
  superseded, so the project doesn't accumulate a deployment per commit.

## One-time setup

### 1. Create the Pages project — done

The project `soundcheck` exists, created once through the Cloudflare API. It is
a Direct Upload project, which is what `wrangler pages deploy` expects. Doing
this as a step in the deploy workflows would fail on every run after the first.

To recreate it from scratch:

```bash
npm i -g wrangler
wrangler login
wrangler pages project create soundcheck --production-branch main
```

**The subdomain is not the project name.** `soundcheck.pages.dev` was already
taken by someone else, so Cloudflare assigned `soundcheck-eo3.pages.dev`.
Deploys address the project by name (`--project-name=soundcheck`); only the
URLs use the subdomain, which is why `CF_PAGES_DOMAIN` exists alongside
`CF_PAGES_PROJECT` in both workflows. To take a different name, delete the
project in the Cloudflare dashboard, create it under the new name, and change
both variables — or skip it entirely and attach a custom domain.

### 2. Create the API token

Cloudflare dashboard → **My Profile → API Tokens → Create Token → Custom
token**:

- Permissions: **Account → Cloudflare Pages → Edit**
- Account resources: **Include → your account**

The same token is used for deploying and for pruning old dev deployments.

### 3. Add the GitHub secrets

Repository → **Settings → Secrets and variables → Actions → New repository
secret**:

| Secret | Where to find it |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | the token from step 2 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard sidebar, or `wrangler whoami` |

Repository secrets, not environment secrets — `dev.yml` needs them on the pull
request path, which has no environment.

### 4. Optional: guard production

`prod.yml` deploys through a GitHub environment named `production`, created
automatically on first run. To require a human before anything goes live:
**Settings → Environments → production → Required reviewers**. The dev deploy
still runs; only the production job waits.

## Custom domain

Cloudflare dashboard → Pages → the project → **Custom domains**. Nothing in the
workflows changes; `--branch=main` remains what publishes to production.

## Manual deploy

**Actions → Deploy to production → Run workflow**. It re-runs CI, dev, and
production from `main` — the same path a merge takes, so a manual deploy can't
ship something a merge wouldn't.

## Forked pull requests

Secrets are not exposed to forks, so the deploy job is skipped there. CI still
runs in full; the fork just doesn't get a dev URL.
