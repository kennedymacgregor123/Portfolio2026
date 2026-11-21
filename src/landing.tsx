import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"

import { About } from "./about"
import { ARTIFACTS_CASE } from "./artifacts-case"
import { CaseStudyPage, type CaseStudy } from "./case-study"
import { CITATIONS_CASE } from "./citations-case"
import { CitationsHero } from "./citations-hero"
import { PLANNED_CASE, PlannedHero } from "./planned-case"
import { ReportUIHero } from "./reportui-hero"
import { ViewSwitch, type View } from "./view-switch"

/** Projects with a page of their own, by the id their link points at. */
const CASE_STUDIES: Record<string, CaseStudy> = {
  citations: CITATIONS_CASE,
  artifacts: ARTIFACTS_CASE,
  "planned-badges": PLANNED_CASE,
}

/** What the URL hash shows: the home carousel, About, or a project's page. */
type Page = { kind: "work" } | { kind: "about" } | { kind: "case"; id: string }

function pageFromHash(): Page {
  const h = window.location.hash.slice(1)
  if (h === "about") return { kind: "about" }
  if (CASE_STUDIES[h]) return { kind: "case", id: h }
  return { kind: "work" }
}

/** How long one turn of the carousel takes. Matches `--arc-ms` in landing.css. */
const ARC_MS = 650

/** Shown top left. */
const NAME = "Kennedy MacGregor"

/**
 * A hand drawn in pen, for the name's easter egg: an open palm and two
 * little motion marks, roughened by a turbulence filter so the lines wobble
 * like ink. It draws itself in, then waves.
 */
function WavingHand() {
  return (
    <svg viewBox="0 0 30 26" className="h-[19px] w-auto overflow-visible" fill="none">
      <defs>
        <filter id="pen-wobble" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="0.9" />
        </filter>
      </defs>
      <g
        filter="url(#pen-wobble)"
        stroke="#1d1d1b"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g className="hand-palm">
          {/* Fingers, then the palm and thumb, each a stroke of the pen. */}
          <path className="hand-ink" pathLength={1} d="M18.2 11.4 V6.4 a1.9 1.9 0 0 0 -3.8 0" />
          <path className="hand-ink" pathLength={1} d="M14.4 10.2 V4.3 a1.9 1.9 0 0 0 -3.8 0 v1.9" />
          <path className="hand-ink" pathLength={1} d="M10.6 10.6 V6.3 a1.9 1.9 0 0 0 -3.8 0 v7.8" />
          <path
            className="hand-ink"
            pathLength={1}
            d="M18.2 8.4 a1.9 1.9 0 1 1 3.8 0 v5.8 a7.8 7.8 0 0 1 -7.8 7.8 h-1.9 c-2.7 0 -4.4 -0.8 -5.8 -2.3 l-3.5 -3.5 a1.9 1.9 0 0 1 2.7 -2.7 l1.1 1.2"
          />
        </g>
        {/* Motion marks off the fingertips. */}
        <path className="hand-ink hand-mark" pathLength={1} d="M24.6 4.2 c1.4 0.9 2.3 2.2 2.6 3.8" />
        <path className="hand-ink hand-mark" pathLength={1} d="M25 1 c2.2 1.3 3.6 3.3 4 5.8" />
      </g>
    </svg>
  )
}

type Project = {
  id: string
  title: string
  blurb: string
  /** Where clicking the hero goes. */
  href: string
  hero: React.ReactNode
  /** The hero drawn small, for the next-project tile, where it differs. */
  preview?: React.ReactNode
}


const PROJECTS: Project[] = [
  {
    id: "artifacts",
    title: "Artifacts",
    blurb:
      "Made recurring reporting effortless by generating tailored, template-backed reports users can customize, share, and regenerate on demand.",
    href: "#artifacts",
    hero: <ReportUIHero />,
  },
  {
    id: "citations",
    title: "Citations",
    blurb:
      "Enabled transparent verification by adding citation cards to every number, quote, and derived figure.",
    href: "#citations",
    hero: <CitationsHero />,
    preview: <CitationsHero compact />,
  },
  {
    id: "planned-badges",
    title: "Planned Badges",
    blurb: "A concept for Planned: AI that turns every event badge into a branded moment, without making the builder any harder.",
    href: "#planned-badges",
    hero: <PlannedHero />,
  },
]

/** The project after this one in the carousel's order, wrapping round: what
    a case study's foot links on to. */
function nextProject(id: string) {
  const i = PROJECTS.findIndex((p) => p.id === id)
  if (i < 0 || PROJECTS.length < 2) return undefined
  const p = PROJECTS[(i + 1) % PROJECTS.length]!
  return { title: p.title, blurb: p.blurb, href: p.href, preview: p.preview ?? p.hero }
}

