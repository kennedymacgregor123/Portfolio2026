import { CitationCard, SLOT_HOLDS, SLOT_ORDER } from "./cite/citation-card"
import { useLayoutEffect, useRef, useState } from "react"

import { citedThenDrifted, pipelineCreated } from "./cite/fixtures"

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
    <div className="grid w-full items-start gap-8 md:grid-cols-[minmax(0,21rem)_1fr] md:gap-10">
      <div className="justify-self-center">
        <CitationCard citation={pipelineCreated} audience="in-app" detail="full" showSlots />
      </div>
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
    <div className="relative w-full max-w-[30rem] pt-8 text-left">
      {/* A reader's note on the printout, arrowed at the first claim. The
          top padding leaves it room inside the panel. */}
      <ScribbleNote>Is this true??</ScribbleNote>
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
    <div ref={ref} className={`relative w-full max-w-[32rem] pt-8 text-left ${wide ? "pb-14" : "pb-24"}`}>
      <ScribbleNote target="[data-drift-report]" className="top-0 right-1 sm:-right-4">
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
      <div className={`drift-card cited-popover mt-3 w-fit ${wide ? "ml-auto" : ""}`} inert>
        <CitationCard citation={citedThenDrifted} audience="in-app" detail="simplified" />
      </div>
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
    { label: "Role", value: "Senior Product Designer" },
    { label: "Team", value: "Me and 2 engineers" },
    { label: "Timeline", value: "2026-09" },
    { label: "Company", value: "Vasco" },
  ],
  sections: [
    {
      id: "problem",
      label: "Problem",
      title: "Reports full of numbers, and nothing to back them up",
      blurb: [
        "Vasco generates reports for go-to-market teams: pipeline, win rates, what customers are saying. Before this work, every figure in them arrived on its own. There were no citations, so there was no way to see where a number came from, what it counted, or whether it was right.",
        "That matters more with AI than without it. A language model can produce an answer that is fluent, specific and confidently wrong, and on the page it looks exactly like one that's right. Picture showing your CFO a report you generated, and being asked where a number came from. You have no answer. One unexplained number is enough to make them doubt the rest.",
      ],
      media: {
        kind: "demo",
        caption: "Before: every figure and claim arrives on its own, with nothing to check it against.",
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
        caption:
          "The live-card option, and why Customer Success couldn't accept it: the report and its own citation give two different numbers.",
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
        caption: "The metric card with its slots shown, and what each one holds.",
        node: <AnatomyBreakdown />,
      },
    },
    {
      id: "types",
      label: "Card types",
      title: "Every kind of citation, one card",
      blurb: [
        "Nine kinds of citation, each filling the same seven slots in its own way: a metric lists the accounts behind it, a person leaves the evidence empty, a quote shows the lines around it, a signal lists the conversations it was read from.",
      ],
      media: {
        kind: "demo",
        caption: "Every card type. Use the arrows or dots to turn through them.",
        interactive: true,
        bleed: true,
        node: <CardGallery />,
      },
    },
    {
      id: "decisions",
      label: "Key decisions",
      title: "One card, seven slots, and a few rules that hold across every type",
      blurb: [
        "One card for every kind of citation. Rather than design a card per type, I designed a fixed list of seven slots: source, header, pager, description, chips, evidence and call to action. Each kind of citation fills a slot or leaves it empty. A metric lists the accounts behind it; a named account leaves the evidence slot empty, because the thing either exists or it doesn't.",
        "The figure is the title. A reader opens a card to check the number, so the number leads and its name is read beside it. The card takes one title that names the subject, never the raw query; the query becomes what the link opens.",
        "The card agrees with the report. Because each citation snapshots the accounts behind a number and their values, the figure on the card is the figure in the report, and the list underneath adds up to it. The full, detailed account list is one click away rather than stored in every citation.",
        "Audience is a setting, not a second card. In the app and on a shared link it's the same card: a public reader loses the account names and the deep link, and gets a count instead.",
      ],
      media: {
        kind: "demo",
        caption:
          "Every kind of citation marked in a report. Each mark opens its own card.",
        interactive: true,
        node: <CitedReport />,
      },
    },
    {
      id: "outcome",
      label: "Outcome",
      title: "One anatomy, and the open questions answered",
      blurb: [
        "The feature survived its make-or-break moment. The partial snapshot answered the hardest open question, whether a card shows the number as the report cited it or as it is now, in a way Customer Success could stand behind and engineering could build. The prototype also settled what titles a card and what a group of adjacent citations opens, and extended the same seven slots to four new kinds of citation from the context graph (counts, named entities, quotes and signals) without adding a new card for any of them.",
        "The result is a single, documented anatomy, with every decision and its reasoning written down. Every number, quote and derived figure in a report can now point to where it came from, and a reader can check it before they repeat it.",
        "Adoption was strong from launch. We track citations in Amplitude, both opens of the card and click-throughs to the detailed view, and the most telling signal is a curve that goes down: readers who have already used citations open them less and less over time. Early on, people checked the work. Once the evidence had held up, they stopped needing to. That's the outcome the feature was built for: trust that's earned once and carried forward, rather than re-checked on every number.",
      ],
      media: {
        kind: "demo",
        caption:
          "Drag to compare the same report before and after citations. On the cited side, each mark opens its card.",
        interactive: true,
        bleed: true,
        node: <BeforeAfter />,
      },
    },
  ],
}
