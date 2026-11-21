import { ChartSpline, Lightbulb } from "lucide-react"

import { INK, Kpi, LINE, Meta, WinRateChart } from "./reportui-hero"
import { Scaled } from "./report-kit"
import { KitCallout, KitTile, KitTrend } from "./artifacts-case"

/*
 * The Artifacts case study's hero: one report, the ICP Analysis, rising out
 * of a wide panel the way a template's report rises out of its card, with
 * two notes beside it saying what makes it an Artifact: it runs on a cadence,
 * and a team reads it. Laid out on a fixed stage and scaled to the page.
 */

const STAGE_W = 1100
const STAGE_H = 470
const FONT = "font-['Inter_Variable',Inter,sans-serif]"

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

          {/* Two pieces of the kit the report is built from, floating either
              side of it: the trend chart and the callout. */}
          <div
            className="artifact-hero-in absolute top-[118px] left-[44px] z-10 w-[240px] rounded-[14px] shadow-[0_2px_4px_rgba(15,15,15,0.03),0_22px_44px_-20px_rgba(15,15,15,0.22)]"
            style={{ animationDelay: "420ms", scale: "0.86", transformOrigin: "top left" }}
          >
            <KitTile name="Trend chart" icon={<ChartSpline strokeWidth={2} className="size-[12px]" />}>
              <KitTrend />
            </KitTile>
          </div>
          <div
            className="artifact-hero-in absolute top-[250px] right-[44px] z-10 w-[240px] rounded-[14px] shadow-[0_2px_4px_rgba(15,15,15,0.03),0_22px_44px_-20px_rgba(15,15,15,0.22)]"
            style={{ animationDelay: "560ms", scale: "0.86", transformOrigin: "top right" }}
          >
            <KitTile name="Callout" icon={<Lightbulb strokeWidth={2} className="size-[12px]" />}>
              <KitCallout />
            </KitTile>
          </div>
        </div>
      </Scaled>
    </div>
  )
}
