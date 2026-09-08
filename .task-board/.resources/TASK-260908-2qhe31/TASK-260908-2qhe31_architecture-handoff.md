# Architecture handoff — TASK-260908-2qhe31

Status: ready for review. No runtime implementation, commit, push or landing performed.

## Deliverable

- `.spec/apiary-runtime-design.md`: concise design authority and reading map.
- Seven focused Russian chapters in `docs/apiary/`, plus accepted-input digest mapping.
- Nine focused PlantUML sources and rendered SVG under `diagrams/apiary/`, with reproduction commands.
- Approximately 14,000 words of architecture, source/pattern decisions, concrete ports and proposed wire/tool examples.

## Core decisions

Direct inference ModelPort baseline; separate whole-agent AgentBridge compatibility; one shared Go loop with installed profiles; no built-in model tools/MCP. Worker central is explicit sandbox exec/poll/cancel, not universal RPC. Remote WorkspaceRef permits no contributor checkout. Separate process/credential/signing/authority/executor/runner boundaries and full TCB inventory. Durable operation ownership precedes dispatch; unknown effect is not retried. Strict-online L0 admission is serialized with stop; previously admitted effects are explicitly bounded, not magically revoked. Exact candidate review/test/acceptance and CAS do not survive a changed integration tree. Independent check initiator and reviewer ownership are policy predicates, not inferred from distinct keys.

## Requirement trace

| Acceptance group | Artifact |
|---|---|
| Executive vision, source landscape, pattern catalog | reading map; evidence.md (all frozen inputs, 28 landscape donors, deep passes, pins/depth) |
| Shared core, process/TCB, worker/orchestrator, Go ports | kernel.md |
| Curator descriptor/compile/admission/lifecycle, host extensions, one tool | tool-skills.md |
| No-checkout worker, cwd/env/process handles | tool-skills.md; execution.md |
| Provider capabilities/entitlement/billing/assurance, streams/context | models-context.md |
| Identity distinctions, keys, signatures, term/lease/fence/replay, wire/XMPP | authority-wire.md |
| Task-board authority adapter, exact candidate and runner | kernel.md; execution.md |
| Unknown effects, cancel/recovery/failover and coding walkthrough | execution.md; authority-wire.md |
| Migration, threat limits, defaults, future negative probes/experiments | migration-conformance.md |
| Focused diagrams and visual QA | diagrams/apiary/README.md + 9 source/SVG pairs |

## Validation performed by this role

- Frozen accepted inputs: 16/16 SHA-256 match INDEX, including the original Claude EOF hash.
- Own document links: 54 resolved references; research links: 36 occurrences explicitly mapped to accepted logical paths/hashes, not falsely declared present.
- JSON examples: 6/6 parse and digest-shape checks. Examples are proposed illustrative contracts, not signed conformance vectors.
- Diagrams: 9/9 SVG XML parse, 9/9 rendered PNG visually inspected. Process/trust view was revised and reinspected to remove crossing note/clipped label.
- `python3 .temp/architecture/validate.py`: exit 0 on initial and post-logbook passes; JSON report includes scope inventory.
- `git diff --check`: exit 0. Untracked authored files received an explicit whitespace/EOF scan in the validator.
- Existing tracked files unchanged. All authored changes are under `.spec/`, `docs/apiary/`, `diagrams/apiary/`.
- No runtime tests, model account probes, benchmarks, broad research reruns, dependency installations or sibling writes.

## Diagnostics and limits

Initial board query used unsupported task(), corrected to get(); not mistaken for an absent task. First render returned errors on four multiline quoted labels; labels were corrected, all views rerendered. Final renderer calls returned exit 0. No source security audit or runtime implementation conformance claimed. Research inputs remain read-only and are not copied into the candidate. The archive contains artifact validation logs and PNG visual-QA evidence; fixed research bodies are not duplicated.

## Board proportionality / remaining work

This is the assigned architectural design leaf, not an implementation decomposition exercise. No new stories, research tasks, or invented gap scope were created. Future work sequence and dependencies are explicit in migration-conformance.md; before any wire implementation leaf enters development, freeze exact field grammar/sizes and executable vectors as a precondition resource. No current illustrative JSON is represented as that freeze.

Review this exact uncommitted candidate. Consolidation must validate the combined tree after accepted research lands, map any permitted Claude EOF-only hash correction to the landed version, and own README/final UNRESOLVED_QUESTIONS.md navigation. Existing protocol/, schemas/v1/, ADRs and old architecture/threat-model remain normative/unchanged. The proposal is ready for review, not an accepted normative revision.
