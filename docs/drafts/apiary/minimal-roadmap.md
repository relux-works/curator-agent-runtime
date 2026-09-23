# Apiary: minimal vision and roadmap

Status: **DRAFT** (proposed architecture and staged plan, pre-implementation). Rewritten 2026-09-22 as a technical document from the proposal "Apiary minimal vision and roadmap" and its enriched copy (the operator's Russian working notes (kept outside repositories)), with the launch-profiles (*LP*, D1–D16), network-profiles (*NP*, N1–N14) and model-routing (*MR*, R1–R13) specifications folded into the text. The substance and section order of the proposal are preserved. Interface, field and command names are proposed unless a file path marks them as existing. Product naming is decided separately (the operator's Russian working notes (kept outside repositories)); wire names (`task-board`, `.task-board/`, `TASK-…`, `RUN-…`) do not change.

> **Notes 2026-09-23.** Design home: `curator-agent-runtime` (the accepted design `apiary-design-2026-09-08` in `.spec/apiary-runtime-design.md` and `docs/apiary/`; this draft, its track document and the authority-wire amendment in `docs/drafts/apiary/`). Track document: `docs/drafts/apiary/track.md`. Stage 0 needs roadmap milestones M3 and M4, stage 1 needs M7, stage 2 executes playbook routes (`skill-project-management/.specs/drafts/playbooks.md`) as the coordinator's program. AgentOffer admission and preferences follow the agent-selection layers (`skill-project-management/.specs/drafts/agent-selection.md`).

---

## 0. Thesis and scope

The build direction is not "a new Apiary platform first, then task-board migrates into it" but a gradual conversion of the existing orchestration infrastructure into a distributed system. Apiary is the result of that evolution, not a precondition of a useful release.

The nearest standalone product:

> One orchestrator manages a shared pool of local and remote agent loops. Each loop uses its owner's credentials, receives a task and works with tools in a dedicated project workspace. The result goes through the existing review and integration path.

This does not require an own harness, public admission, a replicated authority journal or a rotating quorum. It requires small, correct boundaries that later admit them.

Platform state on 2026-09-22 (LP §1, D5): agents-infra is a residual (Pi runtime, Codex/Claude config state, attachments, the compose/prepare contracts kept only for task-board); contexts and managed homes belong to Curator; interactive launches belong to `curator-run`. Stage 0 of this plan depends on LP Phase 0: the AgentHost composes launches from the Curator fragment and the module plan, not from `agents-infra compose`, so task-board leaves agents-infra first.

---

## 1. Existing building blocks

Verified in the checkout on 2026-09-22:

- `skill-project-management/tools/board-cli/internal/sessionmanager/host.go` defines `ProviderHost`, the capability `ProviderSessionNotifier` and `ProviderOwnerRunner.RunOwner`: boundaries for environment lifecycle, message delivery and assignment execution already exist, not only a binary started through `exec`.
- `session_notice.go` and `manager_notice.go` implement an inbox, notice accumulation, merging of several notices and delivery into a session. The pump delivers only to a running host with an attached client. For an autonomous pool this is the change point: a missing open terminal must not mean the agent no longer receives work.
- `builder_tool_isolation.go` carries a Claude profile that disables built-in tools, closes third-party MCP configurations and keeps one configured MCP gateway. It is a specialized context builder, not a ready remote developer, but the composition mechanics are present.
- The board direction `EPIC-260907-jj9f23` (project-agent-coordination-rooms) and its research propose a durable inbox/outbox on top of the existing infrastructure. It is a proposal, not an implemented capability, and is continued rather than duplicated under another name.
- `agents-management` owns a shared plugin graph; each agentic system owns its launch grammar, environment, stdin and harness specifics. `curator-run` composes interactive launches; task-board `internal/spawn` composes tracked children from the Curator fragment (LP-D5); tb-sessiond composes board primary sessions (LP-D6). These separations are kept; no module becomes another orchestrator.

The first work is therefore not a new core but making the existing boundaries fit for remote placement.

---

## 2. Core model

Four independent questions:

| Question | Answer |
| --- | --- |
| Who runs the agent loop? | A concrete harness on a concrete machine with an available model, credentials and budget |
| What serves inference? | A runtime binding (harness × provider or engine, LP-D1), separate from the Curator profile (context, home, account, LP-D4) and from the workspace |
| Where do its tools run? | The project workspace: worktree, shell sessions, processes, toolchain, allowed services |
| Who assigns work and accepts the result? | The existing project orchestration workflow: tasks, roles, review, integration |

