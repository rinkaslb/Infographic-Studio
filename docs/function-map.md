# Function ownership and extraction map

## Executable phase-1 files

All listed functions retain their V20 bodies. Source ranges in `function-map.json` refer to the executable JavaScript inside V20, beginning with its strict-mode directive, not the full HTML file. Load order is in `script-order.json`.

Some groups still contain mixed concerns or anonymous event handlers. Their separation is a later phase, documented below; these are not presented as final isolated service modules.

| Current file | Named functions currently extracted |
|---|---|
| `utils/dom.js` | Declarations, configuration or existing event bindings. |
| `core/dependencies.js` | Declarations, configuration or existing event bindings. |
| `state/session.js` | `defaultFocus()` |
| `core/workflow.js` | `captureWorkflow()`, `syncObjectControls()`, `syncWorkflow()`, `currentTuning()`, `applyTuning()`, `resetDraft()`, `updateMappings()`, `drawBeats()`, `markBeat()`, `inspectBeat()`, `setPreview()`, `generate()`, `openFine()`, `closeFine()` |
| `diagram/roles.js` | `canvasBackground()`, `isBackgroundLayer()`, `activeLayers()`, `defaultSelection()`, `layerName()`, `inferRoles()`, `inferredRoles()` |
| `core/story-controller.js` | `storySettings()`, `storyPhase()`, `refreshStoryCopy()`, `setMode()` |
| `utils/serialization.js` | `safeJson()`, `escapeHtml()` |
| `animation/narrative-runtime.js` | `createNarrativeRuntime()` |
| `animation/legacy-runtime.js` | `createStoryRuntime()`, `extendedMotionCss()` |
| `diagram/parse-layers.js` | `cleanSvg()`, `legacyLayerNodes()`, `previousLayerNodes()`, `v3LayerNodes()`, `layerNodes()` |
| `state/selectors.js` | `settings()` |
| `animation/controls.js` | `stop()`, `animate()`, `motionCss()` |
| `diagram/prepare.js` | `preparedSvg()` |
| `ui/canvas.js` | `render()`, `showLayers()` |
| `ui/library.js` | `choose()`, `notice()` |
| `utils/download.js` | `filename()`, `download()` |
| `ui/editor-bindings.js` | Declarations, configuration or existing event bindings. |
| `export/html.js` | `exportInteractiveHtml()` |
| `ui/export-menu.js` | `closeExport()` |
| `state/project-files.js` | Declarations, configuration or existing event bindings. |
| `ui/goal-cards.js` | `bindGoalPreview()` |
| `diagram/labels.js` | `initializeDiagramLabels()`, `captureLabelLayout()`, `fitDiagramLabels()` |
| `diagram/icons.js` | `svgIconNodes()`, `drawSvgIcons()`, `replaceSvgIcon()` |
| `ui/label-editor.js` | `editableSvgLabels()`, `drawSvgLabels()` |
| `export/jobs.js` | `exportProgress()`, `exportCheck()`, `runAssetExport()` |
| `export/capture.js` | `localPaintRefs()`, `snapshotSvg()`, `svgString()`, `svgPixels()`, `exportSize()`, `createExportCapture()`, `cycleTime()` |
| `export/png.js` | `exportPngFrame()` |
| `export/animated-svg.js` | `exportAnimatedSvg()` |
| `utils/binary.js` | `binaryJoin()` |
| `export/apng.js` | `pngU32()`, `pngChunk()`, `pngDeflate()`, `pngHeader()`, `pngFrameControl()`, `exportAnimatedPng()` |
| `export/gif.js` | `gifPalette()`, `gifIndices()`, `gifLzw()`, `gifU16()`, `gifHeader()`, `gifFrame()`, `exportGifPixels()`, `exportAnimatedGif()` |
| `ui/main-tuning.js` | `syncMainTuning()`, `updateMainTuning()` |
| `state/object-settings.js` | `readObjectTuning()`, `objectConfig()` |
| `diagram/theme-frame.js` | `resolvedTone()`, `normalizeDiagramFrame()`, `refreshLibraryFraming()`, `applyExampleTone()`, `exportBackdrop()`, `detectedTone()`, `syncPreviewTone()`, `setPreviewTone()` |
| `ui/fine-tune.js` | `objectDisplayName()`, `migrateGlobalMotion()`, `drawFineObjects()`, `mountFinePreview()`, `selectFineObject()`, `updateFineObject()` |
| `ui/timeline.js` | `drawTimeline()`, `moveBeat()`, `updateTimeline()`, `previewTimeline()` |
| `core/bootstrap.js` | Declarations, configuration or existing event bindings. |

