import type { Plugin, ViteDevServer } from 'vite'
import { CONTENT_DIR, ContentError, loadContent } from './load-content.ts'

const VIRTUAL_ID = 'virtual:soundcheck-content'
const RESOLVED_ID = '\0' + VIRTUAL_ID

/**
 * Exposes everything under `content/` as `import content from 'virtual:soundcheck-content'`.
 *
 * Validation happens here, so a typo in a YAML file is a build/dev-server error
 * with a file and field name — not a blank cell during the second set.
 */
export function contentPlugin(): Plugin {
  let server: ViteDevServer | undefined

  function build(): string {
    const dataset = loadContent()
    return `export default ${JSON.stringify(dataset)}`
  }

  return {
    name: 'soundcheck:content',

    configureServer(s) {
      server = s
      s.watcher.add(CONTENT_DIR)
    },

    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null
    },

    load(id) {
      if (id !== RESOLVED_ID) return null
      try {
        return build()
      } catch (err) {
        if (err instanceof ContentError) {
          this.error(`\n\nContent validation failed.\n\n${err.problems.join('\n\n')}\n`)
        }
        throw err
      }
    },

    handleHotUpdate(ctx) {
      if (!ctx.file.startsWith(CONTENT_DIR)) return
      const mod = server?.moduleGraph.getModuleById(RESOLVED_ID)
      if (mod) server?.moduleGraph.invalidateModule(mod)
      server?.ws.send({ type: 'full-reload' })
      return []
    },
  }
}