Engines are owned by the fifth plane, the umbrella provider `curator-engine` (LP-D7); the AgentHost calls `curator engine ensure` before a launch and the EnvironmentHost owns no engines. The questions are never coupled by the assumption "if the agent runs on machine X, the shell runs on X".

Unit of execution:

```text
Run
 ├─ TaskRef                  which work
 ├─ AgentOffer               with which agent resource
 ├─ EnvironmentBinding       in which workspace
 └─ ExecutionPolicy          under which limits
```

`Run` is not a process, not a model conversation and not a sandbox. It is the binding record of one attempt.

| Agent loop | Tools | Scenario |
| --- | --- | --- |
| Local | Local | Today's spawn |
| Local | Local restricted environment | Own credentials and a separate network profile |
| Remote | On the project host | An external participant brings inference capacity |
| On one machine | On another team machine | A shared expensive environment with Xcode, GPU or devices |

Locality is a placement property; trust is a policy property. A local agent may execute untrusted code; a remote agent may be owned by the operator and fully trusted in the first release. The referenced paper's separation of inference from execution is kept; its claim that an environment never runs agent loops is not adopted as an architectural constraint, since one physical host may play both roles.

### 2.1 The pool holds offers, not only running conversations

- `AgentOffer`: a resource offer ("this machine can run Claude with this binding; two parallel loops available").
- `AgentSession`: an existing conversation with history, state and current assignment.

The most predictable start is one new session per assignment through the existing exec path of task-board `internal/spawn`, not through `curator-run` (§4.3). Continuation of the same task, warm sessions and context reuse come later. Idle models are not kept polling for work.

Reuse of an `AgentSession` for a new assignment is bounded by network binding equality (NP-N3, N7): a session with a different binding is re-routed per session where the adapter supports it, otherwise the assignment answers `network_scope_unsupported`; it never continues silently through the old egress. Warm sessions are therefore indexed by network profile as well.

---

## 3. Component responsibilities

Existing products are kept; two operational roles and two libraries are added.

| Component | Responsibility |
| --- | --- |
| Project orchestration / task-board | Decomposition, tasks, roles, dependencies, assignment, review, integration |
| agents-management | Runtime/model/engine identities, compatibility, admission, launch plans; the machine catalog `runtimes.toml` (LP-D2) |
| Curator + launcher | Profile preparation, context and tool delivery, composition of interactive launches |
| curator-engine | Engine profiles, broker, `ensure/release/stop/status`, host arbitration (LP-D7) |
| AgentHost | Represents a machine in the pool, starts and resumes local sessions, delivers messages, reports state |
| EnvironmentHost | Prepares workspaces, executes tools, limits resources, seals results |
| curator-network | Network profiles: resolve → validate → probe → patch; no processes, no daemon; applied by every process owner (NP-N2) |
| curator-model-router (Routing) | Evaluates and chooses among already admitted options; grants no rights; a library with adapters in task-board and `curator-run`, later in the coordinator (MR-R1) |

`AgentHost` and `EnvironmentHost` are roles and modules first, not necessarily new repositories or large daemons. The first `AgentHost` is an adapter over task-board `internal/spawn` and `sessionmanager`, which already consume the Curator fragment (LP-D5), not over `curator-run`; when it becomes the fourth composer, composition is extracted from the launcher into `pkg/compose`. The AgentHost is not a fourth process owner: it wraps the exec path of task-board and tb-sessiond, so the NP-N2 owner list does not grow. If it ever composes a launch itself, it is added to NP-N2 and to the effective-configuration proof of MR-R9. The first `EnvironmentHost` is built over the existing worktree and lifecycle modules plus a small execution gateway.

### 3.1 Orchestrator and coordinator are different things

The orchestrator is an agent: it decides how to decompose a goal, whom to assign a task to and what to do with the result. The coordinator is ordinary code: it stores registrations, checks rights, reserves resources, delivers assignments, tracks states and retries. The orchestrator may end its turn or lose its connection; the coordinator keeps accepting heartbeats, storing results and serving current assignments.

First deployment:

```text
PROJECT HOST
┌──────────────────────────────────────────────────┐
│ task-board / orchestration                       │
│   ├─ tasks and workflow                          │
│   ├─ coordinator: pool, assignments, mailbox     │
│   └─ review / integration                        │
│                                                  │
│ EnvironmentHost                                  │
│   ├─ workspace A                                 │
│   ├─ workspace B                                 │
│   └─ workspace C                                 │
└───────────────▲──────────────────▲───────────────┘
                │ control          │ tools
                │                  │
          AgentHost ────── harness + bridge
          on any admitted machine
                │
          model provider
          owner's credentials
```

