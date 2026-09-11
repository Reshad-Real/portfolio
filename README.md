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
| `js/scope3d.js` | The hero: a bench oscilloscope with a live 2D screen |
| `js/dog2d.js` | BYTE, drawn in SVG |
| `js/refs2d.js` | The two drawn portraits on the reference cards |
| `js/games.js` | The four arcade games |

Three.js r128 is pulled from a CDN. Everything else is hand-written.

---

## The hero

A **bench oscilloscope**. The cabinet is deliberately plain 3D — a box, a bezel, three
knobs, a row of keys — because all the character lives on the screen, and the screen is a
**2D canvas redrawn every frame**. Flat drawing is where fine detail can actually be
controlled; modelled geometry at this scale cannot.

The screen shows a real graticule, a glowing trace with its own bloom, channel and trigger
labels, and live measurements along the bottom. Five traces: sine, square with edge
overshoot, a ringing step response, an X-Y Lissajous figure, and an eye diagram with the
opening marked.

- **Drag** to tilt the cabinet.
- **Turn the knobs** — mode, time/div, volts/div.
- **Press a front-panel key** to jump to that section. The six keys are the site map:
  About, Work, Papers, Research, Teaching, Contact.
- **Acquire** stops and starts the sweep.

If WebGL is unavailable, a static drawing of the instrument takes its place.

## BYTE

A golden retriever puppy, **drawn in SVG** rather than modelled. Half his face is fur and
half is chrome, with a glowing optic in the metal side — and because the split is an SVG
clip path, it is exact rather than approximated.

Two poses live in the same drawing: a front-facing sit and a side-on walk, swapped when he
starts moving, with the walk legs animated from their hip pivots. The two poses treat the
chrome differently on purpose — head-on you see the split down the middle, but in profile
you only ever see one side of him, so there the metal is a cheek plate set into an
otherwise furry head. Splitting a profile down the middle just reads as a helmet. Everything that moves —
head, ears, tail, jaw, eyelid, optic — is a named group transformed each frame.

He sits in the bottom-right corner.

- **Click him** — he barks, then offers a menu.
- **Pet him** — hearts, a wagging tail, and a line of nonsense. The count is remembered.
- **Take a walk** — he stands, barks, and wanders along the bottom of the page, flipping to
  face the way he's going.
- **Click him again** while he's out and the menu comes back.
- **Click him three times** and he trots home.

Hide him from the **Dog** button in the header.

## The portraits

The two reference cards carry **drawn SVG portraits** — stylised avatars, not likenesses.
The older one has grey at the temples and a thin strip over the crown — a receded hairline
rather than a helmet — with glasses and a trimmed grey beard. The younger has a clean dark
hairline with no flaps at the temples. Both have a jaw rather than a plain oval, a shaded
side to the face, a moustache above a visible mouth, and a beard that follows the jawline
instead of covering it. Both blink, breathe, glance toward your cursor when it crosses
their card, and smile when clicked.

## The arcade

Four games at `arcade.html`. Best scores are kept in `localStorage`, per game.

Every game opens on a **start screen** naming it and listing its controls, and ends on a
**game over screen** with the final score, your best, and what killed the run. Beat your
record and the screen says so.

Each cabinet themes both screens itself — its own accent colour, background pattern,
animated artwork and wording. Electron Runner opens on a streaking carrier and ends on a
flatline; Gate Crash opens on a falling gate and ends on a cracked substrate; Trace Router
opens on a powered trace and ends on a broken one; Resistor Rush opens on live bands and
ends on a burnt resistor. The ending keeps the palette but never repeats the start.

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

Three harnesses live outside the site: `test-home.js`, `test-arcade.js` and `test-draw.js`.

`test-draw.js` measures the artwork, since it cannot be looked at in CI. Every circle,
ellipse and rect in each SVG is checked against its own viewBox, so nothing can quietly
spill out of frame. The dog's clip path is checked to be exactly half the drawing width.
Every animatable group is checked to exist, and then checked to actually move. The scope is
projected through its camera to confirm it fits and fills its panel, and its keys are
checked not to overlap.

## Accessibility

- Keyboard reachable throughout; visible focus rings.
- The 3D device takes arrow keys; BYTE responds to Enter and Space.
- `prefers-reduced-motion` cuts the marquee, reveals, idle motion and scrambling.
- Live regions for BYTE's speech and the game messages.

---

## Deploying

Settings → Pages → Deploy from a branch → `main` → `/ (root)`.

© 2026 Md. Reshad Al Muttaki
