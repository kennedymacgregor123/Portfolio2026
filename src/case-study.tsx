import { useEffect, useRef, useState } from "react"

/*
 * A project case study: a short summary, then the sections in the order a UX
 * case study is read (problem, role, decisions, outcome), with a vertical
 * legend that tracks where the reader is.
 *
 * Each section has a title, a blurb and a media slot. The media slot takes an
 * image (`{ kind: "image", src, alt }`), a live component as a working
 * prototype (`{ kind: "demo", node }`), or nothing yet (a placeholder).
 */

export type Media =
  | { kind: "image"; src: string; alt: string; caption?: string }
  | {
      kind: "demo"
      node: React.ReactNode
      caption?: string
      /** Shows the "Interactive" tag, for panels a visitor can play with. */
      interactive?: boolean
      /** The demo fills the panel edge to edge and handles its own padding. */
      bleed?: boolean
    }
  | { kind: "placeholder"; label: string }

export type Section = {
  id: string
  /** Short name in the legend. */
  label: string
  title: string
  /** One or more paragraphs. */
  blurb: string[]
  media: Media
}

export type CaseStudy = {
  title: string
  summary: string
  /** Small facts shown under the summary, such as role, team, timeline. */
  facts: { label: string; value: string }[]
  sections: Section[]
}

/**
 * A small tag in a panel's top corner saying it can be played with: a cursor
 * mid-click, which taps when the panel is hovered, and the word.
 */
function InteractiveTag() {
  return (
    <span className="interactive-tag pointer-events-none absolute top-4 right-4 z-40 inline-flex items-center gap-1.5 rounded-full border border-white bg-white/70 py-1 pr-2.5 pl-2 text-[11.5px] tracking-[0.2px] text-[#4a4a4a] shadow-[0_1px_2px_rgba(15,15,15,0.05)] backdrop-blur-sm">
      <svg
        viewBox="0 0 24 24"
        className="interactive-pointer size-3.5 text-[#7a7a77]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {/* Click lines around the tip, then the arrow. */}
        <path d="M14 4.1 12 6M5.1 8l-2.9-.8M6 12l-1.9 2M7.2 2.2 8 5.1" />
        <path d="M9.04 9.69a.5.5 0 0 1 .65-.65l11 4.5a.5.5 0 0 1-.07.95l-4.35 1.04a1 1 0 0 0-.74.74l-1.04 4.35a.5.5 0 0 1-.95.07z" />
      </svg>
      Interactive
    </span>
  )
}

function MediaSlot({ media }: { media: Media }) {
  if (media.kind === "placeholder") {
    return (
      <div className="case-media flex aspect-[16/10] items-center justify-center border-dashed">
        <span className="project-blurb !text-[#898889]">{media.label}</span>
      </div>
    )
  }
  return (
    <figure className="flex flex-col gap-2">
      {media.kind === "image" ? (
        <img src={media.src} alt={media.alt} className="case-media w-full object-cover" />
      ) : (
        <div
          className={`case-media card-tidy group/media relative isolate flex min-h-[18rem] items-center justify-center ${
            media.bleed
              ? "overflow-hidden"
              : `p-6 sm:p-10 ${media.interactive ? "pt-12 sm:pt-14" : ""}`
          }`}
          onClickCapture={(e) => {
            // A prototype's own placeholder links (#studio, #vasco) would
            // change the page; inside a demo they do nothing.
            const a = (e.target as HTMLElement).closest('a[href^="#"]')
            if (a) e.preventDefault()
          }}
        >
          {media.interactive && <InteractiveTag />}
          {media.node}
        </div>
      )}
      {media.caption && (
        <figcaption className="project-blurb !text-[12px] !text-[#898889]">
          {media.caption}
        </figcaption>
      )}
    </figure>
  )
}

/** Scrolls to a section without touching the URL, which holds the page. */
function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })
}

/**
 * The legend: the section names in a vertical list, with the one being read
 * marked. Beside the content on wide screens; a row under the header on
 * narrow ones.
 */
function Legend({ sections, active }: { sections: Section[]; active: string }) {
  return (
    <nav aria-label="Sections" className="case-legend">
      <ol className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
        {sections.map((s, i) => {
          const on = s.id === active
          return (
            <li key={s.id} className="shrink-0">
              <button
                type="button"
                aria-current={on ? "true" : undefined}
                onClick={() => scrollToSection(s.id)}
                className={`case-legend-item flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-1.5 text-left transition-colors duration-200 ${
                  on ? "bg-[#e6e6e3] text-[#0f0f0f]" : "text-[#7a7a77] hover:text-[#0f0f0f]"
                }`}
              >
                <span className="tabular-nums text-[11px] text-[#a3a3a0]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={on ? "font-medium" : ""}>{s.label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function CaseStudyPage({ study }: { study: CaseStudy }) {
  const [active, setActive] = useState(study.sections[0]!.id)
  const refs = useRef<Record<string, HTMLElement | null>>({})

  // The page opens at the top.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // The legend follows the section whose top is nearest the upper third of
  // the window.
  useEffect(() => {
    const pick = () => {
      const line = window.innerHeight * 0.33
      let current = study.sections[0]!.id
      for (const s of study.sections) {
        const el = refs.current[s.id]
        if (el && el.getBoundingClientRect().top <= line) current = s.id
      }
      // At the very bottom, the last section is the one being read.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = study.sections[study.sections.length - 1]!.id
      }
      setActive(current)
    }
    pick()
    window.addEventListener("scroll", pick, { passive: true })
    window.addEventListener("resize", pick)
    return () => {
      window.removeEventListener("scroll", pick)
      window.removeEventListener("resize", pick)
    }
  }, [study.sections])

  return (
    <main className="view-in mx-auto w-full max-w-[56rem] px-4 pt-10 pb-32">
      <div className="lg:grid lg:grid-cols-[11rem_1fr] lg:gap-12">
        <aside className="case-legend-wrap sticky top-[60px] z-10 -mx-4 mb-8 px-4 pt-6 pb-2 lg:top-[108px] lg:mx-0 lg:mb-0 lg:self-start lg:px-0 lg:py-0">
          <Legend sections={study.sections} active={active} />
        </aside>

        <article className="flex min-w-0 flex-col gap-24">
          <header className="flex flex-col gap-3">
            <h1 className="case-title">{study.title}</h1>
            <p className="case-text max-w-[38rem]">{study.summary}</p>
            {study.facts.length > 0 && (
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                {study.facts.map((f) => (
                  <div key={f.label} className="flex flex-col gap-0.5">
                    <dt className="project-blurb !text-[12px] !text-[#898889]">{f.label}</dt>
                    <dd className="project-blurb !text-[#0f0f0f]">{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </header>

          {study.sections.map((s, i) => (
            <section
              key={s.id}
              id={s.id}
              ref={(el) => {
                refs.current[s.id] = el
              }}
              aria-labelledby={`${s.id}-title`}
              className="case-section flex flex-col gap-6"
            >
              <div className="flex flex-col gap-3">
                <p className="tabular-nums text-[12px] text-[#a3a3a0]">
                  {String(i + 1).padStart(2, "0")} / {s.label}
                </p>
                <h2 id={`${s.id}-title`} className="case-heading">
                  {s.title}
                </h2>
                {s.blurb.map((p) => (
                  <p key={p} className="case-text max-w-[38rem]">
                    {p}
                  </p>
                ))}
              </div>
              <MediaSlot media={s.media} />
            </section>
          ))}
        </article>
      </div>
    </main>
  )
}
