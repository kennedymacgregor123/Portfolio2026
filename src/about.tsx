import { useEffect, useRef, useState } from "react"

import { BlurInText, length, type Run } from "./blur-in-text"

/*
 * The About view, rebuilt from the About page on kennedymacgregor.com: the
 * bio with its bold words, a hairline, then the signature on the left and
 * LinkedIn and email on the right. The bio arrives letter by letter.
 */

const HEADLINE: Run[] = [{ text: "Senior Product Designer at Vasco." }]

const BIO: Run[] = [
  {
    text: "Focused on shaping dense data and layered user needs into experiences that feel clear, intuitive, and natural to move through. At Vasco, I design and ship features that support the complexity of GTM teams, creating experiences that blend precision, usability, and craft.",
  },
]

const LINKEDIN = "https://www.linkedin.com/in/kennedy-macgregor-2b8a251b9/"

/** The address the email dialog shows and opens. Fill this in. */
const EMAIL = "kennedymacgreg@gmail.com"

/** The animated signature, shown bottom left. Lives in `landing/public/`. */
const SIGNATURE = "/signature.mp4"

/**
 * The signature draws itself once, as the bio finishes landing, and then holds
 * on the last frame. The video's white ground is multiplied away so only the
 * ink shows on the page. With reduced motion it shows the finished signature
 * straight away.
 */
function Signature() {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const end = () => {
        v.currentTime = Math.max(0, v.duration - 0.05)
      }
      if (v.readyState >= 1) end()
      else v.addEventListener("loadedmetadata", end, { once: true })
      return
    }
    const t = window.setTimeout(() => {
      v.currentTime = 0
      void v.play().catch(() => {})
    }, 700)
    return () => window.clearTimeout(t)
  }, [])
  return (
    <video
      ref={ref}
      src={SIGNATURE}
      muted
      playsInline
      preload="auto"
      aria-label="Signature"
      className="signature h-full w-auto"
    />
  )
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="3.75" y="3.75" width="16.5" height="16.5" rx="1" />
      <path d="M8.25 10.5v6M8.25 7.6v.15M11.75 16.5v-6M11.75 13.25c0-1.6 1-2.75 2.4-2.75 1.4 0 2.1.95 2.1 2.6v3.4" strokeLinecap="round" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
      <path d="M3.75 10 12 4.5 20.25 10v9.25a.75.75 0 0 1-.75.75h-15a.75.75 0 0 1-.75-.75z" />
      <path d="m3.75 10 8.25 5.75L20.25 10M3.9 19.6l6.1-5.2M20.1 19.6l-6.1-5.2" />
    </svg>
  )
}

function EmailDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop lands on the dialog itself.
        if (e.target === ref.current) ref.current.close()
      }}
      className="email-dialog m-auto w-[min(20rem,calc(100vw-2rem))] rounded-[12px] border p-5 text-left shadow-[0_18px_40px_-12px_rgba(15,15,15,0.18)] backdrop:backdrop-blur-[2px]"
    >
      {/* Type and colours are the project caption's; the button is the
          Work | About switch's active option. */}
      <h2 className="project-title">Send an email</h2>
      <p className="project-blurb mt-1">
        Your email app will open with the recipient already filled in.
      </p>
      <p className="project-blurb mt-4 rounded-[8px] border border-[#ededed] bg-white px-3 py-2 !text-[#0f0f0f] select-all">
        {EMAIL}
      </p>
      <div className="mt-4 flex justify-end">
        <a
          href={`mailto:${EMAIL}`}
          className="view-switch rounded-[8px] bg-[#e6e6e3] px-2.5 py-1 text-[13px] font-medium tracking-[0.2px] text-[#0f0f0f] transition-colors duration-300 hover:bg-[#dcdcd9]"
        >
          Open email app
        </a>
      </div>
    </dialog>
  )
}

export function About() {
  const [emailOpen, setEmailOpen] = useState(false)

  return (
    <main className="flex flex-1 items-center justify-center px-6 pt-8 pb-[18vh]">
      {/* Sits above centre: the extra space below lifts the column up. */}
      <div className="about flex w-full max-w-[34rem] flex-col">
        <BlurInText runs={HEADLINE} className="about-text" />
        <BlurInText runs={BIO} start={length(HEADLINE)} className="about-text mt-3" />

        <svg className="about-rule mt-8 h-px w-full" preserveAspectRatio="none" viewBox="0 0 100 1" aria-hidden>
          <line x1="0" y1="0.5" x2="100" y2="0.5" stroke="#d9d9d6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>

        <div className="about-foot mt-8 flex items-center justify-between">
          <div className="h-[48px]">
            <Signature />
          </div>
          <div className="flex items-center gap-4 text-[#c4c4c4]">
            <a href={LINKEDIN} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="transition-colors hover:text-[#4a4a4a]">
              <LinkedInIcon />
            </a>
            <button type="button" aria-label="Email" onClick={() => setEmailOpen(true)} className="transition-colors hover:text-[#4a4a4a]">
              <MailIcon />
            </button>
          </div>
        </div>
      </div>
      {emailOpen && <EmailDialog onClose={() => setEmailOpen(false)} />}
    </main>
  )
}
