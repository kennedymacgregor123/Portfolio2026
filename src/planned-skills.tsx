import { useState } from "react"
import { ArrowDown, Check, FileText, Globe, Image as ImageIcon, Palette, ShieldCheck } from "lucide-react"
import { AiLabel } from "./planned-badge"

/*
 * The skills behind the Badge style field. Each one has a single job: three
 * read what the organiser gives them, one composes with a sense of taste, and
 * the last checks every draft for accessibility before it's shown.
 */

const FONT = "font-['Inter_Variable',Inter,system-ui,sans-serif]"
const INK = "#1d1d1b"
const MUTED = "#6b6b68"
const LINE = "#ebebe9"

type Icon = React.ComponentType<{ className?: string; strokeWidth?: number }>
type Finding = { label: string; value?: string; swatches?: string[] }
type Skill = {
  id: string
  stage: "Understand" | "Compose" | "Check"
  name: string
  file: string
  icon: Icon
  runs: string
  does: string
  found: Finding[]
}

const SKILLS: Skill[] = [
  {
    id: "brief",
    stage: "Understand",
    name: "Read the brief",
    file: "read-brief",
    icon: FileText,
    runs: "When the organiser types into the field.",
    does: "Turns the organiser's words into direction: the mood, who the event is for, how formal it is, and anything that has to stay.",
    found: [
      { label: "Brief", value: "“Warm and optimistic, like a launch at golden hour.”" },
      { label: "Mood", value: "Warm, optimistic, calm" },
      { label: "Audience", value: "Event and marketing leaders" },
      { label: "Must keep", value: "Event name, date and city" },
    ],
  },
  {
    id: "site",
    stage: "Understand",
    name: "Comb the website",
    file: "comb-website",
    icon: Globe,
    runs: "When a website is added or pasted.",
    does: "Reads a site's pages and styles to find its motifs, themes, colours, patterns and type, and how often each one appears.",
    found: [
      { label: "Motifs", value: "Hazy evening skies, soft grey cloud" },
      { label: "Patterns", value: "Feathered mint paint, heavy grain" },
      { label: "Colours", swatches: ["#21333A", "#5E747D", "#9ED2C5", "#E3D6A4", "#BE9F7E", "#FCFBF4"] },
      { label: "Type", value: "Geist" },
      { label: "Theme", value: "Calm, capable, a little dreamy" },
    ],
  },
  {
    id: "image",
    stage: "Understand",
    name: "Read images",
    file: "read-image",
    icon: ImageIcon,
    runs: "When a reference picture is added.",
    does: "Looks at a picture for its palette, texture, composition and mood, so a photo or last year's badge can steer the look.",
    found: [
      { label: "Picture", value: "last-years-badge.jpg" },
      { label: "Palette", swatches: ["#9CC6E0", "#C2E0E1", "#FFDBA6", "#F7C486"] },
      { label: "Texture", value: "Soft and grainy, no hard edges" },
      { label: "Composition", value: "Open sky up top, detail held low" },
    ],
  },
  {
    id: "taste",
    stage: "Compose",
    name: "Design taste",
    file: "design-taste",
    icon: Palette,
    runs: "Once the reading skills are done.",
    does: "Composes the drafts from everything the other skills found, with rules for what makes a badge look good, not just on-brand.",
    found: [
      { label: "One idea each", value: "One motif per badge, never all of them at once" },
      { label: "Person first", value: "Artwork sits behind the name, never over it" },
      { label: "Real choices", value: "Three distinct directions, not three tints of one" },
      { label: "Restraint", value: "Cut anything that doesn't help the badge read" },
    ],
  },
  {
    id: "a11y",
    stage: "Check",
    name: "Accessibility",
    file: "check-accessibility",
    icon: ShieldCheck,
    runs: "On every draft, before the organiser sees it.",
    does: "Checks each draft and sends back any that fail, so whatever is proposed stays readable for everyone, in the hall and in print.",
    found: [
      { label: "Golden hour", value: "Name 8.7:1, details 5.8:1 on the warmest part of the sky · AA and above" },
      { label: "Cloud cover", value: "Name contrast 11.2:1 on the cloud · AAA" },
      { label: "Brushstroke", value: "Name contrast 10.4:1 · AAA" },
      { label: "Every draft", value: "Names around 35 pt in print, above the usual 24 pt floor" },
      { label: "Every draft", value: "Attendee types told apart by label, not colour alone" },
      { label: "Print", value: "Name area left clear for on-site black printing, art kept out of the lanyard slot and safe zone" },
    ],
  },
]

