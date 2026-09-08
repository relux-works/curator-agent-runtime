# Architecture acceptance and synthesis brief

The user requested detailed technical Russian documentation and universal diagrams. The final work must be source-backed design, not a runtime implementation, and must clearly separate existing normative v0.1 rules from the proposed Apiary profile and required future protocol revisions.

## Delivery shape

- A reading guide and executive architecture vision, linked from README.
- A justified source landscape with depth grading, pinned repository revisions, primary materials and known inaccessible or uncertain code lineages.
- A pattern catalog: evidence -> invariant/tradeoff -> adopt/change/reject decision -> architecture element.
- One shared minimal Go-oriented core and concrete worker/orchestrator profiles, with responsibilities, public ports, process topology, state ownership and deployment targets.
- Curator package/tool-skill contracts: package identity, executable interface, schemas, effect policy, runtime admission, process lifecycle, versioning, conformance, installation and epoch activation; distinguish present Curator features from proposed extensions.
- Model-provider and credential adapters separately from model-visible tools; subscription feasibility matrix and safe account lifecycle.
- Transport-independent messages with a concrete XMPP binding; application identities and signatures, admission, replay, deduplication, fencing, acks and durable recovery.
- Authoritative execution/sandbox/runner layer, project-management adapter, submission/review/attestation/integration pipeline tied to exact contract/candidate/policy/environment state.
- Security/threat model and assurance profiles with honest limitations; migration decisions against Apiary paper and existing runtime v0.1.
- Implementation roadmap with meaningful conformance/evaluation plans and risks, without speculative benchmark claims.
- Focused diagrams as versioned code with rendered images: context, deployment/trust, core components, worker turn, tool-skill activation, task/candidate lifecycle, external effect recovery, orchestrator failover, and integration acceptance as useful.
- Unresolved questions must distinguish decisions made with user-granted architectural autonomy from implementation experiments, external provider permissions and true unresolved human choices.

## Specific questions the synthesis must resolve

1. Distinguish the agent loop, protocol authority/validators, sequencer, executor, runner and model provider; the orchestrator model itself must not become the permission or consensus authority.
2. A worker exposes one tool name, but authorization is checked per typed operation and task scope. Decide whether the useful minimum is remote command execution, a typed gateway, or negotiated actions; do not mistake one name for one privilege.
3. Tools live in user space while dispatch/validation/fencing stay in the enforcement boundary. Differentiate model-facing tool-skills from host extensions such as provider adapters and communications. Plugin installation cannot silently mutate a live plan.
4. A common Go binary is not a common trust domain. Give an implementable separation between untrusted model loop, credentials/signing and sandbox supervision.
5. Keep orchestrator term, session epoch, task contract revision, grant expiry, sandbox generation and provider session IDs distinct.
6. Exactly-once effects cannot be assumed after a crash or remote timeout. Define execution uncertainty, durable call state, idempotent commands, reconciliation and non-retryable external effects.
7. XMPP transport receipts do not imply domain authorization, execution completion, accepted revision or consensus. Define an outbox/inbox model, application receipts, bounded queues, artifact transfer and reconnect behavior.
8. Freeze the candidate for review and tests; advancement of the target branch must invalidate or rebuild the candidate as required, never silently reuse evidence for another tree.
9. A worker signature proves signer provenance, not honest inference or truthful context. Execution receipts are issued by the execution domain. Model-provider credentials and personal signing keys remain on the contributor host.
10. Filesystem lexical effect extraction and real path/symlink enforcement must be separate; no deterministic filesystem-free extractor may claim it resolved mutable filesystem reality.
11. Existing protocol permits component/remote bindings but reserves their enforcement; explicitly design these or defer them instead of claiming they already work.
12. Preserve autonomy with pre-authorized bounded capabilities and fail-closed escalation, not endless per-call human prompts or an auto-approving agent.

## Initial primary source leads

