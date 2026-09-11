# Mainframe®

The portfolio of **Md. Reshad Al Muttaki** — VLSI and semiconductor device engineer,
Research Fellow at BRAC University.

Live: https://reshad-real.github.io/portfolio/

---

## Stack

React 19, TypeScript, Vite 7, Tailwind CSS v4. Two runtime dependencies, `react` and
`react-dom`. No 3D library, no animation library, no icon set.

```bash
npm install
npm run dev        # http://localhost:5173/portfolio/
npm run build      # type-check, then bundle into dist/
npm run preview
```

`vite.config.ts` sets `base` to `/portfolio/` for GitHub Pages. Set `VITE_BASE=/` to host
the same source at a domain root.

---

## The 3D

Both scenes run on a hand-written WebGL layer in `src/lib/gl.ts` — matrix maths, shader
plumbing and mesh helpers, and nothing else. Everything drawn is generated at runtime from
primitives in `src/lib/geometry.ts`, so there is not a single model, texture or binary asset
to download.

**`src/lib/chamberScene.ts` — the startup chamber.** A 5 nm AlGaN/GaN asymmetric-spacer
tri-gate assembles out of the dark: substrate, buffer, fin, AlGaN barrier, wrapped gate,
unequal spacers, source and drain, each arriving on its own schedule. A lattice point cloud
drifts above it, copper traces route away from the contacts with a travelling pulse, and
carriers stream through the channel. Roughly fifteen draw calls, three shader programs. The
camera answers to the cursor, to device orientation where it is reported, and to scroll.

The same context carries straight into the hero — the section is never unmounted — so the
camera pulling back and panning aside is one continuous shot rather than a cut. On a
portrait screen it lifts instead of panning, because the copy sits along the bottom there.

**`src/lib/dogScene.ts` — BYTE.** A cartoon retriever posed by a small scene graph:
spheres, boxes, cones, a torus collar. Half fur, half chrome, with a glowing optic set into
the metal side. He trails the cursor along the bottom of the window, walks when the distance
is worth walking, turns to face the way he is going, looks where you look, perks up over
anything clickable, blinks on his own schedule, and says something short when a new section
comes into view.

Click or drag on him to pet him: his eyes close, his ears fold back, his tail speeds up and
hearts come off him. Keyboard users get the same by focusing him and pressing Enter. The
`pet me` hint disappears after the first one and does not come back. The × hides him for
good, and the button that appears in his place brings him back.

### Performance

`detectQuality()` reads core count, memory, pointer type and pixel ratio, and scales point
counts and the pixel-ratio cap accordingly. Both scenes park their animation loop entirely
when scrolled off screen, BYTE stops while the tab is hidden, and `prefers-reduced-motion`
cuts idle motion, drift and the typewriter. If WebGL is unavailable the chamber draws a
static SVG cross-section of the same device instead of a dead canvas, and BYTE simply does
not appear.

---

## Interactive work

**Device explorer** (`#labs`) — gate length, fin width, oxide EOT and drain bias against a
live transfer characteristic, with subthreshold swing, DIBL, natural length and the
Ion/Ioff ratio recomputed on every change. Switch between tri-gate and planar and watch the
short-channel numbers come apart. The model is the standard analytic one; it is labelled as
such, and it is not TCAD output.

**Demand monitor** (`#energy`) — a rolling charging-demand trace with an exponentially
weighted baseline and a residual detector on top, in the shape of the published EV-charging
anomaly work. Synthetic signal, with a button to inject an excursion.

**Signal lab** (`#bench`) — a bench oscilloscope with five traces: sine, square with edge
overshoot, second-order step with an adjustable damping ratio, an X-Y Lissajous figure with
an adjustable phase, and an eye diagram with the opening marked. Real graticule, real
time/div and volts/div, live Vpp and frequency. Every pixel is computed from the waveform.

---

## The electronics arcade

Three cabinets at `#arcade`, lazy-loaded as one chunk so nothing is paid for until a cabinet
is opened. Each keeps its own best score in `localStorage`, is fully keyboard playable, and
stays silent until the sound switch is turned on — at which point the effects are
synthesised through WebAudio, so there is still nothing to download.

- **Circuit Runner** — you are a carrier in the channel. Three lanes, rising speed. Dodge
  defects, collect charge, grab the rare boost for temporary immunity. Three lives. Arrow
  keys or W/S; tap the top or bottom half on touch.
- **Voltage Defender** — keep a power rail alive. Spikes fall straight, noise weaves, and a
  short takes three hits. Waves get faster. Arrows or A/D to move, space to fire; drag and
  tap on touch.
- **Logic Lab** — a circuit with empty gates and a truth table it has to satisfy. Fill each
  gate until your column matches the target. The circuit grows from one gate to three and
  the clock shortens every level; a wrong verify costs three seconds. Keys 1–6 set the
  focused gate, Enter verifies.

---

## Themes

Light is the default and the design is built for it: white, near-black type, thin grey
rules, one restrained blue accent. Dark is a designed alternative on deep charcoal rather
than an inversion. The choice is resolved before first paint by a small script in
`index.html`, kept in `localStorage`, and only falls back to `prefers-color-scheme` while
the visitor has not chosen. The startup chamber keeps its own cinematic dark styling in both
themes, and hands over to the selected theme at the first section.

---

## Accessibility

Semantic landmarks and headings, a skip link, visible focus rings throughout. The startup
sequence is enterable from the keyboard and can be skipped at any point. The mobile overlay
traps focus and closes on Escape. The blurred intro line is mirrored for screen readers, the
clipboard buttons announce their result through a live region and fall back gracefully where
the Clipboard API is unavailable, and every game is playable without a pointer.
`prefers-reduced-motion` is honoured by the CSS and by every hook that animates.

---

## Layout

```
src/
  components/     Navbar, MobileNav, ThemeToggle, HeroChamber, StartupOverlay, Hero,
                  ChamberFallback, CyberDog, About, Research, DeviceExplorer, EnergyLab,
                  Publications, SignalLab, Experience, Studio, ElectronicsArcade,
                  Contact, Footer, ui
    games/        CircuitRunner, VoltageDefender, LogicLab, arcadeUi
  hooks/          useTypewriter, useTheme, useInView, usePrefersReducedMotion
  lib/            gl, geometry, chamberScene, dogScene, parts, quality, audio
  data/           site, publications, projects, experience, skills
```

All written content comes from the CV and the previous site. Nothing about the research, the
publications, the posts or the grades is invented. The studio name, the A.R.I.A intro and the
`hello@mainframe.co` address in the hero are brand copy and live in `src/data/site.ts`; the
real contact details are in the contact section and the footer.

---

## Deploying

Pushed to `main`, the workflow in `.github/workflows/deploy.yml` type-checks, builds and
publishes to GitHub Pages. `actions/configure-pages` switches the Pages source over to
Actions on the first run, so nothing has to be changed in the repository settings.

© 2026 Md. Reshad Al Muttaki