The existing AX later attaches as the durability and client-session transfer backend. Completing AX does not block the first distributed launch: its session/provider/terminal/mesh behaviour is not yet declared implemented. Board primary sessions: the composer in tb-sessiond (fragment + `BuildLaunch(ManagedSession)` + policy) is built now and later becomes the body of the ax task-board bridge (`task-board session launch …`); ax never reads tb-sessiond private state (ax spec §9.1). That is what "AX as a durability backend" means: durability, not composition.

---

## 4. First remote spawn: the full path

The path is a small reproducible workflow, not "the orchestrator obtained SSH and now does anything".

### 4.1 Machine admission

The owner starts the `AgentHost` and admits it to the project. For the first trusted variant an explicit admission of the machine key by the project operator suffices. The `AgentHost` opens the outbound connection to the coordinator; the orchestrator never needs an inbound connection to every laptop.

The first transport adapter is SSH with a typed protocol over standard streams, server-key verification and a fixed RPC entry point, so no transport cryptography is built. With OpenSSH, forwarding is disabled separately: a single `ForceCommand` does not close the other capabilities of a connection. This is a first-slice choice, not a commitment to SSH; domain objects do not know whether they arrived over SSH, HTTPS or a future IRC adapter.

### 4.2 Offer

```text
AgentOffer
    node_id
    offer_id
    supported_runtime_bindings
    allowed_network_profiles
    supported_tool_bridge_profiles
    max_concurrent_sessions
    quota_domain
    billing
    availability
    expires_at
```

Field sources: `supported_runtime_bindings` are the runtime bindings with `bound_on_this_machine` from `runtimes.toml` (stable ids, no private endpoints; the word "runtime profile" is retired by LP-D12 and NP-N1); engine profiles from `engines.toml` appear as capacity; `allowed_network_profiles` is the machine's allowed set (NP-N4), ids only; `quota_domain` is the providerlimits identity `(runtime, managed home)`; `billing` is the catalog class; `availability` is the same preflight block as local spawn (auth, quota, reactive limits, engine status). Engine status is two facts, `ready` and `ensurable` (LP-D9): a host whose engine is stopped but can be started stays a candidate with a start cost, otherwise it would never receive an assignment and never call `ensure`.

The offer never contains secrets, provider-home contents or arbitrary local paths; it publishes public provenance only. `quota_domain` exists so that two processes on one account do not look like two independent quota sources; an unknown remaining quota is recorded as unknown, never as unlimited; a different network route is never a new quota domain (NP-N1). Heartbeats are sent by the `AgentHost`, not by the model, and cost no tokens.

### 4.3 Assignment

The orchestrator requests a spawn through the usual task-board surface. After the ordinary checks the coordinator selects an offer and reserves the resource; then the environment is prepared and the assignment created:

```text
Assignment
    run_id / attempt_id
    task_ref / task_revision
    selected_offer
    selected_execution
        runtime_binding
        model
        effort
        context_profile {name, lock_sha256}
        network_profile_ref
        engine_profile_ref?
    routing_decision_ref        content-addressed id, or id + digest, when routing was used
    environment_binding
    role
    policy_ref
    expiry
```

The remote machine receives a semantic assignment, not an arbitrary install-and-run shell script. The local `AgentHost` checks that the requested binding and network profile are allowed by the machine owner and launches through the headless exec path grown from task-board `internal/spawn`: Curator fragment, module plan in exec mode, network binding, `engine ensure`. `curator-run` is interactive only and gets no headless mode (LP §6). Credentials and the network binding are resolved on that machine immediately before process creation: the `unset` half of the network patch runs against the host's own inherited environment and the literals carried by the transport are the `set` half only (NP-N9). An unknown, denied or unreachable profile refuses the assignment; there is no hidden fallback to a direct connection (NP-N10). The project chooses among published capabilities and never gains administrative access to the donor host.

The routing decision itself never travels over the network: the coordinator validates it in two phases (MR-R9) and composes the assignment; the signed envelope (§6) binds `routing_decision_ref` to the concrete `selected_execution`, not merely to the fact that some decision was mentioned, which satisfies the cross-machine delivery requirement of MR-R8. The AgentHost verifies that it can execute the signed request exactly, substituting no defaults of its own; the actual process owner applies the configuration and records provenance; acceptance compares that provenance with `selected_execution`. The network profile digest stays operational data of the executing machine (MR §5): it is recorded in the applied binding and checked for drift at resume (NP-N7), never carried across machines as a pin.

