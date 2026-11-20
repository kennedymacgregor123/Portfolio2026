import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./landing.css"
import { Landing } from "./landing"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Landing />
  </StrictMode>,
)
