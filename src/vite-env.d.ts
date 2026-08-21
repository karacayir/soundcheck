/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

declare const __APP_VERSION__: string

declare module 'virtual:soundcheck-content' {
  const dataset: import('./content/types').Dataset
  export default dataset
}
