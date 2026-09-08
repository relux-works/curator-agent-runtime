# Interactive architecture guide delivery

The primary Site owner implemented the guide inline, following the more-specific Sites lifecycle ownership rule. No spawned agent was given the Site checkout or publishing credentials. The existing documentation project was extended with a static Python/Pandoc build and a self-contained HTML app; no unrelated starter or dependency stack replaced it. The task uses the explicitly recorded inline review=none workflow with owner self-review and a real hosting-platform exact-head review.

## Delivered experience

- Private atlas: https://apiary-architecture.oparin-ig.chatgpt.site .
- Standalone artifact: docs/interactive/apiary.html; same bytes in dist/index.html and dist/apiary.html.
- Ten focused sections; interactive component map with worker/orchestrator profiles; tool-skill lifecycle and operation illustrations; provider/context and protocol explanations.
- Six step-through scenarios, including duplicates, crash after dispatch, stale contract/stop, XMPP reconnect and publication recovery.
- Eleven zoomable original diagrams and an embedded document reader with table of contents, internal document/anchor navigation, back navigation and full-text search.
- All 70 source files preserved from accepted commit 642f6cd6d96bac5a83c4dc53014f4f300f29d966: 37 Markdown, nine JSON, eleven SVG/PlantUML pairs, LICENSE and NOTICE. Two generated directory views are additional navigation entries.
- All 21 prospective conformance cases retained; research depth and source uncertainty remain explicit. Poll/cancel examples are labeled structural illustrations, not frozen wire schemas.
- No external runtime dependencies, fonts, model calls or tracking. Credentials are not in the site files. The app's CSP and document boundary prohibit active remote content.

## Actual verification

The final build passed and verified 447 internal document/anchor references, source SHA-256 values, 11 diagram pairs, 28 repository entries and all 21 future conformance cases. Twelve Node.js/data checks and sixteen Python/static/document-boundary checks passed, including navigation fallback, step boundaries, search behavior, markup escaping, source-attribute stripping, safe URLs, diagram embedding, source preservation and exact script CSP hash. Browser-specific UI tests, screenshots and runtime-conformance probes were not requested or run; no such results are claimed. The available tool catalog lacked open_in_codex, so the user handoff is the deployed URL plus the standalone file. The no-focus browser policy was preserved.

One final source-review correction made the orchestrator inspector title agree with the map's Tool-skills label. It changed only app.js and regenerated HTML. Source commits d827053aec661d8b15f2c28dcc05be76a59fcb3d and f8a3228ed3e124035dd789e607662c16ea6d078c retain the configured human author and valid signatures.

Canonical Sites packaging was used. The first strict archive inventory found macOS AppleDouble metadata; retrying the same helper with standard COPYFILE_DISABLE=1 produced exactly three files. Neither the helper source nor the archive contents were edited manually. Exact source was pushed with an ephemeral per-command HTTP header, then version 2 was saved and privately deployed. Terminal status succeeded is recorded in site-publication.json. No credentials or raw transport headers are included in evidence.

The final GitHub PR https://github.com/relux-works/curator-agent-runtime/pull/7 owns review/landing of the same Site source plus this task's bounded tracking record. Any later tracking-only commit does not change the deployed HTML source. Local operational .goals/write-ledger state remains uncommitted, and the primary goal is not automatically cleared.