function SkillCard({ skill, active, onSelect }: { skill: Skill; active: boolean; onSelect: () => void }) {
  const Icon = skill.icon
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className="flex w-full items-center gap-2.5 rounded-[12px] border bg-white px-3 py-2.5 text-left transition-[border-color,box-shadow]"
      style={{
        borderColor: active ? "#b9b9b5" : LINE,
        boxShadow: active ? "0 0 0 3px rgba(29,29,27,0.06), 0 6px 16px -10px rgba(15,15,15,0.25)" : "0 1px 2px rgba(15,15,15,0.03)",
      }}
    >
      <span className="flex size-[26px] shrink-0 items-center justify-center rounded-[8px]" style={{ background: "#f4f4f2" }}>
        <Icon className="size-[14px]" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1 text-[13px] leading-tight font-semibold" style={{ color: INK }}>
        {skill.name}
      </span>
      <span className="hidden truncate font-mono text-[10.5px] sm:block" style={{ color: MUTED }}>
        {skill.file}
      </span>
    </button>
  )
}

function Stage({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-medium tracking-[0.08em] uppercase" style={{ color: "#9a9a96" }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function Flow() {
  return (
    <div className="flex justify-center py-1.5" aria-hidden>
      <ArrowDown className="size-[14px]" strokeWidth={1.8} style={{ color: "#b5b5b1" }} />
    </div>
  )
}

/** The skills, as a pipeline you can click through. */
export function SkillsFigure() {
  const [activeId, setActiveId] = useState("site")
  const active = SKILLS.find((s) => s.id === activeId)!
  const by = (stage: Skill["stage"]) => SKILLS.filter((s) => s.stage === stage)
  const card = (s: Skill) => <SkillCard key={s.id} skill={s} active={s.id === activeId} onSelect={() => setActiveId(s.id)} />

  return (
    <div className={`grid w-full gap-5 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] ${FONT}`} style={{ color: INK }}>
      {/* The pipeline. */}
      <div>
        <Stage label="Understand">
          <div className="flex flex-col gap-2">{by("Understand").map(card)}</div>
        </Stage>
        <Flow />
        <Stage label="Compose">{by("Compose").map(card)}</Stage>
        <Flow />
        <Stage label="Check">{by("Check").map(card)}</Stage>
      </div>

      {/* The selected skill, written up like a skill file. */}
      <div key={active.id} className="view-in rounded-[14px] border bg-white p-4 sm:p-5" style={{ borderColor: LINE }}>
        <div className="flex items-center gap-2">
          <AiLabel size={12} />
          <span className="font-mono text-[11.5px]" style={{ color: MUTED }}>
            skills/{active.file}
          </span>
        </div>
        <div className="mt-2 text-[17px] font-semibold tracking-[-0.01em]">{active.name}</div>
        <p className="mt-1.5 text-[13px] leading-[1.55]" style={{ color: "#4a4a48" }}>
          {active.does}
        </p>
        <div className="mt-3 text-[12px]" style={{ color: MUTED }}>
          <span className="font-medium" style={{ color: INK }}>
            Runs:
          </span>{" "}
          {active.runs}
        </div>

        <div className="mt-4 border-t pt-3.5" style={{ borderColor: LINE }}>
          <div className="mb-2.5 text-[11px] font-medium tracking-[0.08em] uppercase" style={{ color: "#9a9a96" }}>
            {active.stage === "Check" ? "Checks for Planned Live" : active.stage === "Compose" ? "Rules it follows" : "What it found for Planned Live"}
          </div>
          <ul className="flex flex-col gap-2.5">
            {active.found.map((f, k) => (
              <li key={k} className="flex gap-2.5 text-[12.5px] leading-[1.45]">
                {active.stage === "Check" ? (
                  <Check className="mt-[2px] size-[13px] shrink-0" strokeWidth={2.2} style={{ color: "#3F8786" }} />
                ) : (
                  <span className="mt-[7px] size-[5px] shrink-0 rounded-full bg-[#b5b5b1]" />
                )}
                <span className="min-w-0">
                  <span className="font-medium">{f.label}</span>
                  {f.value && <span style={{ color: "#4a4a48" }}> · {f.value}</span>}
                  {f.swatches && (
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      {f.swatches.map((c) => (
                        <span key={c} className="flex items-center gap-1 rounded-full border py-[2px] pr-2 pl-[3px] font-mono text-[10px]" style={{ borderColor: LINE, color: MUTED }}>
                          <span className="size-[12px] rounded-full" style={{ background: c, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)" }} />
                          {c}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
