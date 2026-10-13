# Incremental production architecture

## 1. Scope and current baseline

The goal is a maintainable implementation of the working V20 product. No feature, visible control, export format, animation language or project compatibility is removed. The three-column interface remains unchanged. Timeline functionality and earlier workflows remain available to compatibility code even where their controls are hidden.

This ZIP implements a mechanical first extraction. `index.html` is executable now. The remaining phases below introduce explicit ownership and APIs gradually. A file split alone does not resolve shared state or make the product production-ready.

Use the complete current file/function inventory in `function-map.md` together with these target boundaries. Do not create every suggested helper immediately: split it when that responsibility is being migrated and has a regression test.

## 2. Proposed folder structure and concrete files

The following is the end-state structure. Some files already exist in the executable package; others are explicitly future extraction destinations.

| Folder | Target files | Responsibility |
|---|---|---|
| `core/` | `bootstrap.js`, `app-controller.js`, `story-controller.js`, `contracts.js`, `dependencies.js`, `compatibility-adapter.js` | Assemble services; coordinate user commands; define plain-data interfaces; adapt remaining legacy calls. |
| `diagram/` | `parse.js`, `sanitize.js`, `layer-detection.js`, `legacy-layer-detection.js`, `roles.js`, `geometry.js`, `labels.js`, `icons.js`, `theme.js`, `frame.js`, `prepare.js`, `examples.js` | Parse and edit diagram data; identify logical objects; derive layout; prepare disposable SVG instances. |
| `animation/` | `runtime.js`, `narrative-runtime.js`, `legacy-runtime.js`, `presets.js`, `story-plan.js`, `timeline-builder.js`, `interaction-controller.js`, `snapshot.js`, `runtime-package.js`, `motion-css.js` | Compile narrative behavior; own GSAP timelines, interactions, reset and exported runtime assembly. |
| `animation/styles/` | `riffle.js`, `branches.js`, `layers.js`, `magnet.js`, `scan.js`, `cables.js` | Each style appends its existing motion to a shared timeline through a small common contract. |
| `animation/effects/` | `connector-trim.js`, `label-reveal.js`, `object-overrides.js`, `camera.js` | Shared low-level effects already present in V20; no new effects or controls. |
| `export/` | `jobs.js`, `capture.js`, `snapshot.js`, `html.js`, `editable-svg.js`, `animated-svg.js`, `png.js`, `apng.js`, `gif.js`, `runtime-assets.js` | Capture immutable input, render disposable frames, encode and package each supported format. |
| `export/encoders/` | `gif-palette.js`, `gif-lzw.js`, `gif-container.js`, `png-chunks.js`, `apng-container.js` | Existing local binary algorithms, independent of editor UI and live SVG. |
| `ui/` | `canvas.js`, `library.js`, `goal-cards.js`, `label-editor.js`, `icon-editor.js`, `fine-tune.js`, `timeline.js`, `export-menu.js`, `bindings.js`, `studio.css` | Render existing views; collect user intent; accessibility, focus and control binding. |
| `state/` | `store.js`, `actions.js`, `selectors.js`, `project-codec.js`, `project-migrations.js`, `validators.js`, `runtime-registry.js` | Serializable project state, explicit updates, legacy JSON migration, transient runtime ownership. |
| `utils/` | `dom.js`, `serialization.js`, `download.js`, `binary.js`, `disposable.js` | Small, reusable infrastructure with no product-state dependency. |

Development remains framework-neutral. A future Vue host can call the same controller interfaces without moving SVG parsing, motion or encoders into Vue components. This package does not perform a Vue migration.

## 3. Module boundaries and permitted dependencies

| Module | May depend on | Must not own |
|---|---|---|
| `utils` | Native browser APIs | Studio state, views, narrative choices. |
| `state` | Utilities and plain-data contracts | DOM nodes, GSAP objects, rendering. |
| `diagram` | Utilities and contracts; browser SVG measurement adapters | Editor controls, export buttons, GSAP playback. |
| `animation` | Utilities, contracts, GSAP; supplied diagram layout | Parsing uploads, saving projects, editor DOM IDs. |
| `export` | Utilities, diagram preparation, animation runtime/package | Mutating the live editor state or depending on editor controls. |
| `ui` | Selectors and injected command callbacks | Binary encoding, role inference, project migration. |
| `core` | All services | Reimplementing algorithms that belong to those services. |

