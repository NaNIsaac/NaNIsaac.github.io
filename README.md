# nanisaac.github.io

Personal site of **Isaac Yong (용이삭) / NaNIsaac** — https://nanisaac.github.io/

| Path | What it is |
|---|---|
| `/` | Portfolio with the *Liquid Light* hero: a live 2D wave simulation (`wave.js`): a fixed double slit; clicks and moves ripple it, and a ghost hand shows how until you do |
| `/lab/` | Fourier & Filtering sandbox (`fourier.js`, `lab/lab.js`) |
| `/notes/` | Notes written as Markdown in `_posts/`, built by GitHub Pages' Jekyll |
| `` ` `` key | Owner terminal, not linked anywhere on the site: quick capture, ideas, shortcuts (`terminal.js`) |

No npm, no build step on your machine. GitHub Pages builds the site from `main`
(Settings → Pages → *Deploy from a branch*, `main` / root) and runs Jekyll for the notes.

## Write a note

Any of these will do. The note goes live about a minute after the commit.

1. **From the site:** press `` ` `` and type `new Fringe visibility vs slit width`.
   GitHub's editor opens with the file name and front matter filled in. Write, commit.
2. **Locally:** add `_posts/YYYY-MM-DD-some-title.md`:

   ```markdown
   ---
   title: Fringe visibility vs slit width
   description: One sentence that shows up in lists and link previews.
   tags: [xrr, notes]
   ---

   Text. Math works: inline $$q = 4\pi \sin\theta / \lambda$$, or a block

   $$
   R(q) \approx \left| \frac{4\pi r_e}{q^2} \int \frac{d\rho}{dz} e^{iqz}\, dz \right|^2
   $$
   ```

3. **Capture now, write later:** `idea <text>` stores an idea in this browser;
   `ideas` lists them; `idea write 2` opens idea #2 as a new note.

A note does not need to be long. The template's *Context / What I found / Next* headings are there to
make a five-minute note easy; delete what you don't use.

### Owner bar

Run `owner on` in the terminal once, in your own browser. The home page and `/notes/` then show a small
bar with days since the last note, waiting ideas and todos, and a *new note* button. It is stored in
`localStorage`, so visitors never see it. `owner off` hides it.

## Terminal commands

Nothing on the site points to the terminal; press `` ` `` on any page to open it.

| Command | Does |
|---|---|
| `xray 12` · `xray 1.5406A` | energy ↔ wavelength, k |
| `bragg <d Å> <E keV>` | θ, 2θ, q |
| `q <2θ °> <E keV>` · `d <q>` | momentum transfer, d-spacing |
| `calc <expr>` | math with `sin cos sqrt log PI deg …` |
| `new <title>` · `notes` | start a note · list recent notes |
| `idea …` · `todo …` | local inboxes (`ideas`, `idea write n`, `todo done n`) |
| `open <name>` · `gh` | jump to a project · recent GitHub activity |
| `owner on/off` · `theme` · `clear` · `exit` | |

↑/↓ recall history. Everything the terminal stores stays in your browser.

## Edit the portfolio

- Text lives in `index.html`. English is the markup; the Korean version sits in each element's `data-ko`
  attribute, shown by the 한/EN button.
- Projects and research axes are plain HTML cards in `index.html`. Verify a repository's README before
  describing it.
- Colors are CSS variables at the top of `style.css` (`body.light` for the light theme).

## Preview locally

Opening `index.html` or `lab/index.html` directly works, or:

```powershell
python -m http.server 8000            # home + lab at http://localhost:8000
```

Notes, the notes feed and the "Lately" note list need Jekyll, which is not installed on this machine:
push and check the live site (build status: `gh api repos/NaNIsaac/NaNIsaac.github.io/pages/builds/latest`).

## Tests

```powershell
node tests/wave.test.cjs      # wave solver: stability, edge absorption, barrier blocks transmission
node tests/fourier.test.cjs   # FFT round trip, Parseval, sign, symmetry, fringe scaling, masks
node tests/xrr.test.cjs       # xrr.js vs ReflectoLearn's golden curves (1e-10 in log10 R), Fresnel limits
```

## Physics honesty

The hero is a 2D scalar wave equation (leapfrog, r = 0.5, Dirichlet barrier, sponge edges) and the
lab is a separate Fourier-optics model. Both are explained in the first note,
[How the homepage wave works](https://nanisaac.github.io/notes/2026/10/how-the-hero-wave-works/), and in
the lab's *How it works* panel. Glow and bloom are display-only and never feed the detector curve.
