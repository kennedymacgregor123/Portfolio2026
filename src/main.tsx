import { StrictMode, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

import "./landing.css"
import { Landing } from "./landing"
import { PlannedBadge } from "./planned-badge"

/**
 * The site, or the Planned badge-builder prototype, full screen: #planned is
 * the new version, #planned-today the builder as it is today, and
 * #planned-empty the new version with nothing to go on yet.
 */
function Root() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const on = () => setHash(window.location.hash)
    window.addEventListener("hashchange", on)
    return () => window.removeEventListener("hashchange", on)
  }, [])
  if (hash === "#planned") return <PlannedBadge key={hash} />
  if (hash === "#planned-today") return <PlannedBadge key={hash} ai={false} />
  if (hash === "#planned-empty") return <PlannedBadge key={hash} known={false} />
  return <Landing />
}

/*
 * The loader (drawn in index.html) shows while the fonts load, and for at
 * least a moment so the dots get a hop in. Then the site mounts and the
 * loader fades away over it, so the page's own entrance animations start
 * just as it lifts rather than playing unseen beneath it.
 */
const MIN_MS = 1100
const started = performance.now()
const fontsReady = document.fonts?.ready ?? Promise.resolve()
const atLeast = new Promise((r) => setTimeout(r, Math.max(0, MIN_MS - (performance.now() - started))))
// Never hold the page longer than this, whatever the fonts are doing.
const atMost = new Promise((r) => setTimeout(r, 3000))

Promise.race([Promise.all([fontsReady, atLeast]), atMost]).then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Root />
    </StrictMode>,
  )
  const loader = document.getElementById("loader")
  requestAnimationFrame(() => {
    loader?.classList.add("done")
    window.setTimeout(() => loader?.remove(), 600)
  })
})
