# Bounceloft — Animated 3D Toy Store

An interactive, single-page toy store concept built with vanilla JavaScript, **Three.js** for 3D rendering, and **GSAP** for animation and camera choreography. Toys are rendered as stylized 3D primitives (no external model assets required), floating and reacting in a soft-lit "night-playroom" scene.

**Live demo:** open `index.html` in a browser (internet connection required — Three.js and GSAP load from a CDN).

---

## Features

| Area | Details |
|---|---|
| **Home** | Hero view with a floating cluster of toys, idle bob/rotate animation, scroll-to-enter-shop transition |
| **Shop** | 3D toy grid with age filter chips (0–3, 4–7, 8–12+) and live search; non-matching toys pop out, matches bounce in |
| **Toy Detail** | Click a toy to zoom the camera in; drag (mouse or touch) to rotate it 360°; Add to Cart / Wishlist actions |
| **Cart** | Frosted glass slide-out panel, running total, and automatic bundle discounts for qualifying item pairs |
| **Gift Finder** | Two-step quiz modal (age → interest) that filters the shop to relevant picks |
| **Lighting** | Ambient + warm directional key light with soft shadows, plus cool/warm point lights simulating an HDRI environment |
| **Responsive** | Layout, camera framing, and touch-drag rotation all adapt to mobile viewports |

---

## Project Structure

```
.
├── index.html   # Markup, CDN links, view/section containers
├── styles.css   # All visual styling, layout, and responsive rules
├── app.js       # Three.js scene, GSAP animations, UI logic, state management
└── README.md
```

All three files must stay in the same folder — `index.html` references `styles.css` and `app.js` by relative path.

---

## Tech Stack

- **HTML5 / CSS3** — semantic structure, CSS custom properties for theming, glassmorphism UI
- **JavaScript (ES6+)** — no build step, no framework, single IIFE module in `app.js`
- **[Three.js](https://threejs.org/)** r128 — WebGL scene, meshes, lighting, shadows, raycasting
- **[GSAP](https://gsap.com/)** 3.12 — camera tweens, mesh transforms, UI micro-interactions

Both libraries are loaded via CDN (`cdnjs.cloudflare.com`) in `index.html`; no `npm install` or bundler is required.

---

## Running Locally

No build tools needed. Any static file server works, for example:

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .
```

Then open `http://localhost:8080` in your browser. Opening `index.html` directly via `file://` also works in most browsers, since there are no same-origin API calls — only CDN script loads.

---

## Customizing the Catalog

Toys are defined as plain data objects in `app.js`:

```js
const TOYS = [
  { id:'ball', name:'Bouncy Buddy', price:14, age:'0-3',
    tags:['active','cuddly'], desc:'...', color:0xFF6FB5, kind:'ball' },
  // ...
];
```

- `age` drives the shop filter chips (`0-3`, `4-7`, `8-12`).
- `tags` drive the Gift Finder quiz matching.
- `kind` selects which primitive-based mesh builder in `buildToy()` constructs the 3D shape.
- `color` is a hex value used for both the mesh material and the cart swatch.

Bundle deals are defined similarly in `BUNDLES`, matching by toy `id`:

```js
const BUNDLES = [
  { ids:['rocket','robo'], label:'Space Explorer Bundle', discount:0.15 },
];
```

Adding a new toy shape requires a new `case` in the `buildToy()` switch statement inside `app.js`.

---

## Design Notes

The visual direction leans into a "playroom after dark" concept: a deep navy 3D scene lets vividly colored toys glow under warm/cool point lighting, framed by glassmorphic UI panels and a pill-shaped bottom dock styled like a floating toy shelf. Typography pairs a rounded display face (Baloo 2) for personality with a clean body face (Plus Jakarta Sans) for readability.

---

## Browser Support

Requires a browser with WebGL support (all modern desktop and mobile browsers). Pointer Events are used for unified mouse/touch drag handling. `prefers-reduced-motion` is respected to reduce animation for users who request it.

---

## License

This project is a demo/prototype built for evaluation purposes. Feel free to adapt or extend it.
