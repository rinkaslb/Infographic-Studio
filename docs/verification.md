# Verification of V21 extraction

- 38 JavaScript files passed individual syntax checks.
- 67 functional checks passed with the files evaluated separately, in the same order as `index.html`.
- The assembled single-file V21 distribution also passed all 67 functional checks.
- The original stylesheet and all twelve embedded SVG diagrams are retained.
- The unchanged V20 fallback is verified by SHA-256.
- Existing checks cover six motion styles, known bent-path relationships, constant-speed route tracing, Scan reading cadence, Magnet reuse/return, authored masks/filters, logical parent selection, label growth/centering/font size, icon replacement, Fine Tune, hidden timeline compatibility, save/load, theme mapping, export integration/cancellation, reduced motion and frame sizing.

The test harness simulates SVG geometry and GSAP and exercises real export orchestration/encoder paths with deterministic pixel fixtures. It is not a real browser or a visual quality assessment. Manual browser checks remain required before production. No browser-rendering pass is claimed.

The regression harness itself depends on testing libraries in the execution environment and is not a prerequisite for opening this package. `tools/verify-package.py` supplies portable structural checks using only Python's standard library.

## Browser check before approving a release

Open both `index.html` and `dist/acronis-infographic-studio.html`. Compare with `standalone-v20.html`. Exercise all twelve examples and an imported Figma SVG; edit short/long live-text labels; replace an icon; switch themes; preview each style on hover/click/keyboard; open/close Fine Tune repeatedly; adjust an object; save/load JSON; export all six formats; cancel a raster export; enable reduced motion. Check static backgrounds, exact reset, consistent frame size and standalone HTML with the editor closed.
