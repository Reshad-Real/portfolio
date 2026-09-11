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

Everything is drawn by a hand-written WebGL layer in `src/lib/gl.ts` and a soft-clay
renderer in `src/lib/clay.ts` — one matte material, two broad lights and a wrapped falloff,
which is what gives the room its moulded look rather than a shiny CG one. Every object is
generated at runtime from the primitives in `src/lib/geometry.ts`, so the site ships no
model, texture or binary asset.

**`src/lib/models.ts` — the parts.** An armchair, a person in headphones with a laptop, a
hexagonal wall panel, a plant, a side table, a cup, a desk lamp, a backpack, a stack of
books, and BYTE. Each reports the radius it occupies so it can be framed on its own in the
inspector, which is how all of them were checked before the room was assembled.

**`src/lib/roomScene.ts` — the landing room.** The parts arrive on a stagger, the camera
answers to the cursor, and the six wall panels are projected back into screen space every
frame so real links can sit exactly on top of them. Those links carry the icon and the
label, take keyboard focus, and lift their panel on hover. On a narrow screen the panels
drop out of the scene and the same six links become a grid under the intro instead.

**BYTE.** A golden retriever puppy with a chrome plate over the left side of his face and a
lit optic where that eye used to be. He sits beside the chair in the landing room, then
follows the reader down the page on his own small canvas: trailing the cursor along the
bottom of the window, looking where you look, perking up over anything clickable, blinking
on his own schedule, and saying something short when a new section arrives. Click or drag
to pet him; Enter does the same from the keyboard. He steps aside over the arcade on a
phone so he never covers the game controls, and the × hides him for good.

### Inspecting the parts

`npm run dev`, then add `?inspect` to the URL. Every model is rendered on its own in a
single context from six fixed angles, so holes, inverted faces and bad pivots show up
before anything reaches the page. It sits behind a dynamic import and `import.meta.env.DEV`,
so it never ships.

### Performance

`detectQuality()` reads core count, memory, pointer type and pixel ratio, and scales mesh
detail and the pixel-ratio cap accordingly. Both scenes park their animation loop when
scrolled off screen or while the tab is hidden, and `prefers-reduced-motion` cuts the
assembly, the idle sway and the typewriter. If WebGL is unavailable the room is replaced by
one line of text and the rest of the page is untouched.

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

The landing room keeps its indigo in both themes, because it is one designed space. Below
it, light is the default: white, near-black type, thin grey rules, one indigo accent. Dark
is a designed alternative on deep charcoal rather than an inversion. The choice is resolved
before first paint by a small script in `index.html`, kept in `localStorage`, and only falls
back to `prefers-color-scheme` while the visitor has not chosen.

---

## Accessibility

Semantic landmarks and headings, a skip link, visible focus rings throughout. Nothing gates
the page: the landing is an ordinary section that scrolls, so there is no overlay to escape
from and no way to get stuck. The wall panels are real anchors with labels, reachable by
keyboard. The mobile overlay traps focus and closes on Escape, dismissed overlays go inert
rather than merely hidden, the clipboard buttons announce their result through a live region
and fall back where the Clipboard API is missing, and every game is playable without a
pointer. `prefers-reduced-motion` is honoured by the CSS and by every hook that animates.

---

## Layout

```
src/
  components/     Navbar, MobileNav, ThemeToggle, Landing, HexIcon, CyberDog, About,
                  Research, EnergyLab, Publications, Experience, Studio,
                  ElectronicsArcade, Contact, Footer, ui, ModelInspector (dev only)
    games/        CircuitRunner, VoltageDefender, LogicLab, arcadeUi
  hooks/          useTypewriter, useTheme, useInView, usePrefersReducedMotion
  lib/            gl, geometry, clay, palette, models, roomScene, dogCompanion,
                  quality, audio
  data/           site, publications, projects, experience, skills
```

All written content comes from the CV and the previous site. Nothing about the research, the
publications, the posts or the grades is invented. The studio name, the A.R.I.A line and the
`hello@mainframe.co` address on the landing are brand copy and live in `src/data/site.ts`;
the real contact details are in the contact section and the footer.

---

## Deploying

Pushed to `main`, the workflow in `.github/workflows/deploy.yml` type-checks, builds and
publishes to GitHub Pages.

© 2026 Md. Reshad Al Muttaki