`core` wires dependencies. Services receive input rather than reaching upward into `core`. `state` does not import UI; the store notifies subscribers. UI submits commands to controller callbacks. Export requests a runtime through an injected factory rather than referencing editor instances.

The ZIP's current classic scripts still share globals. Those are the compatibility boundary for phase 1, not the proposed dependency model. Load order is explicit in `script-order.json`. Local scripts remain classic scripts so double-click launch works without relying on `file://` ES-module loading or fetching local JSON.

## 4. Contracts and function ownership

Use JSDoc contracts and runtime validation initially; adding a compiler is unnecessary.

- `DiagramDocument`: sanitized source SVG, source revision, logical-layer metadata, manual roles and editable-label/icon metadata.
- `DiagramLayout`: measured object bounds, label bounds, connector relationships and coordinate conversions. DOM measurement is represented as a service; raw DOM nodes stay in an instance-specific lookup table.
- `StoryPlan`: existing preset ID and three beats, retaining stage, order, duration, focus and object references.
- `AnimationSettings`: trigger, intensity, reduced-motion policy and object overrides.
- `PreparedDiagram`: disposable SVG instance, logical-node lookup and namespace information.
- `AnimationRuntime`: `play()`, `previewBeat()`, `reset()`, `destroy()` and access to its seekable timeline. Interactive release remains owned by the runtime.
- `ExportRequest`: format, captured project/settings, runtime assets, cancellation signal and progress callback.

Preserve the public runtime methods during every phase. Do not rename serialized preset IDs such as `recover` merely because the visible style is Reveal. Keep visible labels separate from project identifiers.

The function map documents every top-level named function and the important anonymous handlers. Nested runtime helpers remain inside their self-contained runtime until runtime packaging is implemented.

## 5. State management strategy

Use one small plain-JavaScript store with `getState()`, `dispatch(action)` and `subscribe(listener)`. No state library is necessary.

Separate persisted state from transient resources:

| Persisted project data | Transient editor data | Runtime resources |
|---|---|---|
| Source SVG and label/icon edits | Original/Animated preview selection | Main, Fine Tune and timeline runtimes |
| Selected logical objects and manual roles | Selected Fine Tune object | GSAP timelines and tracking tweens |
| Generated beats and their order/duration | Drawer/menu focus and open state | Mounted SVG DOM lookups |
| Defaults and per-object overrides | Export progress and cancellation state | Object URLs, image buffers, listeners |
| Existing theme and filename settings | Layout caches keyed by source revision | Dependency source text and font resources |

The current source SVG already includes layout metadata and edits. Retain that representation first. Do not simultaneously introduce an operation-log document model.

Migrate fields one at a time. Before a field migrates, the compatibility adapter reads its existing variable or DOM control. After it migrates, the store becomes authoritative for that field and the UI renders from it. Never allow the store and an input to be independent authorities.

Suggested actions correspond to existing behavior: import diagram, edit label, replace icon, select object, assign role, apply preset, update animation defaults, update an object override, reorder/update a beat, select preview/theme, load project. These are internal commands, not new UI.

Keep `project-codec` responsible for JSON validation and migration. Continue reading project `version: 1` and all retained layer-detection versions. Introduce persistent object IDs only in a later, separately reviewed migration: resolve the old numeric indices with the detector version saved in the file, then map them to stable IDs. Preserve unmatched or ambiguous selections safely; do not silently associate them with unrelated objects.

## 6. Animation architecture

Maintain two existing paths: the GSAP narrative runtime and the legacy/custom runtime. A single factory selects the path from current settings. Do not delete legacy playback while project migration still depends on it.

The target pipeline is:

