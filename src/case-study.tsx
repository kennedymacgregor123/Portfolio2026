import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

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
  /** A wide image under the header, before the first section. */
  hero?: React.ReactNode
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

/** A section's media, with its caption numbered as a figure (Fig. 01…). */
function MediaSlot({ media, figure }: { media: Media; figure: number }) {
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
        <figcaption className="case-caption">
          <span className="case-fig">Fig. {String(figure).padStart(2, "0")}</span>
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
 * marked. Beside the content on wide screens; on phones, SectionDial below.
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

/**
 * The legend on a phone: a dial floating at the foot of the screen. The
 * sections sit in a row that scrolls sideways and snaps each one to the
 * middle; the further a section is from the middle, the smaller and fainter
 * it is, and the row fades out at both ends, so it reads as a wheel turning.
 * As the reader moves down the page the dial turns to keep the current
 * section centred; tapping a section jumps to it.
 */
function SectionDial({ sections, active }: { sections: Section[]; active: string }) {
  const track = useRef<HTMLOListElement>(null)
  const items = useRef<(HTMLLIElement | null)[]>([])
  /** True while a finger is on the dial, so the page doesn't turn it back. */
  const touching = useRef(false)

  // Each section's distance from the middle (0 at the centre, 1 at the edge),
  // written to a CSS variable that sizes and fades it. Repainted as it scrolls.
  useEffect(() => {
    const t = track.current
    if (!t) return
    let raf = 0
    const paint = () => {
      raf = 0
      const r = t.getBoundingClientRect()
      const mid = r.left + r.width / 2
      for (const li of items.current) {
        if (!li) continue
        const b = li.getBoundingClientRect()
        const d = Math.min(1, Math.abs(b.left + b.width / 2 - mid) / (r.width / 2))
        li.style.setProperty("--d", d.toFixed(3))
      }
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(paint)
    }
    paint()
    t.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      cancelAnimationFrame(raf)
      t.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [])

  // Turn the dial to the section being read, unless it's in the reader's hand.
  useEffect(() => {
    const t = track.current
    const li = items.current[sections.findIndex((s) => s.id === active)]
    if (!t || !li || touching.current) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    t.scrollTo({ left: li.offsetLeft + li.offsetWidth / 2 - t.clientWidth / 2, behavior: reduced ? "auto" : "smooth" })
  }, [active, sections])

  const hold = () => {
    touching.current = true
  }
  const release = () => {
    window.setTimeout(() => {
      touching.current = false
    }, 800)
  }

  // Rendered on the page body: the page fades in with a transform, and a
  // fixed element inside a transformed one is fixed to it, not the screen.
  return createPortal(
    <nav aria-label="Sections" className="section-dial case-legend lg:hidden">
      <ol
        ref={track}
        onTouchStart={hold}
        onTouchEnd={release}
        onPointerDown={hold}
        onPointerUp={release}
        className="section-dial-track relative flex items-center gap-1 overflow-x-auto py-1.5"
      >
        {sections.map((s, i) => {
          const on = s.id === active
          return (
            <li
              key={s.id}
              ref={(el) => {
                items.current[i] = el
              }}
              className="section-dial-item shrink-0"
            >
              <button
                type="button"
                aria-current={on ? "true" : undefined}
                onClick={() => scrollToSection(s.id)}
                className={`flex items-center gap-2 rounded-[8px] px-2.5 py-1.5 whitespace-nowrap transition-colors duration-200 ${
                  on ? "bg-[#e6e6e3] text-[#0f0f0f]" : "text-[#7a7a77]"
                }`}
              >
                <span className="tabular-nums text-[11px] text-[#a3a3a0]">{String(i + 1).padStart(2, "0")}</span>
                <span className={on ? "font-medium" : ""}>{s.label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>,
    document.body,
  )
}

/** The project a case study hands on to, shown in the tile at its foot. */
export type NextProject = {
  title: string
  blurb: string
  href: string
  /** The project's image from the home page. */
  preview: React.ReactNode
}

/**
 * The tile at the foot of a case study: the next project's name and line,
 * beside its home-page image. The whole tile is the link; on hover it lifts
 * a little and its arrow steps forward.
 */
function NextProjectTile({ next }: { next: NextProject }) {
  return (
    <a
      href={next.href}
      aria-label={`Next project: ${next.title}`}
      className="next-tile case-media group/next relative flex flex-col overflow-hidden no-underline transition-[translate,box-shadow] duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground sm:flex-row sm:items-stretch"
    >
      <div className="flex flex-col justify-center gap-2 px-6 pt-6 pb-2 sm:w-[44%] sm:py-8 sm:pr-2 sm:pl-8">
        <span className="case-heading">{next.title}</span>
        <span className="case-text !text-[14px] text-balance">{next.blurb}</span>
        <span className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0f0f0f]">
          View case study
          <svg
            viewBox="0 0 16 16"
            className="size-3.5 transition-transform duration-300 group-hover/next:translate-x-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </span>
      </div>
      {/* The project's own home-page image, shown as a picture of it: not a
          control, so it neither takes focus nor answers the pointer. */}
      <div inert aria-hidden className="pointer-events-none relative aspect-[16/10] min-w-0 flex-1 sm:aspect-auto sm:min-h-[15rem]">
        <div className="absolute inset-0">{next.preview}</div>
      </div>
    </a>
  )
}

export function CaseStudyPage({ study, next }: { study: CaseStudy; next?: NextProject }) {
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
        {/* Wide screens: the list beside the content. Phones: the dial at the
            foot of the screen. */}
        <aside className="case-legend-wrap sticky top-[108px] z-10 hidden self-start lg:block">
          <Legend sections={study.sections} active={active} />
        </aside>
        <SectionDial sections={study.sections} active={active} />

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

          {study.hero && <div className="case-hero -mt-12">{study.hero}</div>}

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
              <MediaSlot media={s.media} figure={i + 1} />
            </section>
          ))}

          {next && <NextProjectTile next={next} />}
        </article>
      </div>
    </main>
  )
}
