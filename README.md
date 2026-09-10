# Md. Reshad Al Muttaki — The Bench

An electronics-themed portfolio for **Md. Reshad Al Muttaki** — VLSI and semiconductor device
researcher at BRAC University.

🌐 **Live:** https://reshad-real.github.io/portfolio/

Vanilla HTML, CSS, and JavaScript. One external dependency: three.js from a CDN, for the two
3D scenes. No build step.

## The idea

The site is a lab bench. The light theme — the default — is a white PCB under bright lab
lighting. The dark theme is the same board under blacklight. Section markers use silkscreen
reference designators (U1, U2, J1) because that is what a board actually labels its parts with.

## What's on it

**An interactive 3D board in the hero.** A populated PCB with copper traces, chips, caps,
resistors, and indicator LEDs. Drag it to spin it, hover a chip to read what it stands for,
click one to fire a signal packet down the traces. Falls back to a plain page if the device
has no WebGL.

**BYTE, the cyber-dog.** A 3D cartoon dog that follows your cursor around the whole site.
It walks, leans into turns, wags, blinks, perks its ears when you get close, and naps if you
stop moving for a while. Click it to pet it — it wags harder, throws hearts, and says
something. The boop count is kept on your device and shown in the footer. Hide it with the
Dog button in the header.

**Four playable games.** Under *The bench arcade*:

| Game | What you do |
|---|---|
| Logic Gate Lab | Flip input switches until the output LED goes high. Circuits get deeper as you go. 60 seconds. |
| Trace Router | Rotate every copper trace until the whole board is powered from the V pad. The grid grows 5×5 → 8×8. |
| Resistor Rush | Read the colour bands before the clock runs out. Streaks pay more; later rounds run the question backwards. |
| Signal Sequence | Repeat the pattern the board plays back. One extra step each round, two extra pads after round 7. |

Each game keeps a best score on your device and has its own sound, which you can switch off.

**Light and dark themes.** Light is the default and is applied before first paint, so there is
no flash. Your choice is remembered.

## Files

```
portfolio/
├── index.html        # the whole page
├── styles.css        # design tokens, both themes, layout, game styling
├── js/
│   ├── app.js        # boot sequence, theme, nav, reveals, shared audio + storage helpers
│   ├── hero3d.js     # the interactive board
│   ├── dog3d.js      # BYTE
│   └── games.js      # all four games behind one shell
├── lab.html          # the older Silicon Lab, still linked from the nav
├── lab.js            # its logic
├── style.css         # its styles — leave this one alone, lab.html depends on it
├── CV_Reshad.pdf
└── README.md
```

`styles.css` (new) and `style.css` (old) are different files on purpose, so replacing the home
page does not break the Silicon Lab.

## Run locally

```bash
git clone https://github.com/Reshad-Real/portfolio.git
cd portfolio
python -m http.server 8000    # then open http://localhost:8000
```

Opening `index.html` directly works too.

## Deploy

Settings → Pages → Deploy from a branch → `main` / root. Live in a minute or two.

## Customising

- **Colours:** the tokens live in `:root` and `[data-theme="dark"]` at the top of `styles.css`.
  Everything else reads from them, including the 3D scenes.
- **Chips on the board:** `chipDefs` in `js/hero3d.js` — id, position, label, and the line that
  shows in the readout.
- **What BYTE says:** the `LINES` array in `js/dog3d.js`.
- **Game difficulty:** each game is a self-contained factory in `js/games.js`. Session length,
  grid growth, and scoring are all near the top of their function.
- **Content:** all of it is plain markup in `index.html`.

## Accessibility and performance

- Keyboard reachable throughout, including the logic-gate switches; visible focus rings.
- `prefers-reduced-motion` is respected — the boot sequence, reveals, idle spin, and float all stop.
- The hero scene pauses when it scrolls out of view or the tab is hidden. The dog renders into a
  240px canvas moved with a CSS transform rather than a full-screen layer, and never intercepts a click.
- Pixel ratio is capped at 2. No WebGL means a graceful fallback, not a broken page.