1. Receive a prepared SVG instance, layout, story plan and settings snapshot.
2. Snapshot authored transforms, opacity, filters, masks, clips and paint-related state.
3. Compile the three beats and object overrides into a seekable GSAP timeline.
4. Attach the existing pointer, keyboard, hover/click and reduced-motion behavior through an interaction controller.
5. Dispose listeners, tracking tweens and masks deterministically.

Each style exposes `appendToTimeline(context)`. The context supplies the timeline, beat window, active objects, resolved relationships, settings, authored-state access and invisible mask/clip helpers. Effects do not read `$()` or modify story data.

For Flow and Connections, `diagram/geometry.js` supplies the resolved graph. Animation schedules it. For Scan, diagram processing identifies labels; animation reveals them. For Magnet, the interaction controller supplies root-space pointer coordinates and owns live tracking; generated playback remains a deterministic timeline for capture.

**Critical export constraint:** V20 embeds runtime functions with `.toString()`. Extracting their nested helpers into unrelated globals would break standalone HTML. Phase 1 keeps both factories self-contained. Before splitting styles/effects out, implement `runtime-package.js` so exports include the exact same helpers and style implementations as the editor. The packaged runtime must execute with only its SVG, configuration, GSAP and browser APIs. It must not reference editor controls, module paths or project-store globals.

No runtime rewrite is needed: introduce the context/factory around the existing functions, then extract one helper/style at a time with editor/export parity checks.

## 7. Export architecture

Keep all six formats and their established behavior:

| Format | Input and responsibility |
|---|---|
| Animated HTML | Prepared SVG + settings + self-contained runtime package + embedded GSAP/font. Only the animation frame, with existing interactions and reduced motion. |
| Editable SVG | Sanitized edited source, live text, current neutral-paint theme and normalized frame. No interactive editor UI. |
| Animated SVG | Sample the existing seekable runtime, convert changing SVG/CSS properties into vector playback tracks, retain the static reduced-motion fallback. |
| PNG | Snapshot the current visible animation frame, preserving the existing current-frame behavior. |
| APNG | Render seeked frames and encode PNG/APNG chunks with the existing browser compression path. |
| GIF | Preserve the existing palette, sampling, quantization and LZW/container pipeline. |

An export job captures its inputs at request time. PNG captures the live frame's visual state; animated formats compile a separate runtime from the captured story. A hidden export host never reuses or seeks the editor's runtime.

`capture.js` owns instance creation, seek and destruction. `snapshot.js` preserves computed visual properties and local paint references. Encoders receive pixel buffers or SVG samples, not UI nodes. `jobs.js` manages one active job, cancellation and `finally` cleanup; UI receives progress callbacks.

Replace shared cancellation flags with a job-local cancellation signal when that service is migrated. Preserve existing cancel behavior. Reuse a bounded number of raster buffers and release images/object URLs after each frame. Consider workers only after profiling encoder cost; SVG DOM measurement/rendering must remain supported on the main thread. Workers are not required for the initial refactor.

## 8. Diagram processing architecture

Keep the processing stages explicit:

1. **Parse and sanitize:** validate size/root/viewBox; remove unsupported/unsafe elements, handlers and external references. Reuse `cleanSvg` initially.
2. **Detect logical layers:** retain parent grouping and static-background exclusions. Preserve older detectors exclusively for project migration.
3. **Resolve roles:** apply manual assignments first, metadata second, existing heuristics last.
4. **Edit labels/icons:** modify source clones; preserve font size, common tag growth, fixed icon/text gap, centering and replacement-icon ID namespaces.
5. **Measure:** perform native SVG text/geometry measurement in a mounted host after fonts are ready. Parsing alone cannot supply reliable text metrics.
6. **Resolve relationships:** use native endpoints, transformed geometry and the existing fallback behavior. Represent uncertainty instead of forcing a relationship.
7. **Theme and frame:** apply reversible source-paint mappings and fit visible artwork to the common frame. Backgrounds remain static.
8. **Prepare an instance:** clone, namespace IDs and paint references, attach logical-layer metadata/wrappers and return a disposal handle.