- https://openai.com/index/unrolling-the-codex-agent-loop/ (opened 2026-09-08)
- https://learn.chatgpt.com/docs/security (official Codex security URL redirected here; opened 2026-09-08)
- https://github.com/relux-works/apiary-docs (private repository available through local GitHub-authenticated access; public web open failed)
- https://github.com/relux-works/curator
- https://github.com/relux-works/curator-spec
- https://github.com/relux-works/skill-project-management

Read and cite actual source contents before relying on these leads. Repository source research takes priority over search snippets. No exhaustive-coverage claim is justified by a finite selection.

## Further design review probes

These are questions to resolve with evidence, not predetermined implementation choices.

- Count the complete trusted computing base honestly. A tiny model-loop package does not make a large all-powerful broker disappear. A common binary can still require separate processes and OS identities.
- Distinguish Curator package integrity, build-artifact integrity, author identity, audit status, permissions and runtime enforcement. None substitutes for another. Host/provider extensions which can see credentials have a different trust contract from confined model-facing tools.
- Consider explicit selection when multiple installed skills implement one interface. Ambiguity at the selected binding must fail; merely co-installing alternatives should not necessarily be forbidden.
- Separate local authoritative argument/effect validation from a provider-specific model-facing schema projection. Explain incompatible union schemas, model tool-name limits, length caps, unknown fields and truncated streams. No hidden hosted tool may create effects outside the compiled worker profile.
- Define how protected protocol commands map onto project-management. Reusing the CLI or UI must not produce a second authoritative mutable task board. Specify whether a backend adapter translates domain commands and exposes a materialized journal projection.
- Explain whether the single worker tool is sandbox command execution, typed operations, or a negotiated gateway, and demonstrate a realistic coding task end-to-end. Avoid replacing shell with an enormous speculative operation catalog before measuring actual task quality.
- Bound credentials and fallback routes by account, endpoint, tenant, data classes and budget. A fallback model/provider is a new information sink unless already admitted. Automatic key refresh within one admitted identity differs from switching identities or providers.
- A local call WAL needs durable ownership before dispatch, deterministic duplicate handling and explicit uncertainty after crash. Do not retry an uncertain mutating action on another executor merely because a queue timed out.
- Separate protocol domain JSON signatures from XMPP XML framing. Address canonicalization, domain separation, size/depth bounds, attachment digests, certificate rotation/revocation, replay scope and downgrade refusal without inventing a new cryptographic primitive.
- An execution receipt establishes provenance, not truthfulness or correctness. Reviewer independence and Sybil resistance need stated assumptions; distinct keys do not prove distinct owners or model families.
- Platform assurance must describe actual isolation per capability. A working tree is not a sandbox. Physical devices, signing services and proprietary toolchains may require named runner operations and partial assurance instead of pretending every resource fits into a Linux microVM.
- Derive the minimal MVP and later distributed trust profiles without putting consensus, billing, task planning or every provider SDK into the agent kernel. Give measured validation goals and falsifiable experiments rather than invented performance results.

- Resolve the existing v0.1 requirement for an absolute local project.workspace_root and Session.Open(workspace root) against a worker with no local project checkout. Propose an explicit local/remote WorkspaceRef or another clean contract; do not create a fake local checkout merely to fit the old schema. The central executor owns physical paths; the worker holds sandbox/state identities and a bounded capability.
- Assign normative ownership across curator-spec (packages/closures/installation), curator-agent-runtime (generic plans/invocations), future apiary-spec (distributed task/authority/execution protocol), and implementation repositories. Distinguish generic tool receipt from Apiary authorization/execution/acceptance evidence, and specify how they link.

- Define remote command/session behavior precisely: per-call cwd/env, persistent shell or named long-running process handles, output polling/stream cursors, cancel races, sandbox restart and session-lost. The paper describes local-like shell with separate processes and persistent state; do not promise arbitrary shell/process-state recovery without a mechanism. A narrow explicit-state baseline is acceptable if justified. Distinguish model call_id, durable operation_id, transport message_id and process handle so polling/retries do not reuse identities incorrectly.
