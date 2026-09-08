# Architecture review — revision 2

- verdict: accepted
- task: TASK-260908-2qhe31
- CR: CR-TASK-260908-2qhe31-2, revision 2
- candidate tree: 357e65cb11fd24047e034077f53b89d831e4974c
- base: ef98d6d4a79bc2ed09a3e82fb73a4019f0b81807
- prior reviewed tree: 679a9e2f1a4d03233f175243fbb30f14543c5a03
- reviewer run: RUN-260908-4c245d
- repository_delta: present; 28 authored files, 12 changed from revision 1 and 16 unchanged.
- routing: accept_cr revision 2; accepted means ready for integration, not landed.

## Scope and coverage

Focused independent design review of F1, F2 and host-controlled submission, using the prior verdict and producer rework evidence. The single broad AC is addressed 1/1 with the retained revision-1 evidence plus this review. Focused requirement groups: 3/3 have named driving design probes below. Runtime driving tests: not applicable to this documentation leaf, 0 executed. These are adversarial contract traces, not claims of executable conformance or an exhaustive security audit. Future production-entry tests V11/V19/V20/V21 remain implementation deliverables.

Prior review's P01–P16 results and seven unchanged diagram visual checks are retained, not rerun. The original source survey was not repeated. The source manifest is unchanged and its 16/16 hashes were independently rechecked. Frozen logical paths remain deliberate pending integration references.

## F1 resolved — strong content identity

execution.md defines apiary-content-manifest-1 independently from GitLocator. It commits the complete recursive path/type/mode/blob/symlink closure and full raw commit bytes through SHA-256, including signature and metadata. Both Git formats use the same manifest route. Parent history identity is explicitly bounded; immediate M has its own commitment. Closed entry grammar, sorting, limits, unsupported types, submodule/LFS refusal, filter disabling and platform pathname refusal are specified.

Snapshot builder, independent materializer, runner and gateway own named checks. Evidence records bind C(R) or the full tuple containing C(M/R/I); missing identity cannot fall back to OID. The gateway checks before intent, before CAS and before receipt, and refuses conflicting legacy Git objects. JSON, WorkspaceRef, migration and future negative rows carry the same rule.

## F2 resolved — permission and local publication recovery

execution.md chooses a local authoritative bare repo behind one gateway. A kernel-held process lock without TTL takeover, no detached surviving writer, qualified synchronous ref library/storage, sole writer/no rewind, immutable candidate closure, one pending intent and recovery-before-intake are explicit TCB assumptions. This is not a claim about arbitrary remote Git hosting.

PublicationIntent sync commit is the permission linearization point, serialized with contract/policy/term/stop. Git CAS and receipt commit are distinct durable steps. A stop before permission rejects the request; a later stop does not retroactively revoke an admitted effect. The historical receipt cannot integrate a new contract revision. Five-second dispatch admission is explicitly not an effect-completion bound; publication_drained is separate from halt_committed.

Recovery distinguishes no intent, permitted without dispatch, dispatching with uncertain CAS, applied without receipt, and durable receipt with lost reply. M/C(M) versus I/C(I) establishes the result only under the sole-writer/pending/no-rewind assumptions; other ref, read failure or broken fencing preserves unknown and the barrier. Remote mirroring remains a separate uncertain effect. No unexplained cross-store transaction remains.

## Independent counter-scenario traces

All 12/12 following focused probes have sufficient explicit architectural answers. This finite denominator measures these scenarios only.

| Probe | Adversarial shape | Contract result |
|---|---|---|
| R2-01 GIT-IDENTITY | Keep locator/signature checks; substitute blob, path, mode, symlink or commit metadata separately | Recursive SHA-256 commitment and repeated verifier reject; not hash-of-locator |
| R2-02 missing identity | Remove C(I), offer unsupported format or incomplete closure | Typed content refusals, no locator fallback |
| R2-03 unclosed input | Supply submodule, LFS expansion or checkout filter | Baseline refuses closure/expansion; ordinary pointer-like text remains inert bytes |
| R2-04 stage substitution | Review A, materialize/test/publish B | Strong-store materializer, immutable input and gateway pre/post checks bind the same C(I) |
| R2-05 PUB-STALE | Keep main M but advance contract/policy/term/stop before request permission | Sequencer refuses stale admission independently of Git CAS |
| R2-06 delayed effect | Stop after permission or suspend gateway after dispatch marker | Historical in-flight permission only; no instant halt or wall-clock completion claim |
| R2-07 pre-dispatch crash | Crash before intent or after permitted before marker | Successful absence read or terminal not_applied/expired, then fresh admission; no inherited permit |
| R2-08 PUB-CRASH | Crash after marker or applied CAS before receipt | Exclusive recovery reads M/C(M) or I/C(I); no replay of CAS by marker alone |
| R2-09 reply loss | Receipt persisted, response lost, caller retries | Stable request/publication identity returns same record |
| R2-10 broken evidence | Unknown read, third ref, lost fence, hidden rewind or remote mirror timeout | Unknown/barrier; hidden TCB violation not promised detectable; mirror outcome separately bounded |
| R2-11 false completion | Model says done with live/unknown effect; late exec from another session | Host seal drains/refuses, closes mutation admission; text never accepts task |
| R2-12 forged submission | Foreign/stale receipt or changed duplicate; try raw signing | Host coordinator checks bindings; signer constructs typed envelope from trusted state; stable retry and authority validation |

The full host trace is model proposal → host WAL/SealRequest → executor barrier/R/C(R)/SnapshotReceipt → typed node signer → durable host outbox → authority SubmitCandidate. These are host ports, not hidden core tools. central remains exec/poll/cancel in kernel, execution and affected diagrams.

## Artifact evidence and limits

Independent validation.json records: 28/28 worktree bytes equal the exact candidate tree; 16/16 source hashes; 58 own relative links; 36 pending research mappings; 6/6 JSON fragments parsed; 9/9 SVG XML parsed. Exact base-to-candidate git diff --check exited 0. No protected source/runtime files changed.

Both changed candidate SVGs were independently converted using installed rsvg-convert 2.62.3 and visually inspected. Labels are readable; no clipping or overlap obstructs meaning. process-trust shows main write only at the gateway; task-integration separates permission/CAS/receipt and names recovery assumptions. PlantUML source rendering success is accepted from producer evidence; sources were not rerendered during review. The seven unchanged views retain prior independent visual evidence.

Nonblocking editorial observation: migration-conformance.md has a blank line before V19–V21, so some Markdown renderers may show those rows outside the preceding table. The prose remains readable and the named conformance content is complete; final navigation/polish can remove that blank line. This does not reopen F1/F2.

All applicable checklist items were read as complete. Planning/decomposition items are unchanged/not newly exercised. “Implementation matches AC” means design artifact conformance; “Tests green” means artifact checks only. There is no runtime, crypto implementation, provider probe or benchmark claim.

## Logbook

2026-09-08: Initial compact query used unsupported resources field; recovered through outcomeResources, never treating read failure as absence. resource list is not a supported command; resource get successfully retrieved the exact producer rework outcome. Missing local reviewer validate.py was a failed read, so a fresh bounded independent validator was used. Relevant skills read; project-local skill directories were absent. Git, Python and rsvg-convert readiness succeeded. Tool versions/results are captured in evidence. Run is not goal-bound; no directives recorded. No deliverable edits, policy changes, installations, commits, publication or child agents. This outcome must be attached before accept_cr; lifecycle integration belongs to the bound producer.
