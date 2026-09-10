# reshad.bench

The portfolio of **Md. Reshad Al Muttaki** — VLSI and semiconductor device engineer,
Research Fellow at BRAC CREST.

Live: https://reshad-real.github.io/portfolio/

---

## What's here

Two pages, no build step, no framework. Open `index.html` and it runs.

| File | What it does |
|---|---|
| `index.html` | The portfolio itself |
| `arcade.html` | The games, on their own page |
| `styles.css` | All styling. Light is the default theme; dark is opt-in |
| `js/app.js` | Theme, navigation, scroll reveals, counters, card tilt |
| `js/lattice3d.js` | The hero: an interactive 3D silicon crystal you can dope |
| `js/dog3d.js` | BYTE, the cyborg dog |
| `js/refs3d.js` | The two 3D figures on the reference cards |
| `js/games.js` | The four arcade games |

Three.js r128 is pulled from a CDN. Everything else is hand-written.

---

## The hero

A **silicon unit cell** — diamond cubic, eighteen atoms, sixteen tetrahedral bonds — in a
panel on the right of the hero. It never takes over the screen.

- **Drag** to rotate.
- **Hover** an atom to read what it is.
- **Click** an atom to dope it. Silicon → phosphorus donor (a spare electron appears) →
  boron acceptor (a hole appears) → back to silicon. The badge above tracks the running
  total: intrinsic, n-type, p-type, or compensated.
- **Bias** sets the free carriers drifting — electrons one way, holes the other.
- **Thermal** heats the lattice to 300 K so the atoms rattle about their sites and the
  carriers scatter harder.
- **Undope** puts every atom back.

If WebGL is unavailable, a static bond diagram takes its place.

## BYTE

A golden retriever puppy with half a chrome face: a plated skull, a glowing blue optic
where one eye should be, a metal-plated ear, and a seam of light down the middle. The
other half is all fur, floppy ear, and tongue.

He **sits** in the bottom-right corner, facing you, and **stands up** to walk — the two
poses are separate sets of joint angles that lerp into each other, so getting up reads as
a motion rather than a snap.

- **Click him** — he barks, then offers a menu.
- **Pet him** — hearts, a wagging tail, and a line of nonsense. The count is remembered.
- **Take a walk** — he stands, barks, and wanders along the bottom of the page, turning to
  face the way he's going.
- **Click him again** while he's out and the menu comes back, so you can pet him wherever
  he's got to.
- **Click him three times** and he trots back to his corner.

Hide him from the **Dog** button in the header.

## The arcade

Four games at `arcade.html`. Best scores are kept in `localStorage`, per game.

Every game opens on a **start screen** naming it and listing its controls, and ends on a
**game over screen** with the final score, your best, and what killed the run. Beat your
record and the screen says so.

- **Electron Runner** — you are a carrier in the channel. Three lanes, rising speed.
  Dodge lattice defects, collect charge, grab the rare boost for temporary immunity.
  Three lives. Arrow keys, the on-screen pad, or tap the top/bottom half of the canvas.
- **Gate Crash** — logic gates fall toward the substrate. Answer the output of the
  outlined one with `0` or `1` before it lands. New gate types unlock as you level;
  everything falls faster. Three lives.
- **Trace Router** — rotate copper until power from `V` reaches every pad. The grid
  grows 5×5 → 8×8, and there's a clock.
- **Resistor Rush** — read the colour bands against an eight-second timer. Streaks
  multiply your score, and past 90 points it starts running backwards, giving you the
  value and asking for the bands.

---

## Education

Three grade cards, each with an animated bar that fills to the score on scroll, so 3.81
out of 4.00 reads as a proportion rather than a bare number.

## Themes

Light by default. The toggle in the header switches to dark and the choice is saved.
Both 3D scenes and all four games re-read their colours on the switch.

---

## Icons

Every icon is hand-drawn SVG in a sprite at the top of each page — including the ones
next to LinkedIn, GitHub and Google Scholar. They're original glyphs, not the official
brand marks, so nothing here is anyone's trademark. Swap in real ones if you'd rather:
replace the matching `<symbol>` and everything picks it up.

---

## Testing

Three harnesses live outside the site (`test-home.js`, `test-arcade.js`,
`test-geometry.js`). The geometry one is the interesting one: because the 3D scenes cannot
be eyeballed in CI, every model is projected through its own camera and measured — does it
fit inside the canvas, is it centred, does the lattice stay in frame through a full
rotation, does any hair geometry sit in front of a face. That is how the cropped busts and
the overflowing hero were caught.

## Accessibility

- Keyboard reachable throughout; visible focus rings.
- The 3D device takes arrow keys; BYTE responds to Enter and Space.
- `prefers-reduced-motion` cuts the marquee, reveals, idle motion and scrambling.
- Live regions for BYTE's speech and the game messages.

---

## Deploying

Settings → Pages → Deploy from a branch → `main` → `/ (root)`.

© 2026 Md. Reshad Al Muttaki
