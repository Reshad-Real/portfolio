# Md. Reshad Al Muttaki — VLSI Portfolio

A VLSI-themed, heavily animated personal portfolio for **Md. Reshad Al Muttaki** — VLSI &
semiconductor device researcher at BRAC University.

🌐 **Live:** https://reshad-real.github.io/portfolio/

Built with vanilla **HTML5, CSS3, and JavaScript** — no build step, no frameworks, no runtime
dependencies. Everything runs from three static files plus the CV.

## The theme

The whole site is styled as a piece of silicon:

- **Boot sequence** preloader — a power-on self-test log (Vdd rail, PLL lock, std-cell library, DRC/LVS).
- **Place-and-route hero** — a live `<canvas>` animation of Manhattan-routed interconnect with
  glowing signal packets flowing between pads and standard cells.
- **Interactive Silicon Lab** — a dedicated page (`lab.html`) with eight live circuits: a tri-gate
  FinFET with a V<sub>GS</sub> sweep, a CMOS inverter, a logic-gate bench with truth table, a
  7-segment hex decoder, a 4-bit ripple-carry adder, an 8-bit register, a system clock, and a
  MOSFET I–V plotter. Reached from the "Enter the Silicon Lab" button on the home page.
- **Die-floorplan** research interests, **clock-signal** section dividers, chip-package publication
  cards, a **standard-cell** skills library, and animated GPA rings.
- Silicon palette: signal **cyan**, interconnect **copper**, poly **violet**, on a dark lattice grid.
- Fully **responsive**, respects **`prefers-reduced-motion`**, and keyboard/screen-reader friendly.

## Sections

**Home** (`index.html`): Hero · About · Experience (process-flow timeline) · Publications · VLSI
Training · Research Interests · Courses Taught · Education · Skills · Awards · References · Contact.

**Silicon Lab** (`lab.html`): eight self-contained interactive modules.

## Highlights

- **6 peer-reviewed Q1 journal publications** (impact factors up to 9.8), with DOI links.
- **Sub-5 nm AlGaN/GaN tri-gate FinFET** research in Silvaco Atlas TCAD (CREST initiative).
- **Industrial VLSI Design training** at Ulkasemi Pvt. Ltd. — analog, digital, verification, and layout.

## File structure

```
portfolio/
├── index.html      # Home page — markup and content
├── lab.html        # The Silicon Lab — interactive VLSI playground
├── style.css       # VLSI design system, layout, and animations (both pages)
├── script.js       # Boot sequence, place-and-route hero canvas, home interactions
├── lab.js          # Interactive lab modules (FinFET, logic, adder, 7-seg, I–V, …)
├── CV_Reshad.pdf   # Résumé (downloadable)
└── README.md
```

## Run locally

```bash
git clone https://github.com/Reshad-Real/portfolio.git
cd portfolio
python -m http.server 8000   # then open http://localhost:8000
```

Or just open `index.html` directly in a browser.

## Deploy (GitHub Pages)

Repository **Settings → Pages → Deploy from a branch → `main` / root**. Live within a minute or two
at `https://reshad-real.github.io/portfolio/`.

## Customize

- **Content:** edit `index.html`.
- **Colors / spacing:** the design tokens live in `:root { … }` at the top of `style.css`.
- **CV:** replace `CV_Reshad.pdf`.
- **Social links:** the Google Scholar and LinkedIn buttons in the hero are marked with
  `<!-- TODO -->` — drop in the real profile URLs.

---

Fabricated with `<silicon/>`.