### 4.4 Workspace access

The `EnvironmentHost` binds access to:

```text
authenticated principal
+ concrete run/attempt
+ concrete environment
+ allowed operations
+ assignment generation
+ expiry
```

The first version is a server-side access record and a signed grant. A per-task SSH certificate is not a precondition; it remains a later delivery form of the same authority. Every call is checked against this binding; a correct key without an active assignment grants nothing.

### 4.5 Acceptance and start

```text
offered → reserved → assigned → accepted → running
                                         ↓
                            submitted / blocked / failed
```

These are assignment states, not board task statuses. `accepted` means the `AgentHost` accepted the assignment, `running` that the launch is confirmed, `submitted` that a result arrived. None of them means the task passed review or was integrated.

Redelivery of the same assignment never creates a second process. A response lost after launch is handled by a state query for the same `run_id`, never by a new spawn. Reattaching or resuming the same `run_id` follows the NP-N7 transition table: an equal binding attaches or resumes; the same profile name with different content is refused as `network_profile_drift`, never re-routed silently and never worked around by per-session routing. Changing the network profile of a live session is not in the MVP and arrives with gateway generations (NP-N14).

---

## 5. MCP and adapters: two directions

Two independent integrations are needed: from the model outward (a tool calls the project API) and from the infrastructure into the model (an assignment or message must reach the agent loop).

MCP fits the outward surface: `register`, `report_status`, `workspace.exec`, `workspace.read`, `submit_result`. The protocol also has notifications and sampling, but their existence does not guarantee that a given vendor harness runs the needed turn in an existing session; that behaviour is implemented and verified in the host adapter.

```text
                    AgentHost
                    /       \
         SessionDriver       ToolBridge
         into the loop       out of the loop
```

### 5.1 Registration through MCP is allowed but not the only path

An open agent session may get a `pool.register` tool that registers that session or declares readiness for work. Machine registration, heartbeat, lease renewal and reconnect work outside the LLM loop, otherwise a stuck model disappears from monitoring at the same time. An MCP tool never accepts `role = orchestrator` as authorization; the role is determined by the coordinator from the authenticated principal.

### 5.2 Delivering messages into existing sessions

The current wrapper generalizes into a small `SessionDriver` with a capability set:

```text
start
resume
enqueue_input
steer_active_turn
interrupt
observe
```

Not every driver supports everything. `enqueue_input` and `steer_active_turn` have different semantics and are never substituted for each other silently. Codex app-server has separate `turn/start` and `turn/steer`; Pi RPC has a separate follow-up queue; both are suitable primitives. The current Claude PTY path is kept at first, distinguishing honestly:

```text
message stored
≠ written to stdin/PTY
≠ accepted by the harness
≠ processed by the agent
```

The existing deletion of a notice after a successful write is not renamed into guaranteed processing.

### 5.3 Transferring tools

The first working slice targets one harness, not four environments in one mandatory milestone. For Claude the builder profile is the starting point: the official CLI removes built-in tools with `--tools ""` and restricts MCP configuration with `--strict-mcp-config`; the result is a separate remote toolset, not necessarily a transparent substitution under the old tool name. Pi and OpenCode have direct mechanisms for replacing built-in tools with same-named implementations; Pi additionally documents remote operations and requires the exact result shape. Codex dynamic tools give an external call handler, but adding dynamic tools does not prove that all built-ins are disabled; that is verified separately in the chosen profile.

Adapter rule: when the remote bridge is unavailable, the adapter does not execute the command locally.

The network profile applies to every supported network client of the harness, including HTTP MCP (NP-N11). The tool bridge and the control channel are therefore never attached to the harness as an HTTP endpoint the profile does not know, or the cooperative proxy carries the bridge into the egress. Two admissible forms: the bridge as a local stdio or Unix-socket process next to the harness that holds its own transport to the EnvironmentHost (preferred, consistent with §7.3), or the bridge endpoint in the profile's `bypass_hosts` like the loopback engines of NP-N12.