function Arrow({
  direction,
  onClick,
}: {
  direction: "left" | "right"
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Previous project" : "Next project"}
      className="relative z-10 flex size-9 shrink-0 sm:size-11 items-center justify-center rounded-full border border-white bg-[var(--bar)] text-muted-foreground shadow-[0_1px_2px_rgba(15,15,15,0.04),0_6px_16px_-8px_rgba(15,15,15,0.12)] transition-colors hover:bg-white hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <svg
        viewBox="0 0 16 16"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {direction === "left" ? <path d="M10 3 5 8l5 5" /> : <path d="m6 3 5 5-5 5" />}
      </svg>
    </button>
  )
}

export function Landing() {
  /* The carousel turns like a wheel. `prev` is the slide swinging out while
     the new one swings in, and `dir` says which way the wheel turns: 1 for
     next (in from the right), -1 for previous (in from the left). */
  /* `turned` is false until the first turn, so the opening slide doesn't
     swing in on page load. */
  const [{ index, prev, dir, turned }, setSlides] = useState<{
    index: number
    prev: number | null
    dir: 1 | -1
    turned: boolean
  }>({ index: 0, prev: null, dir: 1, turned: false })
  const count = PROJECTS.length
  const clearPrev = useRef<number | undefined>(undefined)
  const goTo = useCallback((next: number, direction: 1 | -1) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    setSlides((s) =>
      next === s.index
        ? s
        : { index: next, prev: reduced ? null : s.index, dir: direction, turned: !reduced },
    )
    /* The outgoing slide is removed when its swing ends (onAnimationEnd
       below); this is only a fallback, set well past the swing so it can
       never cut it short. */
    window.clearTimeout(clearPrev.current)
    clearPrev.current = window.setTimeout(
      () => setSlides((s) => ({ ...s, prev: null })),
      ARC_MS + 400,
    )
  }, [])
  const step = useCallback(
    (delta: 1 | -1) => goTo((index + delta + count) % count, delta),
    [goTo, index, count],
  )

  /* Which page shows, kept in the URL hash so #about and #citations can be
     linked to and the browser's back button moves between them. */
  const [page, setPage] = useState<Page>(pageFromHash)
  useEffect(() => {
    const onHash = () => setPage(pageFromHash())
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])
  /* Every new page opens at its top, however it was reached: the switch,
     a project, the next-project tile or the back button. Before paint, so
     the old scroll position never shows on the new page. */
  const pageKey = page.kind === "case" ? `case:${page.id}` : page.kind
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [pageKey])
  // A project page counts as Work in the switch.
  const view: View = page.kind === "about" ? "about" : "work"
  const changeView = (next: View) => {
    if (next === "about" && page.kind === "about") return
    if (next === "work" && page.kind === "work") return
    window.location.hash = next === "about" ? "about" : ""
    setPage(next === "about" ? { kind: "about" } : { kind: "work" })
  }
  const study = page.kind === "case" ? CASE_STUDIES[page.id] : undefined

  /* Opens a project's page. Set directly rather than left to the hashchange
     listener: when the URL already holds the project's hash (a reload, or a
     page opened before that study existed), no hashchange fires and the
     click would otherwise do nothing. */
  const openProject = (e: React.MouseEvent, href: string) => {
    const id = href.slice(1)
    if (!CASE_STUDIES[id] || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    if (window.location.hash !== href) window.location.hash = id
    setPage({ kind: "case", id })
    window.scrollTo(0, 0)
  }

  useEffect(() => {
    if (page.kind !== "work") return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") step(-1)
      if (e.key === "ArrowRight") step(1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [step, page.kind])

  const project = PROJECTS[index]!

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-[var(--page)] font-sans text-foreground">
      {/* A floating white bar holding the name and the switch. Its width is
          the Work row's (hero plus arrows), so it lines up with the content. */}
      <div className="header-shelf sticky top-0 z-20 px-4 pt-4 pb-3 sm:pt-5">
      <header className="site-bar mx-auto flex w-full max-w-[64rem] items-center justify-between rounded-[16px] border py-3 pr-3 pl-6">
        {study ? (
          /* On a project page the name gives way to the project's title,
             with a chevron back to the home page. Plain at rest; on hover it
             takes the switch's grey pill over exactly its own padding, so the
             hover ground is the button. Pulled left so that ground sits as
             far from the bar's edge as the switch does from the other. */
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              changeView("work")
            }}
            aria-label="Back to all work"
            className="view-switch group -ml-2.5 flex items-center gap-1 rounded-[8px] py-1 pr-2.5 pl-1.5 text-[14px] font-medium tracking-[0.2px] text-[#0f0f0f] transition-colors duration-300 hover:bg-[#e6e6e3] focus-visible:bg-[#e6e6e3] focus-visible:outline-none"
          >
            <svg
              viewBox="0 0 16 16"
              className="relative -top-[1px] size-3.5 text-[#7a7a77] transition-transform duration-200 group-hover:-translate-x-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M10 3.5 5.5 8l4.5 4.5" />
            </svg>
            {study.title}
          </a>
        ) : (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              changeView("work")
            }}
            className="project-title site-name relative inline-flex items-baseline"
            aria-label={NAME}
          >
            {/* A little easter egg: on hover the letters hop in a wave, left
                to right, and a hand pops up beside the name and waves hello. */}
            <span aria-hidden className="name-wave">
              {[...NAME].map((ch, i) => (
                <span key={i} className="name-ch" style={{ "--i": i } as React.CSSProperties}>
                  {ch === " " ? "\u00a0" : ch}
                </span>
              ))}
            </span>
            <span aria-hidden className="name-hand">
              <WavingHand />
            </span>
          </a>
        )}
        <ViewSwitch view={view} onChange={changeView} />
      </header>
      </div>

      {study ? (
        <CaseStudyPage key={page.kind === "case" ? page.id : ""} study={study} next={nextProject(page.kind === "case" ? page.id : "")} />
      ) : page.kind === "about" ? (
        <About />
      ) : (
      <main className="view-in flex flex-1 flex-col items-center justify-center gap-10 px-5 pt-10 pb-6 sm:px-4">
        {/* The row matches the header bar's width; the arrows sit at its ends and
            the hero keeps its own maximum between them. */}
        <div className="flex w-full max-w-[64rem] items-center justify-between gap-1.5 sm:gap-6">
          <Arrow direction="left" onClick={() => step(-1)} />

          {/* The stage holds the slide in place and, mid-turn, the one leaving.
              Each swings around a pivot far below the hero, so both travel
              the same arc in opposite halves. */}
          <div
            className={`arc-stage relative aspect-square min-w-0 max-w-[47.5rem] flex-1 sm:aspect-[16/10] ${
              prev !== null ? "turning" : ""
            }`}
          >
            {/* Keyed by project, so the slide that was showing stays the same
                element as it leaves and swings out exactly as it looked. */}
            {(prev === null ? [index] : [prev, index]).map((i) => {
              const p = PROJECTS[i]!
              const leaving = i !== index
              /* The showing slide keeps its swing-in class until the next
                 turn: the animation holds its end state, so nothing changes
                 when the leaving slide is removed. */
              const motion = leaving
                ? dir === 1
                  ? "arc-out-left"
                  : "arc-out-right"
                : !turned
                  ? ""
                  : dir === 1
                    ? "arc-in-right"
                    : "arc-in-left"
              return (
                <div
                  key={p.id}
                  aria-hidden={leaving || undefined}
                  inert={leaving || undefined}
                  className={`arc-slide absolute inset-0 ${motion}`}
                  onAnimationEnd={(e) => {
                    if (leaving && e.target === e.currentTarget) {
                      setSlides((s) => (s.prev === i ? { ...s, prev: null } : s))
                    }
                  }}
                >
                  {/* The hero holds its own links (the card's Studio button),
                      so the project link is laid over it, not wrapped. */}
                  <div className="hero-slide relative h-full w-full">
                    {p.hero}
                    <a
                      href={p.href}
                      onClick={(e) => openProject(e, p.href)}
                      aria-label={`Open ${p.title}`}
                      className="absolute inset-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <Arrow direction="right" onClick={() => step(1)} />
        </div>

        <div className="flex flex-col items-center gap-3 px-3 text-center sm:px-0">
          {/* The caption opens the project too. A chevron beside the title
              appears whenever the project or its caption is hovered, to say
              the whole thing is a link. It sits outside the title's box, so
              the title stays centred. */}
          <a href={project.href} onClick={(e) => openProject(e, project.href)} className="project-caption block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">
            <h1 className="project-title">
              <span className="relative whitespace-nowrap">
              {project.title}
              <svg
                viewBox="0 0 16 16"
                className="title-chevron absolute top-1/2 left-full -mt-[5.5px] ml-1 size-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="m6 3.5 4.5 4.5L6 12.5" />
              </svg>
              </span>
            </h1>
            <p className="project-blurb mx-auto mt-1 max-w-[34rem] text-balance">
              {project.blurb}
            </p>
          </a>
          <div className="flex gap-2" role="tablist" aria-label="Projects">
            {PROJECTS.map((p, i) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={p.title}
                onClick={() => goTo(i, i > index ? 1 : -1)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-foreground" : "w-1.5 bg-border hover:bg-muted-foreground"
                }`}
              />
            ))}
          </div>
        </div>
      </main>
      )}
    </div>
  )
}
