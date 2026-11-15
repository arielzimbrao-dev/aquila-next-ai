# UI without the "made by AI" look

Generated UI drifts to the same defaults — the average of its training data — and users spot it: it reads
as a template, unfinished, and lowers trust. Build from the **project's** design; the patterns below are
**off by default** and appear only when the dev, the ticket/design file or the project's design system
explicitly asks for them (the plan says who asked).

## Where the design comes from

1. The project's design system, tokens, theme, Figma or brand guide (`docs/ai/CONTEXT.md` says where).
2. Existing screens of the same kind (golden file, [`../golden-files.md`](../golden-files.md)).
3. This file. With no reference at all, **ask the dev** for one (brand color, font, a screen they like)
   before inventing; meanwhile stay sober: neutral surfaces, one accent color, the project's font (system
   font if none).

## Off by default — the tells

**Color and surfaces**
- Purple/indigo/violet → blue gradients on backgrounds, buttons or headings; gradient-clipped text.
- Neon or glow on near-black; dark mode as the only or default theme without being asked.
- Glassmorphism (translucent blurred cards); aurora/blurred blobs, mesh, noise or dot-grid backgrounds as
  decoration.
- Oversized, colored or everywhere shadows.
- A different color per card, chip or icon with no meaning; rainbow palettes in charts.
- A colored stripe on one edge of cards as decoration.

**Typography and copy**
- The template font (Inter, Geist…) left in when the project has its own; one weight for everything; small,
  low-contrast gray text.
- An eyebrow/kicker label above every heading; ALL-CAPS wide-tracked micro labels everywhere.
- Emoji in headings, buttons, labels or lists; ✨ sparkle/magic icons for anything "AI" or "new".
- Generic copy: "Welcome back 👋", "Supercharge", "Unlock", "Seamless", "Effortless"; titles that only name
  the chart ("Sales by month"); marketing tone in an internal tool; dash-heavy sentences.

**Layout and components**
- Centered hero + three (or six) feature cards; bento grids; every section a grid of identical cards.
- Large radius and pill shapes on everything; the same padding everywhere, so nothing stands out.
- An icon in a colored circle or square on every card and KPI; icons that carry no meaning.
- "Live", "New", "Beta" tags or status chips that don't reflect real state; a green pill with an arrow
  (▲ 12%) without a stated comparison period.
- A decorative sidebar or menu with links to pages that don't exist; filters or search that don't filter;
  buttons with no action.
- The component library's stock look (default theme and radius) when the project has its own theme.
- Hover lift/scale on every card; entrance animations, endless pulse/shimmer, parallax without a purpose.

**Dashboards and data**
- A KPI row with a tiny sparkline in every card; a donut with the total in the middle; gauges, 3D charts,
  pies with many slices.
- "AI insight" or summary boxes nobody asked for.
- Placeholder data shown as real; invented testimonials, customer logos, avatar stacks, "trusted by".
- Numbers without unit, period or source.

## Do instead

- **Hierarchy from layout, size, weight and whitespace**, not from color and effects.
- **One accent color with a meaning** (primary action, selection). Status colors only for status, always with
  text or an icon too — never color alone (accessibility).
- **Charts answer a question**: bars to compare, lines for trends over time, a table when exact numbers
  matter; labeled axes, unit and period; one color per series, with contrast.
- **Titles state what the user learns or decides** ("Revenue 8% below target in March"), not the chart type.
- **Every element earns its place**: real data, real state, a real action. Loading, empty and error states
  are designed, not left blank.
- **Copy**: plain, specific, in the project's voice and UI language; emoji only if the brand uses them.
- **Motion** only to explain a change of state, short (≤ 200 ms), and off under `prefers-reduced-motion`.

## In the plan and in the review

- **Plan**: name the design reference followed (design system, Figma, golden screen). A tell above that is
  wanted → cite who asked for it.
- **Review**: each tell found without an explicit request is a finding:
  `file:line — <pattern> → <alternative from the project's design>`.