A stdio bridge separates only the first hop: a helper started by the harness inherits the proxy patch like any child (NP-N11), so the bridge's outgoing transport to the EnvironmentHost is configured independently of the harness's network binding, by explicit client settings, a separately prepared bridge environment or reuse of the AgentHost's already configured transport, and inherited proxy variables can never change it implicitly. The acceptance test checks both sides at once: harness requests use the assigned proxy while bridge calls and run control use their own allowed transport, and a failing inference proxy never removes the coordinator's ability to cancel through that independent channel.

---

## 6. Communications: rooms are separated from authority

An IRC-like model is useful as the organization of the space for people and agents:

```text
project
 ├─ orchestration
 ├─ task/RUN-123
 ├─ task/RUN-456
 └─ integration
```

Addressing, small messages, subscriptions, presence and human observation are the useful properties. Channel content is not simultaneously the execution queue, the authority registry and the task state.

### 6.1 Message contract

Independent of transport:

```text
Message
    message_id
    project_id
    sender_principal
    recipient
    run_or_scope
    kind
    payload / payload_ref
    created_at / expires_at
    sender_generation
    signature
```

The whole significant envelope is signed, including recipient, project, kind and payload. Duplicates, expiry and the sender's current authority are checked. A nickname, a channel name and a `role` field are not proof of the right to control an agent.

### 6.2 Three message classes

- Control commands: assign, cancel, pause, request continuation.
- Work instructions: clarification, additional context, a request from another orchestrator.
- Service events: heartbeat, started, blocked, usage, result-ready.

The first two classes may affect the agent loop under the allowed policy; the third is handled by ordinary code first.

| Sender → recipient | Allowed meaning |
| --- | --- |
| Orchestrator → assigned worker | Task, clarification, priority change, cancellation within authority |
| Worker → coordinator | Only events of its own assignment and result submission |
| Worker → orchestrator | Optionally a structured `blocked` / `clarification_request`; no control instructions |
| Orchestrator → other orchestrator | A request or proposal within the allowed scope; never automatic command over another scope |

On the orchestrator side a worker message becomes an event such as "a blocker is registered for RUN-123, details at the link". The details stay untrusted data: the signature confirms the author, it does not make the content a safe instruction. Cancellation never depends on the LLM agreeing to stop: the supervisor performs it and the execution boundary verifies it.

### 6.3 First choice

A durable mailbox in the coordination module plus a delivery adapter in the `SessionDriver`; the local and the network entry call one application service. This matches the direction of the existing research, and the practical reason is that no additional mandatory server appears before the first remote spawn. IRC is connected as the next adapter, first for observation and operator messages, then if needed for signed envelopes. IRCv3 provides message tags, message ids and history, but client-only tags are explicitly untrusted and extension support is negotiated separately, so signatures, application acknowledgements and roles are still verified by these components. IRC may be a transport or an interface of the system; it does not define its security or task-acceptance model.

---

## 7. Environment: from worktree to a real sandbox without an API change

One permanent interface, `ExecutionEnvironment`, whose implementations are strengthened over time:

```text
prepare → bind → execute → inspect → seal → release
```

From the first stage the object knows the base revision, the working directory, the owner, the assignment and how the result is obtained. Later the same object gains stronger restrictions.

### 7.1 First implementation: trusted workspace

The existing worktree manager creates a separate tree; an execution gateway executes operations in it, keeps process handles and limits time and output. This is useful for a trusted pool, and the profile is named `trusted-workspace`, never promising isolation from malicious code. A single project environment does not mean one shared mutable worktree for all agents: management, the artifact store, toolchains and the integration process are shared; each task's changes have their own space.

### 7.2 Next implementation: restricted environment

Private home/tmp/cache, read and write limits, no control sockets or services, child-process control, a network gateway and resource limits; then platform backends with a stronger boundary, up to a VM where justified. The profile states required properties, the backend reports provided properties; a mismatch is never hidden by choosing a weaker mode. A copy of the tree and an OS-level restriction solve different problems; that principle is kept rather than a fixed technology list.

### 7.3 A local agent may use the same bridge

```text
local agent  → Unix socket → EnvironmentHost
remote agent → transport   → EnvironmentHost
```

The old direct backend stays for trusted launches; the mediated path lets one semantics of tools, cancellation and results be verified.

### 7.4 Network is a separate policy

```text
AgentHost → model provider
    owner's credentials and network profile

AgentHost → coordinator / EnvironmentHost
    control and tool channel

Task environment → internet
    project policy, egress gateway, VPN when needed
```

