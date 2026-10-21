# Profile design: the timing screen

Concept: the README reads like an F1 timing monitor on the pit wall. The hero runs a
lights-out start (five red lights, then dark) and a lap clock that stops at 09.84 s, the
"deploys faster than a pit stop" line made literal. Everything below it borrows the
monitor's vocabulary: sector colours, driver-name convention, telemetry readouts.

## Colour

Sector colours carry meaning, not decoration (purple = overall fastest, green = personal
best, yellow = slower sector). Pinpoint, the flagship, gets purple; it also keeps its own
ink + lime brand on its card because that is the product's identity.

| token  | dark      | light     | use                                   |
|--------|-----------|-----------|---------------------------------------|
| bg     | `#15171C` | `#F3F4F6` | panel ("asphalt" / "timing sheet")    |
| line   | `#2A2E36` | `#D5D9E0` | rules, card borders                   |
| ink    | `#F2F3F5` | `#15171C` | text                                  |
| muted  | `#8A909C` | `#5B6270` | secondary text                        |
| purple | `#B66DFF` | `#7A2FE0` | fastest sector, flagship              |
| green  | `#3DDC84` | `#0F8F52` | personal best, PitLane Labs           |
| yellow | `#FFD23F` | `#B97F00` | MealMatch AI                          |
| red    | `#FF2D1A` | `#E10600` | start lights only                     |

## Type

- Saira Condensed 800/600: names, headings, the lap clock (squared, track-signage feel).
- Saira 400/500: small text in SVGs.
- Text is converted to glyph outlines at build time (opentype.js) and each glyph is
  defined once and reused with `<use>`, so SVGs look identical everywhere and stay small.
- F1 name convention: given names in regular weight, SURNAME in heavy caps. That is the
  only all-caps on the page.

## Layout (830 px README column)

```
[ hero: lights · Gowtham Kumar SOLLETI · role        | lap clock 09.84 + S1 S2 S3 ]
[ contact buttons: LinkedIn  Portfolio  X  Email  Resume ]
[ heading: About ]        setup-sheet card (role, speciality, values, fun fact)
[ heading: Flagship ]     Pinpoint card (ink + lime) / demo GIF / live badges
[ heading: Projects ]     2 x 2 cards, sector bar on top, one telemetry readout each
[ heading: Garage ]       stack grid, four columns
[ heading: Telemetry ]    stats + streak (palette-matched), top langs, snake
[ footer: interests + "Build fast, break less, learn always." + chequer strip ]
```

Left-aligned inside each SVG; images themselves are full width. Section headings are a
short sector chip + title + hairline, one consistent component.

## Principles

- One moment of motion: the hero start sequence. Everything else is still.
- Static renderers and reduced-motion viewers see the final frame (lights out, 09.84,
  all sectors set): the base styles are the final state, animations only run toward it.
- No gradients, no shadows, no emoji headings.
- Build: `cd assets && npm i && node build.mjs` writes every `*-light.svg` / `*-dark.svg`.
