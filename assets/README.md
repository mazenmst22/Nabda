# `assets/`

Design-time source assets. **Nothing here is served by the application.**

Anything the Next.js app loads at runtime lives in [`../public/`](../public) instead. The two are deliberately separate: `assets/` holds the high-fidelity originals a designer works from, `public/` holds the optimised derivatives a browser downloads.

## Layout

| Path            | Contents                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------- |
| `fonts/source/` | Original font distributions as delivered. The runtime `.woff2` subsets live in `public/fonts/`. |
| `images/brand/` | Logos, marks and marketing graphics — Nabda wordmark, the Al-Nuqta mark, the Pulse logo.        |
| `images/ux-ui/` | Raster exports of design work: design-system boards, UI inventories, screen captures.           |

## Rules

1. **Never import from `assets/` in application code.** If the app needs a file, export an optimised copy into `public/` and reference that.
2. Filenames are lowercase and hyphenated. No spaces — they break shell scripts, CI paths and URLs.
3. Prefer vector (`.svg`) for brand marks. Ship raster only where the source is genuinely raster.
4. Large binaries are committed as-is. Before adding anything over ~5 MB, ask whether the repository is the right home for it.

## Related

- Design specifications and prototypes: [`../ux-ui/README.md`](../ux-ui/README.md)
- Brand tokens as consumed by code: `src/styles/tokens.css`