Mapping to the network-profiles specification: the first route is `curator-network` with `assurance = cooperative`, HTTP CONNECT as the common surface and `--network-profile` as the fifth independent launch setting (NP-N1, N6); the second route is the AgentHost's own transport outside the harness profile, like the SSH channel of engines (NP-N12); the third route is the enforced sandbox of a separate epic that reuses the same profile as its egress description (NP-N14) and arrives at stage 3. The original task "two local agents with different proxies" is solved by the first route; isolating `curl`, package managers and build scripts belongs to the third.

`NO_PROXY=localhost` is not applied automatically to every future sandbox: in a strict profile access to local services is also limited, and a loopback engine or bridge is a local service allowed explicitly, never "the internet" (NP-N12). A tool sandbox never receives provider credentials merely because the agent loop is on the same machine. The credential boundary already exists in Curator: a profile's managed home is a separate login (Claude on macOS isolated by construction, Codex and Pi through `isolated`); the AgentHost selects the Curator profile per assignment and thereby the account; in trusted-native mode the harness's access to its provider home is allowed explicitly; in hardened mode the credential-bearing part and the task shell are separated and the shell does not receive that home.

### 7.5 How a result reaches main

The current CR/review/integration infrastructure is reused. The `EnvironmentHost` seals the result: it stops or fences further writes, records the revision and returns a result bound to `run_id`. The existing workflow builds the integration candidate, runs the checks and advances the target branch. A remote worker needs no push key for the main repository and no authority to integrate. The rule kept from the referenced paper: verify the exact state that is accepted, never treat a passing test of an old revision as permission for a later merge; a quorum journal is not needed to apply that rule in a trusted system.

---

## 8. Routing without turning spawn into another agent

Principle kept from the routing discussion: fitness assessment never changes candidate eligibility. The candidate is no longer `(model, effort)`:

```text
ExecutionOption
    ExecutionCandidate
        runtime binding + model + effort
        Curator context profile
        network profile (resolved by the caller)
        engine profile
    AgentOffer
    tool bridge profile
    compatible execution environment
    quota domain
```

A Linux laptop may provide a suitable agent loop for an iOS task when the tools run on the project Mac; checking for Xcode on that worker would be a mistake. A candidate without a binding on the chosen machine is excluded before scoring.

```text
Task + role
    ↓
one CandidateResolver
    ↓
eligible and current offers
    ↓
fitness assessment
    ↓
selection
    ↓
reservation and availability re-check
    ↓
Assignment
```

Dependent settings (network profile, context profile) are resolved by the CandidateResolver before scoring and fixed unless the policy's free-field mask frees them (MR-R7); choosing an offer with another egress is a permitted choice of a whole variant, never a route switch by the router (NP-N13). The four questions and their owners (MR-R2): allowed, by policy and the allowed set; compatible, by the registry and the catalog; fit, by the estimator; available now, by the offer's availability block with the `ready`/`ensurable` engine facts. The coordinator reserves, not the router.

The first implementation uses explicit choice and today's config-order recommendations (MR slice A0, which starts before LP Phase 1; A1 adds the machine half after it). The router never blocks the distributed MVP. Then evidence snapshots, benchmarks, a rule-based assessor and Jev/LLM assessors are connected (MR slices B, C in shadow mode, D opt-in, E measured gain); their answers are stored separately and spawn validates a ready decision instead of re-running the assessment.

Three different constraints are tracked: the number of agent loops an AgentHost can hold, the inference quota shared by offers on one account, local server or GPU, and the project's execution resources (builds, tests, device operations). An expensive build slot is not held while the model reasons: a persistent task workspace and the right to run a heavy command are different resources.

Feedback is bound to the actual attempt: the model really used, the bridge profile, the result, cost, time and failure class. A network failure never lowers a model's assessed ability; network failure, engine refusal (`engine_ensure_failed`) and quota are distinct `failure_class` values.

---

## 9. Own harness and tools through Curator: the next client, not a rewrite

An own core is built without built-in tools, but only after the AgentHost and EnvironmentHost protocols work, not before the first remote participant. It then enters the system as one more `SessionDriver`:

```text
Native harness + adapter ─┐
                         ├─ AgentHost → common execution protocol
Own tool-free harness ───┘
```

Inside the own runtime:

```text
Core          forms ModelRequest and ToolIntent
ModelDriver   talks to the provider
ToolBroker    checks allowed bindings and calls providers
Curator       delivers context, tool exports and pinned implementations
```

