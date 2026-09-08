# Consolidation: ready for review

Task: TASK-260908-q8pkiz — consolidate-architecture-and-reading-guide.
Role: doc-writer. Work is uncommitted in the managed STORY-260908-2o9ao6 worktree; parent owns signed hosted delivery. No source-repository changes, runtime implementation, installs, provider account calls, commits, branch changes or child agents.

## Review scope

- Replaced README with technical Russian vision, sequential reading guide, all seven architecture chapters, all major research sources/catalogs, diagram atlas, existing normative v0.1 navigation, explicit proposal status, tool commands and output locations.
- Added UNRESOLVED_QUESTIONS.md: Q1–Q3 external inputs and E1–E8 falsifiable engineering experiments, owners and closure evidence. Settled Go/kernel/central/MCP/XMPP/L0 choices are not reopened.
- Restored the initial planning export byte-for-byte and generated a current canonical task-board plan. Added factual outcomes and concise epic requirement-to-document trace in .planning/README.md. Neither this leaf nor the architecture epic is declared delivered.
- Replaced stale missing-research placeholders in .spec and evidence. Added current-inputs.json; the original accepted-inputs entries are unchanged.
- Corrected candidate signing vs publication authority in models-context/kernel/migration. Runner uses a candidate commit signing service; raw local main/ref write authority remains exclusively with publication-gateway. Contributor node signatures and external mirror credentials remain separate.
- Joined V19–V21 to the original negative conformance table and corrected the backward Seal/Submission prose reference.
- Added root diagram atlas; explicitly marks the research kernel diagram's optional signing as an early rejected proposal, not an active model-visible tool. Diagram source/SVG bytes are unchanged.
- Annotated the historical Firecracker main-branch document link: already used_as_evidence=false; it is not an immutable source pin and does not support architecture claims. The separately cited NSDI paper remains the research source. No broad upstream refetch occurred.

These are navigation and minimal consistency corrections to accepted rev2, not new substantive architectural decisions. The independent reviewer should check the exact handoff CR tree, not infer acceptance from this self-review.

## Exact provenance

- Starting combined HEAD: 14a01125574f1f4de0e5fe575b65e71a747df2d0.
- Accepted architecture: TASK-260908-2qhe31 rev2, reviewer RUN-260908-4c245d; checkpoint 7da174638fa1061e05774c151166d5f7356713c1.
- HEAD..main count: 0 at validation; this does not claim a fresh remote fetch.
- All three research leaves read as done before edits: TASK-260908-2x6kuv, TASK-260908-1ir76l, TASK-260908-39n05p.
- Original input identity: all 16 entries unchanged; 15/16 landed files match original SHA-256. Claude lineage original Git tree blob equals landed bytes plus exactly one LF.
- Claude landed SHA-256: 58ae4e392b49ce5c675d9639f52d83afc7fde15ed4c75e3ac5619c6eac9fe379, 45312 bytes; rev2 accepted by RUN-260908-ad29e7, candidate tree 684c00b4432eac12199a60a68901a4b14fde5912. Historical candidate trees are not published commit IDs.
- No changes to protocol/, schemas/v1/, decisions/, research bodies/catalogs or existing diagram pairs. Inventory and scope.json record the exact checked bytes.

## Validation actually run

| Check | Measured scope | Exit |
|---|---|---:|
| python3 .temp/TASK-260908-q8pkiz/validate.py | 37 Markdown files, 285 local links/anchors, 9 JSON files, 6 strict JSON examples, 11 SVG XML, 16 current input hashes | 0 |
| python3 .temp/TASK-260908-q8pkiz/pandoc-check.py | GFM parsed 37/37; 914 rendered links/images, 285 local; V01–V21 all 21 in one rendered table; each of 37 Pandoc subprocess exits recorded | 0 |
| PlantUML -tsvg -charset UTF-8, copied sources under task scratch | 11/11 pairs rendered; all 11 outputs byte-equal to checked-in SVG | 0 |
| rsvg-convert for research kernel/recovery | 2/2 PNG conversions and direct image inspection | 0 each |
| Scope/provenance assertions | 16 historical entries retained, normative/research files unchanged, initial planning export byte-equal, 11 source/SVG pairs unchanged | 0 |
| pandoc -f gfm -t html README.md -o task-scratch/README.html | HTML reading-guide artifact | 0 |
| Configured gate 1: git diff-tree --check HEAD | Current recorded HEAD | 0 |
| Configured gate 2: git diff --check HEAD | Tracked working changes | 0 |
| Configured gate 3: exact configured Python3 untracked gate | All untracked paths except .task-board; config command preserved in gates.json | 0 |

All three configured commands were run as separate foreground processes by run-gates.py; stdout/stderr saved directly, no tee or lossy pipeline. Handoff will run the configured gates again against its candidate.

Source reference check is bounded: 159 distinct GitHub blob URLs in the two research JSON catalogs have exact 40-hex commit locators; one floating document URL is explicitly unused evidence. External availability, complete upstream bodies and semantic truth of every citation were not re-audited. GFM AST checks include reference-style links and explicit HTML anchors; code examples are not mistaken for links. JSON syntax/duplicate-key validation does not claim schema conformance for proposed objects. Go sketches are explicitly non-compilable design sketches.

Prior visual evidence reused: nine Apiary views are byte-identical to accepted architecture checkpoint; RUN-260908-4c245d rev2 independently reviewed the two changed process/task views and retained seven rev1 visual checks. No new nine-view visual audit claimed. The two research views were independently viewed here: legible labels and arrows, no clipping hiding meaning; the wide kernel view is intended for SVG zoom. Diagram semantics are bounded by the source-vs-accepted-design note.

Runtime probes: 0. Provider entitlement probes: 0. Benchmarks: 0. The prospective V01–V21 matrix remains future runtime qualification, not evidence of executable safety.

## Logbook and honest failures

See TASK-260908-q8pkiz_logbook.md. Initial standalone status mutation exited 1 because estimate was missing; estimate=5 was set and development then entered (exit 0). Initial custom validator exited 1 due to inline-regex false reference and a too-broad assumption that every catalog blob URL was pinned. The checker now excludes inline code and reports the explicitly unused floating document separately. Initial Pandoc checker exited 1 because it omitted explicit HTML anchors; HTML anchor extraction corrected that checker, with no research edits. These failures are checker limitations found and repaired, not hidden document passes.

The first configured gate run returned 0/2/0: paragraph splitting introduced one trailing space in models-context.md. A direct repeat of git diff --check HEAD also exited 2. The trailing space was removed; rerun returned 0/0/0. Initial gate results/log are retained in evidence. No expected-red runtime suite was run.

Checklist interpretation: “Docs consistent with code” refers to accurate absence of runtime implementation and preserved normative v0.1, not a new implementation claim. No blocking external input remains for this documentation handoff. Review and managed integration are pending.
