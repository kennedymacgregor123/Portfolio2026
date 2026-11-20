import { useLayoutEffect, useRef, useState } from "react"

import type { Citation } from "./cite/citation"
import { CitationGroup } from "./cite/citation-group"
import {
  agentComputed,
  connectorNative,
  countedAccounts,
  groupedPair,
  namedAccount,
  namedChampion,
  pipelineCreated,
  quotedActivity,
  signalPain,
} from "./cite/fixtures"

/** Every kind of citation, in the order the report demo introduces them. */
const TYPES: { label: string; citation: Citation }[] = [
  { label: "Metric", citation: pipelineCreated },
  { label: "Two sources", citation: groupedPair },
  { label: "Agent-computed", citation: agentComputed },
  { label: "Connector", citation: connectorNative },
  { label: "Count", citation: countedAccounts },
  { label: "Account", citation: namedAccount },
  { label: "Person", citation: namedChampion },
  { label: "Quote", citation: quotedActivity },
  { label: "Signal", citation: signalPain },
]

function Arrow({ direction, onClick }: { direction: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Previous card type" : "Next card type"}
      className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border border-white bg-[var(--bar)] text-muted-foreground shadow-[0_1px_2px_rgba(15,15,15,0.04),0_6px_16px_-8px_rgba(15,15,15,0.12)] transition-colors hover:bg-white hover:text-foreground"
    >
      <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {direction === "left" ? <path d="M10 3 5 8l5 5" /> : <path d="m6 3 5 5-5 5" />}
      </svg>
    </button>
  )
}

/**
 * Every card type, one at a time, turning on the same wheel as the home
 * page's project carousel: the next card swings in along an arc from one
 * side as the current one swings out to the other. Each card is the real
 * component, shown on its own with nothing around it.
 */
export function CardGallery() {
  const [{ index, prev, dir }, setState] = useState<{
    index: number
    prev: number | null
    dir: 1 | -1
  }>({ index: 0, prev: null, dir: 1 })
  const count = TYPES.length

  const goTo = (next: number, direction: 1 | -1) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    setState((s) =>
      next === s.index ? s : { index: next, prev: reduced ? null : s.index, dir: direction },
    )
  }
  const step = (d: 1 | -1) => goTo((index + d + count) % count, d)

  /* The stage is as tall as the tallest card, so the arrows and the label
     stay put as cards of different heights come and go. */
  const measureRef = useRef<HTMLDivElement>(null)
  const [stageH, setStageH] = useState<number>()
  useLayoutEffect(() => {
    const el = measureRef.current
    if (!el) return
    const run = () =>
      setStageH(Math.max(...[...el.children].map((c) => (c as HTMLElement).offsetHeight)))
    run()
    const ro = new ResizeObserver(run)
    ;[...el.children].forEach((c) => ro.observe(c))
    return () => ro.disconnect()
  }, [])

  return (
    <div className="card-wheel flex w-full flex-col items-center gap-6 px-4 pt-14 pb-10 sm:px-8">
      {/* Every card, rendered unseen, to find the tallest. */}
      <div ref={measureRef} className="pointer-events-none invisible absolute h-0 overflow-hidden" aria-hidden inert>
        {TYPES.map((t) => (
          <div key={t.label} className="card-wheel-card">
            <CitationGroup citation={t.citation} audience="in-app" detail="full" />
          </div>
        ))}
      </div>

      <div className="flex w-full items-center justify-between gap-2">
        <Arrow direction="left" onClick={() => step(-1)} />
        <div className="relative flex-1" style={{ height: stageH }}>
          {(prev === null ? [index] : [prev, index]).map((i) => {
            const leaving = i !== index
            const motion =
              prev === null
                ? ""
                : leaving
                  ? dir === 1
                    ? "arc-out-left"
                    : "arc-out-right"
                  : dir === 1
                    ? "arc-in-right"
                    : "arc-in-left"
            return (
              <div
                key={TYPES[i]!.label}
                className={`arc-slide absolute inset-0 flex items-center justify-center ${motion}`}
                aria-hidden={leaving || undefined}
                inert
                onAnimationEnd={(e) => {
                  if (leaving && e.target === e.currentTarget)
                    setState((s) => (s.prev === i ? { ...s, prev: null } : s))
                }}
              >
                <div className="card-wheel-card">
                  <CitationGroup citation={TYPES[i]!.citation} audience="in-app" detail="full" />
                </div>
              </div>
            )
          })}
        </div>
        <Arrow direction="right" onClick={() => step(1)} />
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="project-title" aria-live="polite">
          {TYPES[index]!.label}
        </p>
        <div className="flex gap-2" role="tablist" aria-label="Card types">
          {TYPES.map((t, i) => (
            <button
              key={t.label}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={t.label}
              onClick={() => goTo(i, i > index ? 1 : -1)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-5 bg-foreground" : "w-1.5 bg-border hover:bg-muted-foreground"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