The compiler/broker/core idea of the referenced guide is useful, but the binding set is not limited to two tools forever: a public donor profile may carry a minimum, a corporate profile a remote shell, files, search, a browser and narrow device operations. Curator evolves gradually: an ordinary package delivers the bridge, MCP configuration and instructions; then a versioned tool export with names, schemas and implementation references; then the own broker uses the same exports directly. Curator already manages packages, runtimes, commands and adapter delivery, which is the right starting role, but installing a tool package never grants it rights. External tool-provider code is never loaded into the process that holds the broker's keys: a tool-free core does not help when a tool obtained the unlimited authority of a neighbouring privileged module.

---

## 10. Staged plan with a useful result at every stage

The first three stages are sequential; isolation, routing and resilience then develop as separate small directions.

| Stage | Adds | Standalone value and readiness criterion |
| --- | --- | --- |
| 0. Local spawn as the first backend | The AgentHost/SessionDriver adapter without changing the workflow | Current launches work as before; a local runtime binding and an explicit network profile can be chosen; the new interfaces are exercised on the real path |
| 1. One remote executor | Key admission, offer, assignment, one bridge, a workspace on the project host | An agent on a second machine changes code on the first with its own credentials, runs a check and returns the result into the existing review/integration |
| 2. Reliable trusted pool | Durable mailbox, headless wake, reconnect, cancellation, leases, queues, limits | Several machines serve tasks continuously without open terminals; restarts lose no results and create no duplicate launches |
| 3. Restricted execution profiles | Private roots, process and network isolation, resources, protected integration path | Local and remote agents work under the same verifiable restrictions; the hardened profile refuses when capabilities are missing |
| 4. Several orchestrators | Scoped roles, messages between orchestrators, assignment ownership, controlled handover | Orchestrators own different parts of the project, do not duplicate work and do not overwrite another's scope; ownership change is explicit at first |
| 5. External participants and the own client | Tool-free harness, limited signing, stricter admission, budgets, a public protocol | The project accepts untrusted inference capacity without relying on the honesty of its client code |
| 6. Distributed autonomy | Replication of the needed state, automated role transfer, several environments | The system survives defined failure classes without a single always-available orchestrator |

Stage 2 is already a full product: a distributed orchestration system for the team, not a prototype "without the real swarm yet". Routing develops alongside, first explicit and config-order, then shadow assessment, then opt-in selection and measured gain; it is not a dependency of stage 1.

Mapping to the specifications:

| Stage | Depends on |
| --- | --- |
| 0 | LP Phase 0 (task-board on the Curator fragment, composer in tb-sessiond); LP Phases 1–2 (catalog, transports) for the runtime binding; NP slice A (mechanism) and C1 (explicit `--network-profile` on every task-board and tb-sessiond path); MR A0 alongside |
| 1 | The AgentHost inherits NP C1 through the same exec path; NP C2 (catalog and `spawn.network.default` defaults) after LP Phase 1; LP Phase 3 (availability) feeds the offer's `availability`; LP Phase 4 (`curator-engine` `ensure/release`) only when the first remote binding uses a managed engine, a cloud-provider participant does not wait for the engine plane |
| 2 | Reconnect and resume rest on the NP-N9 tracked contract (reference + digest, the host resolves); until it exists, tracked mode with a mandatory network profile refuses; LP Phase 4 (`curator-engine`) brings engine-bound bindings into the pool at the latest here; MR shadow (C) not before this stage |
| 3 | NP-N14 enforced sandbox, `assurance = enforced` |
| later | LP Phase 5 (KV snapshots) = warm sessions with restoration; MR opt-in `select` (D) once the run manifest proves the effective configuration (MR-R9) |

### 10.1 Several orchestrators do not require immediate decentralization

At stage 4 one coordinator and one authoritative project store suffice:

```text
Orchestrator A → authorization module
Orchestrator B → network layer
Orchestrator C → review / integration coordination
```

Communication A → B carries a proposal or a request; authority transfer is a separate coordinator operation. Automatic role inheritance after heartbeat loss is not reducible to starting a second process: the previous generation of assignments is revoked or fenced on the execution side first, otherwise a woken old orchestrator keeps acting. Coordinator replication, model-conversation transfer and task-sandbox migration are three separate tasks; AX is useful for the second and never silently becomes the sole owner of all three.

### 10.2 Deferred deliberately

