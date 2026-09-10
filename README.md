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
| `js/device3d.js` | The hero: an interactive 3D AlGaN/GaN FinFET |
| `js/dog3d.js` | BYTE, the cyborg dog |
| `js/refs3d.js` | The two 3D figures on the reference cards |
| `js/games.js` | The four arcade games |

Three.js r128 is pulled from a CDN. Everything else is hand-written.

---

## The hero

Not a decoration — it's the device from the actual research. A **5 nm AlGaN/GaN
AS³-FinFET**: silicon handle, GaN buffer, AlGaN barrier, three fins, a wrap-around
gate, and source/drain contacts, with carriers streaming through the 2DEG.

- **Drag** to rotate.
- **Hover** any layer to read what it is.
- **Click** a layer to isolate it; everything else dims.
- **Gate bias** opens and closes the channel. Switch it off and the carriers stall, the
  channel glow dies, and the drain current falls to zero.
- **Exploded** separates the stack so you can see the layer order.

It lives in a panel on the right of the hero. It never takes over the screen.

If WebGL is unavailable, a static diagram takes its place.

---

## BYTE

A brown dog with parts that aren't his: a prosthetic front leg with a lit knee joint, a
glowing optic in one eye, a riveted plate on his flank, a patched ear, an antenna, and a
metal tail tip.

He sits in the bottom-right corner and stays there.

- **Click him** — he barks, then offers a menu.
- **Pet him** — hearts, a wagging tail, and a line of nonsense. The count is remembered.
- **Take a walk** — he barks and wanders off along the bottom of the page, picking
  new destinations at random and turning to face the way he's going.
- **Click him again** while he's out and the menu comes back, so you can pet him
  wherever he's got to.
- **Click him three times** and he trots back to his corner under his own steam.

Hide him from the **Dog** button in the header.

---

## The arcade

Four games at `arcade.html`. Best scores are kept in `localStorage`, per game.

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

## Accessibility

- Keyboard reachable throughout; visible focus rings.
- The 3D device takes arrow keys; BYTE responds to Enter and Space.
- `prefers-reduced-motion` cuts the marquee, reveals, idle motion and scrambling.
- Live regions for BYTE's speech and the game messages.

---

## Deploying

Settings → Pages → Deploy from a branch → `main` → `/ (root)`.

© 2026 Md. Reshad Al Muttaki
