import { RefreshCw, Users } from "lucide-react"

import { INK, Kpi, LINE, Meta, WinRateChart } from "./reportui-hero"
import { Scaled } from "./report-kit"

/*
 * The Artifacts case study's hero: one report, the ICP Analysis, rising out
 * of a wide panel the way a template's report rises out of its card, with
 * two notes beside it saying what makes it an Artifact: it runs on a cadence,
 * and a team reads it. Laid out on a fixed stage and scaled to the page.
 */

const STAGE_W = 1100
const STAGE_H = 470
const FONT = "font-['Inter_Variable',Inter,sans-serif]"

/** A small floating label beside the report. */
function Note({ icon, children, className, delay }: { icon: React.ReactNode; children: React.ReactNode; className: string; delay: number }) {
  return (
    <div
      className={`artifact-hero-in absolute flex items-center gap-2 rounded-full border bg-white px-3.5 py-2 text-[13px] font-medium shadow-[0_1px_2px_rgba(15,15,15,0.04),0_10px_24px_-12px_rgba(15,15,15,0.18)] ${FONT} ${className}`}
      style={{ borderColor: LINE, color: INK, animationDelay: `${delay}ms` }}
    >
      <span className="flex size-6 items-center justify-center rounded-full" style={{ background: "#e9f6ef", color: "#2f855a" }}>
        {icon}
      </span>
      {children}
    </div>
  )
}

export function ArtifactsHero() {
  return (
    <div inert aria-hidden className="case-media relative overflow-hidden">
      <Scaled width={STAGE_W}>
        <div className="relative" style={{ height: STAGE_H }}>
          {/* The report, running off the panel's foot. */}
          <div
            className={`artifact-hero-in absolute inset-x-0 top-[46px] mx-auto w-[640px] rounded-[14px] border bg-[#fbfbfa] px-[44px] pt-[36px] pb-[60px] shadow-[0_1px_2px_rgba(15,15,15,0.04),0_18px_40px_-16px_rgba(15,15,15,0.16)] ${FONT}`}
            style={{ borderColor: LINE, color: INK, animationDelay: "120ms" }}
          >
            <div className="text-[11.5px]" style={{ color: "#4b5160" }}>
              Vasco
            </div>
            <div className="mt-[8px] text-[28px] leading-none font-semibold tracking-[-0.3px]">ICP Analysis</div>
            <div className="mt-[18px] flex">
              <Meta first label="Period" value="Q4 FY 2026" />
              <Meta label="Overall score" value="6.4/10" />
              <Meta label="Bottleneck" value="Demand Generation" />
            </div>
            <p className="mt-[18px] text-[14px] leading-[1.45]" style={{ color: "#3b4150" }}>
              Trailing trend across Q1–Q4 FY2026. Numbers reconciled against the Metric Engine; recommendations
              weigh the trade-offs for FY27 planning.
            </p>
            <div className="mt-[22px] text-[17px] font-semibold">Revenue Health Scorecard</div>
            <div className="mt-[12px] flex gap-[10px]">
              <Kpi at={0} label="Starting ARR" value="$688K" note="Beginning of FY" />
              <Kpi at={0} label="Ending ARR" value="$1.24M" note="End of FY" down />
              <Kpi at={0} label="Net New ARR" value="$512K" note="Across 4 quarters" />
            </div>
            <div className="mt-[22px] text-[17px] font-semibold">Win-rate trend (rolling 90d)</div>
            <WinRateChart />
          </div>

          {/* What makes it an Artifact: it recurs, and a team reads it. */}
          <Note icon={<RefreshCw strokeWidth={2.25} className="size-[13px]" aria-hidden />} className="top-[150px] left-[92px]" delay={420}>
            Runs every Monday
          </Note>
          <Note icon={<Users strokeWidth={2.25} className="size-[13px]" aria-hidden />} className="top-[300px] right-[92px]" delay={560}>
            Shared with Sales
          </Note>
        </div>
      </Scaled>
    </div>
  )
}
