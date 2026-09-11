# reshad.bench

The portfolio of **Md. Reshad Al Muttaki** — VLSI and semiconductor device engineer,
Research Fellow at BRAC University.

Live: https://reshad-real.github.io/portfolio/
Arcade: https://reshad-real.github.io/portfolio/arcade.html

---

## Stack

React 19, TypeScript, Vite 7, Tailwind CSS v4. Two runtime dependencies, `react` and
`react-dom`. No 3D library, no animation library, no icon set, no illustration pack.

```bash
npm install
npm run dev        # http://localhost:5173/portfolio/
npm run build      # type-check, then bundle both pages into dist/
npm run preview
```

Two pages are built: the portfolio at `index.html` and the arcade at `arcade.html`. The
games are only ever loaded by the second one, so the portfolio never pays for them.

---

## The art

Everything is drawn: hand-written SVG paths, cel-shaded the way anime is, with a hard
shadow on the shaded side of each form, a soft gradient for the roll of the surface, and a
thin rim on the lit edge.

**`src/components/art/HeroScene.tsx`** — the desk at night. The window is the key light, so
shadows fall left and the rim sits right; the laptop adds a cool fill from below. Layers
carry a `data-depth` and drift against the cursor, the eyes follow it, the head tilts with
it, and the blink, breath, hair, steam, skyline windows, lens glint and dust all run on
their own unsynchronised clocks.

**`src/components/art/DogArt.tsx`** — BYTE. A golden retriever puppy with a chrome plate
over the left of his face and a lit optic where that eye used to be. Two poses live in the
same drawing: a front-facing sit and a side-on walk, and every part that moves is a named
group. In profile the chrome becomes a cheek plate rather than a seam down the middle,
because splitting a profile down the middle just reads as a helmet.

**`src/components/art/RefAvatar.tsx`** — the two referees, as drawn avatars rather than
likenesses. They blink on separate schedules, breathe, glance toward the cursor while it is
over their card, and smile when clicked.

### BYTE

He sits in the bottom-right corner. Click him and he barks, then offers a menu.

- **Pet me** — eyes shut, tail speeds up, tongue out, hearts.
- **Take a walk** — he barks, stands, and wanders along the bottom of the page, flipping to
  face the way he is going and pausing to sniff before choosing somewhere else.
- **Click him again** while he is out and the menu comes back, so he can be petted anywhere.
- **Three quick clicks** and he trots home, moving back under his own power.
- The **×** hides him, and a small button brings him back.

---

## The arcade

Three cabinets on their own page. Each keeps its own best score in `localStorage`, is fully
keyboard playable, and stays silent until the sound switch is turned on — the effects are
synthesised through WebAudio, so there is nothing to download.

- **Circuit Runner** — three lanes, rising speed. Charges chain into a multiplier up to x8
  that decays if you stop collecting. Slipping past a fault in the next lane pays a
  near-miss bonus. Shields absorb one hit; a boost gives five seconds of immunity.
- **Voltage Defender** — hold a power rail. Kills chain into a multiplier up to x6. Drops
  give a wider shot, a faster one, or a shield, and every fifth wave sends a boss with its
  own health bar.
- **Logic Rush** — the circuit is drawn and the inputs are lit; call the output before the
  clock drains. Three right in a row starts a multiplier up to x8, right answers buy time
  back and wrong ones cost two seconds. The circuit grows from one gate to three and the
  gate set widens to NAND, NOR and XNOR.

---

## Themes

Light is the default: white, near-black type, thin rules, one indigo accent. Dark is a
designed alternative on deep charcoal rather than an inversion. The choice is resolved
before first paint by a small script in the HTML, kept in `localStorage`, and only falls
back to `prefers-color-scheme` while the visitor has not chosen.

---

## Accessibility

Semantic landmarks and headings, a skip link, visible focus rings. Nothing gates the page.
BYTE and his menu are buttons; the avatars are buttons; the mobile overlay traps focus,
closes on Escape and goes inert when shut. The clipboard buttons announce their result
through a live region and fall back where the Clipboard API is missing, and every game is
playable without a pointer. `prefers-reduced-motion` is honoured by the CSS and by every
hook that animates.

---

## Layout

```
src/
  components/     Navbar, MobileNav, ThemeToggle, Hero, About, Research, Publications,
                  Experience, ArcadeTeaser, Contact, Footer, Byte, ui, ArcadePage
    art/          HeroScene, DogArt, RefAvatar
    games/        CircuitRunner, VoltageDefender, LogicRush, arcadeUi
  hooks/          useTypedLines, useTypewriter, useTheme, useInView,
                  usePrefersReducedMotion
  lib/            audio
  data/           site, publications, projects, experience, skills
```

All written content comes from the CV and the previous site. Nothing about the research,
the publications, the posts or the grades is invented.

---

## Deploying

Pushed to `main`, the workflow in `.github/workflows/deploy.yml` type-checks, builds and
publishes both pages to GitHub Pages.

© 2026 Md. Reshad Al Muttaki