Project federation, public reputation, social identity proofs, contribution economics, automatic leader election, BFT and several sandbox backends at once are outside the nearest milestone. task-board is not rewritten into a universal event-sourcing platform. In the early stages the board remains the source of task state, the assignment/run store holds operational execution state and the inbox holds delivery; explicit links and idempotent transitions connect them instead of three competing answers to "the task is done". The authority model may change later, but the move to replication and new failure models is separate engineering work, not `quorum = 1` becoming `quorum = 3`.

---

## 11. Unix, SOLID and KISS in practice

No new decision centres and no hidden effects. `agents-management` does not learn the Epic structure. Routing creates no processes. The EnvironmentHost chooses no models. Curator decides no assignments. Transport declares no message authorized. The SessionDriver integrates no branches.

Three contract groups suffice for the first implementation:

```text
Pool / Assignment
    register, advertise, reserve, assign, status

Session / Messaging
    deliver, acknowledge, observe, cancel

Environment / Tools
    prepare, bind, invoke, seal, release
```

They may live in several Go packages inside one process; external CLI, MCP and RPC surfaces are thin adapters over the same application services. Common rules: machine-readable result on stdout, diagnostics on stderr; explicit deadlines and cancellation; no hidden network call in a local query; no automatic fallback from remote to local; an unsupported operation returns `unsupported`. The existing plugin graph is reused where different implementations are really needed; no interface per helper function and no stable SDK for every future extension yet. `agents-management` already has the basis for new kinds without rewriting the registry.

### 11.1 First changes to implement

One vertical chain of small PRs:

1. An adapter over the current `ProviderHost` / `RunOwner` so the old local path becomes the first `AgentHost` backend without behaviour change. It reuses the exec path where NP slice C1 lands, so the network profile is not a separate PR of this chain.
2. A minimal coordinator pool with explicit key admission, offer leases and assignment of a concrete `run_id`.
3. One `EnvironmentBinding` over the current worktree lifecycle and a minimal shell bridge with time and output limits and cancellation.
4. One verified remote harness profile; the generalized Claude MCP profile first, Pi as the next adapter. The bridge is a stdio or Unix-socket process, or its endpoint is in the network profile's bypass list, and its outgoing transport is configured independently of the harness's network binding: inherited proxy variables can never change it implicitly (§5.3).
5. The result closed back into the existing CR/review/integration path, not a separate "remote acceptance branch".
6. Notices generalized into a role-aware mailbox with autonomous delivery without an attached terminal and connection-loss scenarios.
7. `curator engine ensure/release` as the AgentHost's engine primitive, required before the first assignment to a binding that uses a managed engine, so local models enter the pool by the same path (LP-D7); a remote participant with a cloud provider does not wait for it.

Component names (proposed): `apiary` (CLI and board, the task-board format inside), `apiaryd` (coordinator), `apiary-host` (AgentHost), `apiary-env` (EnvironmentHost); wire names are not renamed.

### 11.2 Acceptance scenario

One concrete scenario for the whole chain:

> The orchestrator on machine A sees a local and a remote offer. It assigns a task to the agent on machine B. That agent works with its own credentials, through the network profile allowed by the owner of B, over the bridge in a dedicated worktree on A; the bridge and the control channel do not pass through its egress. The orchestrator can send a clarification and cancel execution, including while the inference proxy of B is down. After completion the result passes the usual review and is integrated by the standard path. The run manifest carries `RuntimeProvenance`, the Curator profile lock and the network profile digest against which the routing decision is checked. Redelivering the assignment creates no second agent; a foreign key or access to a neighbouring run is rejected.

Local spawn becomes the first backend; the remote worker the second; the sandbox strengthens an environment that already works; the own harness becomes one more client; distributed autonomy is added to a system that by then delivers value daily.

---

## Basis

- Proposal "Apiary minimal vision and roadmap" and its enriched copy (the operator's Russian working notes (kept outside repositories); two waves of annotated insertions, 2026-09-22).
- `skill-project-management/.specs/drafts/launch-profiles.md` (D1–D16, Phases 0–5, closed decisions §6), `curator-network/spec/network-profiles.md` (N1–N14, slices A–D), `curator-model-router/spec/model-routing.md` (R1–R13, slices A0–E), and the independent review of 2026-09-22 folded into them.
- The task-board migration-readiness and Apiary naming notes (the operator's Russian working notes (kept outside repositories)).
- Checkout verification 2026-09-22: `skill-project-management/tools/board-cli/internal/sessionmanager/{host.go, session_notice.go, manager_notice.go, builder_tool_isolation.go}`, board epic `EPIC-260907-jj9f23`.
