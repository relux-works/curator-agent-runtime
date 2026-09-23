# Track: Apiary

Status: **DRAFT**, 2026-09-23. Roadmap document: `docs/drafts/apiary/minimal-roadmap.md` (draft, stages 0–6, two independent reviews folded in). Design home: `curator-agent-runtime` (Apiary design 2026-09-08). Roadmap: after milestones M4 and M7.

## Why

One orchestrator should run a pool of local and remote agent loops, each on its owner's credentials, working in a dedicated project workspace, with results going through the existing review and integration path.

## How it connects to the rest

- Local spawn becomes the first AgentHost backend; it already builds launches through the module (M2, M3) with runtime bindings (M4).
- AgentOffers publish runtime bindings, allowed network profiles and availability (M4, M5, M7).
- Playbook routes become the coordinator's program (PB3); roles map to assignment roles.
- Agent selection gives each machine private admission and preferences; the project layer stays portable across contributors (M4).

## Milestones

| Stage | Delivers | Needs |
| --- | --- | --- |
| 0 | AgentHost/SessionDriver adapter over today's `ProviderHost`/`RunOwner` | M3, M4 |
| name | product name Apiary on the public surface; wire names unchanged | M3 |
| 1 | one remote executor: key admission, offer, assignment, one bridge, workspace on the project host | stage 0, M7 |
| 2 | reliable trusted pool: durable mailbox, headless wake, reconnect, cancellation, leases; playbook routes executed by the coordinator | stage 1, PB3 |
| 3–6 | restricted execution profiles, several orchestrators, external participants and own harness, distributed autonomy | per the Apiary roadmap |

## Repository

`curator-agent-runtime`: the Apiary roadmap, this track document and the authority-wire amendment (`docs/drafts/apiary/authority-wire-amendment.md`) live under `docs/drafts/apiary/` as drafts. The accepted design snapshot (`.spec/apiary-runtime-design.md`, `docs/apiary/`) and the interactive guide built from it stay unchanged until a reviewed adoption moves material into them and rebuilds the guide.
