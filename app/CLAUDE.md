# public/ — Static Assets & THE Brand-Asset Map

Files here ship verbatim into `dist/` (and the Android APK). This doc is the canonical
"which logo file is which" reference — check here before hunting for brand art.

## Brand assets ("nt" monogram mark + gradient wordmark, 2026-07-28)

All rasters below are GENERATED from one source lockup. **Never hand-edit them.**

    node scripts/gen-brand-assets.mjs [path-to-new-artwork.png]

| File | What it is |
|---|---|
| `nt-icon.png`, `logo.png`, `logo-web.png` | 512px app-icon rasters of the mark, transparent, inset to the maskable safe area. Identical triplets for favicon/manifest/share slots. |
| `favicon-32.png`, `apple-touch-icon.png` | 32px and 180px of the same mark. |
| `logo-mark.png` | The mark alone, trimmed, native height. |
| `wordmark.png` | The "noobtrader" wordmark alone, trimmed. |
| `logo-lockup.png` | Mark + wordmark together, trimmed, max 1024px wide. |
| `wordmark-dark.png`, `wordmark-light.png` | **Previous brand.** Unreferenced; kept only until anything external stops pointing at them. Deletion candidates. |

Source of truth: **`design/brand/brand-source.png`** — deliberately NOT in `public/`,
which ships verbatim into `dist/` and the APK; the 2MB master has no business being
downloaded by a phone.

The mark is a raster, not inline SVG: it has custom letterforms and a continuous
cyan→violet gradient that a hand-traced path would only approximate.
`src/components/NoobTraderLogo.jsx` renders `<img src="/nt-icon.png">` for the mark and
still renders the **wordmark live** (text + CSS gradient in `noobtrader-logo.css`), which
already matches the new artwork.

⚠ `manifest.json` declares `purpose: "any maskable"`, so Android crops the icon to the
launcher's shape. `gen-brand-assets.mjs` insets the mark to 78% for that reason — if you
regenerate without it, the arrow tip gets shaved off on round launchers.

## Non-brand files
- `manifest.json` — PWA manifest (name, theme color, icons → the PNGs above).
- `architecture-diagram.html` — mirror of `docs/architecture-diagram.html`.

## Rules
- New static asset? Ask if it belongs in `src/` (imported, hashed, tree-shaken) instead —
  `public/` is only for files that must keep a stable URL (favicons, manifest icons).
- Keep images small: this ships to low-end Android; prefer SVG, or PNG ≤ 100KB.