Cache by source revision, font readiness and layout-affecting settings. Label or icon edits invalidate the relevant layout cache. Theme changes can reuse geometry unless an edit actually changes dimensions. Never cache geometry after motion has displaced objects.

Avoid repeatedly parsing the same unchanged source in separate UI functions: give controllers a diagram document and derive indexes once per revision. Introduce that optimization after extraction, with fixture coverage for live text, outlined text, groups, transformed paths, masks and connectors exported as filled outlines.

## 9. UI architecture

Keep the existing HTML and controls. Views render data and emit existing commands. The main canvas view owns its mounted SVG instance but delegates playback to an injected animation runtime. Fine Tune owns a separate instance/runtime and disposes it when closed or remounted. The retained timeline view uses the same factory.

Move parsing, role detection, project normalization and export algorithms out of UI event handlers gradually. Start with project save/load and export-button callbacks because their contracts are clear. Keep focus trapping, Escape handling, keyboard activation and reduced-motion support unchanged.

Use keyed updates for lists and control values when practical. Keep full canvas remounting until selective updates have parity checks; a premature rendering optimization could change geometry and pointer behavior.

Keep `ui/studio.css` intact during extraction. Remove obsolete rules only after documenting their remaining compatibility uses. This task does not redesign styling or introduce a component framework.

## 10. Migration sequence, acceptance and rollback

| Phase | Concrete work | Acceptance gate | Rollback |
|---|---|---|---|
| 1 — included | Extract classic scripts/CSS by responsibility, document load order, preserve V20 fallback. | Separate-script regression checks, identical SVG library and UI structure, successful single-file assembly. | Open `standalone-v20.html`. |
| 2 | Add contracts/store and compatibility adapter; migrate filename/theme/selection first, then defaults and overrides. | Old projects load; controls and exported settings agree; no duplicated authority. | Return the affected selector/action to the adapter. |
| 3 | Separate parsing/sanitizing/detection/measurement; split label and icon UI from source editing. | Uniform tag growth, font/gap preservation, parent-layer selection, icon references and static backgrounds all match. | Keep the previous diagram service behind the same interface. |
| 4 | Extract project codec, validators and migration handlers; leave the saved schema unchanged initially. | Round-trip V20 JSON and fixtures for every retained detector version. | Restore the previous codec implementation. |
| 5 | Wrap runtime factories; introduce shared runtime packaging, then extract style/effect helpers individually. | Same traces, timing, interactions, reset and reduced-motion behavior in editor and standalone HTML. | Route that style through the retained self-contained factory. |
| 6 | Extract job manager/capture/encoders; snapshot requests and introduce job-local cancellation. | All six files decode/play, cancellation releases resources, live editing is not modified by capture. | Keep the previous exporter behind the same format interface. |
| 7 | Remove migrated globals; have UI consume selectors and injected commands. | No algorithm reads editor controls; explicit dependency checks; main/Fine Tune/timeline cleanup verified. | Retain a narrow adapter for the last unmigrated responsibility. |
| 8 — production gate | Pin/vendor GSAP and font resources with licenses; replace dynamic dependency evaluation in the hosted application; establish browser visual tests, deployment/security policy and performance budgets. | Reviewed dependencies, served/local distribution parity, visual/memory/export verification on supported browsers. | Keep the known working packaged release. |

Use small commits, each moving one responsibility and preserving behavior. Do not combine module extraction, state migration, identifier changes and motion changes in one commit.

Classic scripts are appropriate for this transitional local package. The eventual hosted production implementation can expose these same contracts through native ES modules. The standalone distribution and animated HTML remain self-contained outputs assembled from the same source. No npm build framework is required for this package.

## Verification still needed before production

The included regression run uses simulated SVG geometry and GSAP plus actual encoder integration. It does not replace browser rendering verification. Confirm all twelve examples, an imported Figma SVG, light/dark modes, label growth, icon replacement, Fine Tune, hover/click/keyboard behavior, export decoding/playback and repeated open/close/export cycles in the team's supported browsers. Measure text only after the font is ready and check release/cleanup under rapid pointer movement.