`ui/fine-tune-bindings.js` contains the later per-object event bindings separately. It loads after `ui/editor-bindings.js` so the existing Reset Object behavior still overrides the retained earlier reset callback.

## Remaining cleanup destinations

| Current function/handler | Target owner | Change when migrating |
|---|---|---|
| `cleanSvg()` | `diagram/sanitize.js` plus `diagram/parse.js` | Separate input validation/parsing from the existing SVG allowlist without changing either policy. |
| `layerNodes()` | `diagram/layer-detection.js` | Keep logical parent grouping and background exclusions. |
| `legacyLayerNodes()`, `previousLayerNodes()`, `v3LayerNodes()` | `diagram/legacy-layer-detection.js` | Retain for project-index migration; do not use as the current editor detector. |
| `canvasBackground()`, `isBackgroundLayer()`, `layerName()` | `diagram/layer-detection.js` | Reuse one static-background policy across preview/export. |
| `inferRoles()` | `diagram/roles.js` | Remain explicit about manual roles and active objects. |
| `inferredRoles()`, `activeLayers()`, `defaultSelection()` | Diagram selectors/controller adapter | Remove reads of current globals by passing diagram metadata, selection and roles. |
| `initializeDiagramLabels()`, `captureLabelLayout()`, `fitDiagramLabels()`, `editableSvgLabels()` | `diagram/labels.js` | Pass source and measurement host; return edited source/layout rather than reassigning `original`. |
| `svgIconNodes()`, `replaceSvgIcon()` | `diagram/icons.js` | Keep replacement sanitization and ID/reference rewriting. |
| `drawSvgLabels()`, `drawSvgIcons()`, icon-file handler | `ui/label-editor.js`, `ui/icon-editor.js` | Dispatch edits; stop parsing/mutating source in UI handlers. |
| `normalizeDiagramFrame()`, `refreshLibraryFraming()` | `diagram/frame.js` and `ui/library.js` | Separate geometry/frame normalization from thumbnail iteration. |
| `detectedTone()`, `resolvedTone()`, `applyExampleTone()` | `diagram/theme.js` plus state selector | Theme takes explicit source/tone; the selector resolves Auto. |
| `syncPreviewTone()`, `setPreviewTone()` | UI theme binding/core command | Dispatch and render; no theme algorithm in the view. |
| `preparedSvg()` | `diagram/prepare.js` | Explicit source, selection, roles, namespace, tone and frame; return a prepared instance. |
| `captureWorkflow()`, `currentTuning()`, `settings()`, `storySettings()` | `state/selectors.js` and `core/compatibility-adapter.js` | DOM reads stay in the adapter until their fields migrate to the store. |
| `applyTuning()`, `resetDraft()`, `updateMappings()`, `generate()` | `core/story-controller.js` | Coordinate store updates and diagram-derived story data. |
| `defaultFocus()`, `recipes`, `narratives`, visible style aliases | `animation/presets.js` and story-plan compiler | Preserve serialized IDs and all legacy aliases. |
| `createNarrativeRuntime()` | `animation/narrative-runtime.js` | Keep self-contained until shared runtime packaging can include extracted helpers. |
| `createStoryRuntime()` | `animation/legacy-runtime.js` | Preserve older custom playback until compatibility work is complete. |
| `motionCss()`, `extendedMotionCss()` | `animation/motion-css.js` | Include in both editor and standalone export packaging. |
| `animate()`, `stop()`, `inspectBeat()`, `setPreview()` | `core/app-controller.js` | Coordinate the instance registry; keep runtime disposal and preview behavior. |
| `render()`, `showLayers()`, `drawBeats()`, `markBeat()`, `storyPhase()` | `ui/canvas.js`, list/beat views | Render selector data and consume playback callbacks. |
| `choose()` and import-file handler | Core diagram import command, `ui/library.js` | Source replacement, selection defaults and view refresh become one controlled operation. |
| `notice()` | `ui/notifications.js` | Inject notification callback into download/export services. |
| `filename()` | State filename selector | Keep existing filename normalization. |
| `download()` | `utils/download.js` | Receive filename and notification callback instead of reading controls. |
| Save/Load JSON handlers | `state/project-codec.js`, `project-migrations.js`, UI bindings | Extract validation, old-detector remapping and serialization from event callbacks. |
| `readObjectTuning()` | `state/validators.js` | Preserve accepted effects, trigger and numeric normalization. |
| `objectConfig()` | `state/selectors.js` | Return defaults merged with explicit object settings. |
| `syncMainTuning()`, `updateMainTuning()` | `ui/main-tuning.js`, core animation command | Preserve defaults versus per-object override precedence. |
| `objectDisplayName()`, `drawFineObjects()`, `selectFineObject()` | `ui/fine-tune.js` with diagram-derived display metadata | Keep the current individual-object view and naming. |
| `openFine()`, `closeFine()`, `mountFinePreview()`, `updateFineObject()`, `migrateGlobalMotion()` | Fine Tune controller/view plus state migration | Retain focus, isolated preview, override migration and cleanup. |
| `drawTimeline()`, `moveBeat()`, `updateTimeline()`, `previewTimeline()` | `ui/timeline.js` and story controller | Keep hidden compatibility functionality and saved beat ordering. |
| `exportInteractiveHtml()` | `export/html.js` | Use captured inputs and a complete runtime package; no editor-global lookup in the final service. |
| Editable SVG export callback | `export/editable-svg.js` | Source clone + theme/frame/font packaging, independent of download-button binding. |
| `runAssetExport()`, `exportCheck()`, `exportProgress()` | `export/jobs.js` plus progress adapter | Job-local cancellation/progress instead of global flags and control IDs. |
| `createExportCapture()`, `cycleTime()`, `exportSize()` | `export/capture.js` | Isolated runtime/host lifecycle and deterministic seek. |
| `snapshotSvg()`, `svgString()`, `localPaintRefs()`, `exportBackdrop()` | `export/snapshot.js` | Capture current frame and preserve references/static background consistently. |
| `svgPixels()`, `exportGifPixels()` | Raster rendering adapter under `export/capture.js` | Own image decoding, buffers, supersampling and object URL cleanup. |
| `exportPngFrame()` | `export/png.js` | Preserve current-frame snapshot behavior. |
| `exportAnimatedSvg()` | `export/animated-svg.js` | Existing sample-to-vector tracks and reduced-motion fallback. |
| `exportAnimatedPng()` | `export/apng.js` | Render/sample orchestration only. |
| `pngCrcTable`, `pngU32()`, `pngChunk()`, `pngDeflate()`, `pngHeader()` | `export/encoders/png-chunks.js` | Existing chunk/compression algorithms. |
| `pngFrameControl()` | `export/encoders/apng-container.js` | Existing APNG control-chunk construction. |
| `exportAnimatedGif()` | `export/gif.js` | Capture/sampling orchestration only. |
| `gifPalette()`, `gifIndices()` | `export/encoders/gif-palette.js` | Existing palette and quantization behavior. |
| `gifLzw()` | `export/encoders/gif-lzw.js` | Existing byte encoder. |
| `gifU16()`, `gifHeader()`, `gifFrame()` | `export/encoders/gif-container.js` | GIF container construction. |
| `binaryJoin()` | `utils/binary.js` | Pure typed-array concatenation. |
| `safeJson()`, `escapeHtml()` | `utils/serialization.js` | Safe inline JSON/HTML serialization. |
| Dependency loading, `engineReady`, `fontReady` | `core/dependencies.js`, future `export/runtime-assets.js` | Preserve current startup first; later vendor/license/package the pinned runtime assets. |

## Runtime helper ownership after packaging is ready

- `box()`, `locate()` coordinate conversion: geometry adapter and interaction controller.
- `network()` graph resolution: diagram geometry, supplied to animation.
- `language()` style branches: the six `animation/styles/*.js` implementations.
- `trimCables()`: shared connector-trim effect; preserve intersection with authored masks.
- `readLabels()`, `orderedLabels()`: diagram text/reading metadata.
- `readWipe()`: label-reveal effect.
- `customObject()`, `tune()`, override precedence: object-overrides effect and animation settings adapter.
- `followMagnet()`, `release()`, `respond()`, `engage()`: interaction controller plus Magnet style.
- `snapshots`, `originalTransform()`, `baselineOpacity()`, `originalFilter()`, `reset()`: authored-state snapshot/restoration.
- `overlay()`: disposable, invisible SVG mask/clip allocation.
- `play()`, `focusBeat()`: story timeline compiler/builder.
- `moveCamera()`, older `journey()`, `drawArtwork()`, `wipe()`, `resultReveal()`: retained low-level effects and compatibility paths.

These helpers currently live inside the runtime factory. They are intentionally not duplicated in separate unused files in this ZIP.
