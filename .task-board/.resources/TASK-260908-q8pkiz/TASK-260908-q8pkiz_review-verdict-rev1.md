# Consolidation review — revision 1

- task: TASK-260908-q8pkiz
- reviewer: RUN-260908-555760
- verdict: changes_requested
- repeat-of: none
- finding: F1 (stable published navigation)
- candidate tree: bdbeeea1474b0c37160338a86d7fbe287e4ee6ee
- base: 187ace42aa98a06948ace94d7973ea7a7547f59f
- repository_delta: present, 35 paths; documentation consolidation over accepted architecture/research.
- route: to-dev; no acceptance, integration, commits or publication performed.

## F1 — README retains a transient lifecycle assertion

README.md:38 in the exact candidate says: “сборка документации ещё проходит независимый review и интеграцию.” The explicitly attached final-review scope requires stable published navigation and forbids precisely this assertion: it becomes false when the accepted tree lands. This is ordinary bounded editorial rework, not an external blocker.

Replace this clause with stable wording referring to TASK-260908-q8pkiz and its review evidence/lifecycle record without claiming a current pending state or prematurely claiming delivery. Timestamped planning/provenance snapshots may retain their historical status. Do not reopen architecture decisions or rewrite accepted research. Recheck the changed README and its links, run the configured gates, and hand off a new CR for focused review. repeat-of: none (first review of this consolidation revision; the prior parent nudge was a requirement, not a prior reviewer finding).

## AC coverage and retained evidence

The single broad AC has named checks for 1/1 rows: DOC-NAV (Russian guide/status and original v0.1 navigation), DOC-LINK (combined Markdown parsing), DOC-PROVENANCE (16 hashes and LF comparison), DOC-JSON, DOC-DIAGRAM, DOC-CONSISTENCY and DOC-GATES. AC is not accepted because DOC-NAV fails F1. No production code exists in this delta; runtime driving tests are inapplicable and 0 were run. V01–V21 remain prospective design probes.

All candidate repository files outside the board checkout were byte-compared with the live worktree: no mismatches. The 35-path base diff and consolidation edits relative to full checkpoint 7da174638fa1061e05774c151166d5f7356713c1 were inspected. Accepted architecture reviewer RUN-260908-4c245d rev2 and its R2-01–R2-12 counter-scenarios are retained for unchanged semantics, not claimed as rerun. Original research source reading was not repeated.

Independent executions of the producer's inspected scratch validators, copied to reviewer scratch so original evidence was not overwritten:

- `python3 .temp/TASK-260908-q8pkiz-review/validate.py`: exit 0; 37 Markdown files, 285 local links, 9 JSON files, 6 JSON examples, 11 PlantUML/SVG pairs; 16/16 current hashes, 15/16 original hashes unchanged and Claude exactly one LF removed.
- `python3 .temp/TASK-260908-q8pkiz-review/pandoc-check.py`: exit 0; 37/37 GFM documents parsed; 285 local links/images; V01–V21 are 21/21 rows in one actual parsed table.
- `python3 .temp/TASK-260908-q8pkiz-review/run-gates.py`: all 3 configured commands exit 0. Exact commands and output paths are in gates.json; includes untracked-file whitespace checks.
- `rsvg-convert -b white -o .temp/TASK-260908-q8pkiz-review/process-trust.png diagrams/apiary/process-trust.svg` and equivalent task-integration command: exit 0. Both PNGs directly inspected; readable labels and flow, no obscuring clipping. Other unchanged diagram visual reviews are reused; 11/11 source rendering byte-equality results are accepted from producer diagrams.json, not independently rerendered with PlantUML.

Navigation exposes all seven chapters, source catalog/depth, original v0.1 and all 11 focused diagrams. The restored archive and 13 requirement trace rows are present. Unresolved questions retain external inputs and falsifiable experiments with owners/evidence, not settled architectural choices. No pooled-consumer-subscription, implemented-reserved-v0.1 or measured-performance claim was found in the changed consolidation prose. Source evidence describes the one floating non-evidence Firecracker locator honestly; 159 pinned blob locator shapes are static checks, not network availability proof.

Credential corrections consistently keep candidate signing at a distinct runner service and raw authoritative main/ref write solely at publication-gateway. Contributor signatures are separate. External mirroring remains asynchronous/separate from local authoritative publication. V19–V21 preserve rev2 recovery/refusal content. Missing-research placeholders in the executive map and source introduction are corrected. Historical rev1/rev2 log entries are history, not present-tense delivery assertions.

## Negative evidence

A disposable copy of the complete deliverable drove the actual document-checker entry point, with Git object reads available through a read-only alternate object directory. Baseline exit 0. Four independently changed inputs were rejected, 4/4: absent target, substituted wrong anchor, self-minted duplicate JSON status key, and removed SVG. Exact errors and exits are in negative-controls.json and named logs. These are document-checker falsifiers, not runtime gate mutants or proof of exhaustive Markdown/JSON semantics. Missing SVG produced explicit read errors, not empty success. The textual lifecycle assertion in F1 demonstrates a semantic blind spot of otherwise green structural checks.

## Logbook and limitations

2026-09-08: task-board status start succeeded. Unsupported `element` query and `resources` projection were corrected via get/outcomeResources; failed reads were never treated as absence. Git/Python/task-board readiness and Pandoc 3.11/rsvg-convert 2.62.3 checked. The first disposable negative-control attempt lacked frozen Git objects and was invalid as evidence; a positive baseline then passed with read-only object alternates and all four controls were rerun for the expected reasons. Only the corrected results count. Run goal query reports not goal-bound; directives empty. No runtime/provider/network probes, tool installs, source changes, subagents or candidate edits. Broader accepted source and diagram evidence is reused as explicitly allowed. This task-scoped verdict and evidence must be attached before routing to-dev.
