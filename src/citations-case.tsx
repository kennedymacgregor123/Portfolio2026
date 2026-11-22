import { CitationsCascade } from "./citations-cascade"
import { CitationCard, SLOT_HOLDS, SLOT_ORDER } from "./cite/citation-card"
import { useLayoutEffect, useRef, useState } from "react"

import { citedThenDrifted, pipelineCreated } from "./cite/fixtures"
import { Scaled } from "./report-kit"

/** Renders its child with whether the window is at least sm (640px) wide. */
function NarrowAware({ children }: { children: (wide: boolean) => React.ReactNode }) {
  const [wide, setWide] = useState(() => typeof window === "undefined" || window.matchMedia("(min-width: 640px)").matches)
  useLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)")
    const on = () => setWide(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return <>{children(wide)}</>
}

/** The card's own width, from the prototype. */
const CARD_W = 336

/**
 * A citation card that keeps its proportions in a narrow panel: drawn at its
 * own width and scaled down to fit when there isn't room (a phone), never
 * scaled up past its real size.
 */
function FitCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-full max-w-[21rem] ${className}`}>
      {/* Unclipped, so the card's drop shadow isn't cut off at its edges. */}
      <Scaled width={CARD_W} clip={false}>
        {children}
      </Scaled>
    </div>
  )
}

/** How each slot is named in the breakdown. */
const SLOT_LABEL: Record<(typeof SLOT_ORDER)[number], string> = {
  source: "Source",
  header: "Header",
  pager: "Pager",
  description: "Description",
  chips: "Chips",
  evidence: "Evidence",
  cta: "Call to action",
}

/**
 * The anatomy: the live card with every slot framed and named (the
 * prototype's own instrument, not a drawing of it), beside what each slot
 * holds, in the order the card renders them.
 */
function AnatomyBreakdown() {
  return (
    <div className="grid w-full grid-cols-[minmax(0,1fr)] items-start gap-8 md:grid-cols-[minmax(0,21rem)_1fr] md:gap-10">
      <FitCard className="justify-self-center">
        <CitationCard citation={pipelineCreated} audience="in-app" detail="full" showSlots />
      </FitCard>
      <ol className="flex flex-col gap-3.5 text-left">
        {SLOT_ORDER.map((slot, i) => (
          <li key={slot} className="grid grid-cols-[1.75rem_1fr] gap-x-2">
            <span className="tabular-nums text-[12px] leading-[1.6] text-[#a3a3a0]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="project-title !text-[14px]">{SLOT_LABEL[slot]}</span>
              <span className="project-blurb">{SLOT_HOLDS[slot]}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

import type { CaseStudy } from "./case-study"
import { BeforeAfter } from "./before-after"
import { CardGallery } from "./card-gallery"
import { CitedReport } from "./cited-report"
import { ScribbleNote } from "./scribble-note"

/**
 * The before state: a generated report whose numbers and claims arrive on
 * their own, with nothing marked and nothing to open. Invented figures.
 */
function UncitedReport() {
  return (
    <div className="relative w-full max-w-[30rem] pt-12 text-left sm:pt-8">
      {/* A reader's note on the printout, arrowed at the first claim. The
          top padding leaves it room inside the panel. */}
      {/* On a phone the figure sits to the right of the note, so an arrow
          would double back through it: there the figure is circled instead. */}
      <NarrowAware>
        {(wide) => (
          <ScribbleNote key={wide ? "wide" : "narrow"} arrow={wide} ring={!wide}>
            Is this true??
          </ScribbleNote>
        )}
      </NarrowAware>
      <p className="project-title">Q3 pipeline review: EMEA</p>
      <div className="case-text mt-3 flex flex-col gap-3 !text-[14px]">
        <p>
          EMEA closed the quarter at <span data-scribble-target>112% of plan</span>, with $1.28M in new pipeline
          created over the last 90 days. Win rate held at 31% while average deal
          size grew 18%, driven mostly by expansion in existing accounts.
        </p>
        <p>
          Meetings booked rose for the third month in a row, up 24% on Q2, and
          the time from first call to proposal fell by 6 days. Ramp, Linear and
          Vercel account for 42% of open pipeline.
        </p>
        <p>
          Three late-stage deals worth $640K share a single procurement path, and
          are the main risk to the forecast. Customers most often cite reporting
          accuracy as the reason they buy.
        </p>
      </div>
    </div>
  )
}

/**
 * The hurdle, shown: what a live card does beside a static report. The
 * report was written when the count was 37; the card, read live, now says
 * 57. Red notes point at the two numbers. Uses the prototype's own drifted
 * fixture, so the card is the real one.
 */
function DriftExample() {
  const ref = useRef<HTMLDivElement>(null)
  /* Wide enough to hang the card under the mark with a note beside it; on a
     narrow screen the card sits flush and the note goes underneath. */
  const [wide, setWide] = useState(true)
  // Mark the card's figure as the second note's target, and track the width.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const leaf = [...el.querySelectorAll<HTMLElement>(".drift-card *")].find(
      (e) => e.children.length === 0 && e.textContent?.trim() === "57",
    )
    leaf?.setAttribute("data-drift-card", "")
    const ro = new ResizeObserver(() => setWide(el.clientWidth >= 500))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={ref} className={`relative w-full max-w-[32rem] text-left ${wide ? "pt-8 pb-14" : "pt-12 pb-24"}`}>
      {/* On a narrow screen the arrow has too little room, so the note stands alone. */}
      <ScribbleNote key={wide ? "report-wide" : "report-narrow"} target="[data-drift-report]" arrow={wide} className="top-0 right-1 sm:-right-4">
        Report says 37…
      </ScribbleNote>
      <p className="project-title">Pipeline review: EMEA</p>
      <p className="case-text mt-2 !text-[14px]">
        As of 12 September, EMEA has{" "}
        <span data-drift-report className="cite-mark is-on tabular-nums">
          37 accounts
        </span>{" "}
        in pipeline, up from 29 at the start of the{" "}quarter.
      </p>
      {/* Hung under the mark, the way the card opens from it. */}
      <FitCard className={`mt-3 ${wide ? "ml-auto" : ""}`}>
        <div className="drift-card cited-popover w-fit" inert>
          <CitationCard citation={citedThenDrifted} audience="in-app" detail="simplified" />
        </div>
      </FitCard>
      {wide ? (
        <ScribbleNote
          key="wide"
          target="[data-drift-card]"
          approach="left"
          ring
          className="top-[9.25rem] left-0 w-[8.5rem] !text-[21px] !leading-[1.05] !whitespace-normal"
        >
          …but the card says 57?!
        </ScribbleNote>
      ) : (
        <ScribbleNote
          key="narrow"
          target="[data-drift-card]"
          arrow={false}
          ring
          className="bottom-11 left-0"
        >
          …but the card says 57?!
        </ScribbleNote>
      )}
      <ScribbleNote target={null} className="bottom-0 left-0 !rotate-[-2deg] !text-[19px]">
        The card is live. The report isn't.
      </ScribbleNote>
    </div>
  )
}

/*
 * The Citations case study. Everything in square brackets is a placeholder:
 * replace it with your own words. To swap a media slot for an image, put the
 * file in `landing/public/` and use
 *   media: { kind: "image", src: "/your-file.png", alt: "What it shows" }
 */

export const CITATIONS_CASE: CaseStudy = {
  title: "Citations",
  summary:
    "Enabled transparent verification by adding citation cards to every number, quote, and derived figure.",
  facts: [
    { label: "Company", value: "Vasco" },
    { label: "Role", value: "Senior Product Designer" },
    { label: "Team", value: "Me and 2 engineers" },
    { label: "Timeline", value: "2026-09" },
  ],
  hero: <CitationsCascade />,
  sections: [
    {
      id: "problem",
      label: "Problem",
      title: "Plenty of numbers, no receipts",
      blurb: [
        "Vasco generates reports for go-to-market teams: pipeline, win rates, what customers are saying. Before this work, every figure in them arrived on its own. There were no citations, so there was no way to see where a number came from, what it counted, or whether it was right.",
        "That matters more with AI than without it. A language model can produce an answer that is fluent, specific and confidently wrong, and on the page it looks exactly like one that's right. Picture showing your CFO a report you generated, and being asked where a number came from. You have no answer. One unexplained number is enough to make them doubt the rest.",
      ],
      media: {
        kind: "demo",
        caption: "A report with nothing behind its numbers.",
        node: <UncitedReport />,
      },
    },
    {
      id: "role",
      label: "My role",
      title: "From how a citation is generated to how it reads",
      blurb: [
        "I owned citations end to end, from how a citation is generated to the card a reader opens to check it, working alongside two engineers. I designed in code: a working prototype tested against real cases, with every decision and its reasoning written down.",
        "The make-or-break moment was what a citation stores. Snapshotting everything behind every number was too heavy to store, and a live card would drift from the static report around it. Customer Success said they'd rather not ship citations at all than ship that. I pushed for a third option and worked it through with the engineers: a partial snapshot that keeps the accounts behind a number and their values, and links out to the full list.",
      ],
      media: {
        kind: "demo",
        caption: "The live card and the report disagree: 37 vs 57.",
        node: <DriftExample />,
      },
    },
    {
      id: "anatomy",
      label: "Anatomy",
      title: "The card, slot by slot",
      blurb: [
        "Every citation renders the same seven slots, in the same order. A kind of citation fills a slot or leaves it empty; nothing is added and nothing is taken away. That is what lets one card serve a metric, a count, a named account, a quote and a signal.",
        "The card below is a recreation of the prototype's, with each slot outlined and named, so an empty one is visible rather than missing.",
      ],
      media: {
        kind: "demo",
        caption: "The metric card, slot by slot.",
        node: <AnatomyBreakdown />,
      },
    },
    {
      id: "types",
      label: "Card types",
      title: "Metrics, people, quotes and signals",
      blurb: [
        "Nine kinds of citation, each filling the same seven slots in its own way: a metric lists the accounts behind it, a person leaves the evidence empty, a quote shows the lines around it, a signal lists the conversations it was read from.",
      ],
      media: {
        kind: "demo",
        caption: "Every card type.",
        interactive: true,
        bleed: true,
        node: <CardGallery />,
      },
    },
    {
      id: "decisions",
      label: "Key decisions",
      title: "A few rules that hold everywhere",
      blurb: [
        "One card for every kind of citation. Rather than design a card per type, I designed a fixed list of seven slots: pager, source, header, description, chips, evidence and call to action. Each kind of citation fills a slot or leaves it empty. A metric lists the accounts behind it; a named account leaves the evidence slot empty, because the thing either exists or it doesn't.",
        "The figure is the title. A reader opens a card to check the number, so the number leads and its name is read beside it. The card takes one title that names the subject, never the raw query; the query becomes what the link opens.",
        "The card agrees with the report. Because each citation snapshots the accounts behind a number and their values, the figure on the card is the figure in the report, and the list underneath adds up to it. The full, detailed account list is one click away rather than stored in every citation.",
        "Audience is a setting, not a second card. In the app and on a shared link it's the same card: a public reader loses the account names and the deep link, and gets a count instead.",
      ],
      media: {
        kind: "demo",
        caption: "Each mark opens its own card.",
        interactive: true,
        node: <CitedReport />,
      },
    },
    {
      id: "outcome",
      label: "Outcome",
      title: "The open questions, answered",
      blurb: [
        "The feature survived its make-or-break moment. The partial snapshot answered the hardest open question, whether a card shows the number as the report cited it or as it is now, in a way Customer Success could stand behind and engineering could build. The prototype also settled what titles a card and what a group of adjacent citations opens, and extended the same seven slots to four new kinds of citation from the context graph (counts, named entities, quotes and signals) without adding a new card for any of them.",
        "The result is a single, documented anatomy, with every decision and its reasoning written down. Every number, quote and derived figure in a report can now point to where it came from, and a reader can check it before they repeat it.",
        "Adoption was strong from launch. We track citations in Amplitude, both opens of the card and click-throughs to the detailed view, and the most telling signal is a curve that goes down: readers who have already used citations open them less and less over time. Early on, people checked the work. Once the evidence had held up, they stopped needing to. That's the outcome the feature was built for: trust that's earned once and carried forward, rather than re-checked on every number.",
      ],
      media: {
        kind: "demo",
        caption: "Before and after citations. Drag to compare.",
        interactive: true,
        bleed: true,
        node: <BeforeAfter />,
      },
    },
  ],
}
