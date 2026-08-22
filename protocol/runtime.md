# Curator Agent Runtime Protocol 0.1

This document is normative. It defines the objects and rules a conforming
runtime uses to execute an agent session against a pinned Curator
environment. Model prompting strategy, conversation compaction, user
interface, and provider wire formats are defined outside this document.

The key words MUST, MUST NOT, REQUIRED, SHOULD, SHOULD NOT, and MAY are to
be interpreted as described in RFC 2119.

## 1. Scope

This protocol governs the interval between the resolution of a Curator
environment and the close of an agent session. It consumes a resolved
closure as defined by the Curator Protocol core and produces a session
plan, a sequence of call plans, and an execution receipt chain.

This protocol does not define package identity, manifest schemas, closure
resolution, the audit registry, or installation layout. Those are
normative in the Curator Protocol.

## 2. Components and trust domains

A conforming runtime separates three responsibilities. An implementation
MAY place them in one process, but the invariants in section 3 MUST hold
regardless of topology.

The **environment compiler** resolves the closure, verifies content
identity, applies audit policy, and emits a session plan. It executes
before the session and is absent at run time.

The **broker** verifies the session plan, serves context, constructs call
plans, derives execution profiles, invokes providers, records receipts,
holds credentials, and owns the approval path.

The **core** runs the model loop. It holds conversation state, speaks the
model provider protocol, and dispatches tool calls to the broker.

**Providers** are executables or components delivered by skills. A
conforming runtime MUST treat every provider as untrusted.

## 3. Invariants

A conforming runtime MUST satisfy all of the following.

1. The core MUST NOT hold a filesystem capability or a process creation
   capability. Every effect the core causes MUST be an invocation
   submitted to the broker.
2. The core MUST NOT hold a model provider credential. The broker MUST
   mediate model requests and attach authentication.
3. The context a model receives MUST originate from the verified store
   named in the session plan and MUST reach the core across the broker
   interface. A conforming runtime MUST NOT read agent instructions from a
   path that the session's own tools may write.
4. Every tool exposed to the model MUST appear in the session plan. A
   runtime MUST NOT contribute a tool of its own.
5. The grant recorded in a tool binding is a ceiling. The call plan is the
   profile applied to the invocation. The receipt records what was
   observed. A runtime MUST derive the execution profile from the call
   plan and MUST NOT apply the ceiling when the call plan is narrower.
6. A session plan MUST be immutable for the lifetime of its epoch.
7. A delegated session's authority MUST be a subset of its parent's.
   Delegation MUST NOT widen a grant, add a tool, or exceed a lease.
8. Approval rendering and consent capture MUST occur in the broker's trust
   domain. A component that processes model output MUST NOT answer an
   approval request.
9. Content whose provenance is not the runtime policy layer, an audited
   skill, or the project repository MUST be delivered in a data channel
   and MUST NOT be presented as instruction.
10. Enforcement is a reported fact. A backend that confines partially MUST
    report `partial`, and a caller that requires an absolute boundary MUST
    refuse rather than proceed.

## 4. Execution epochs

An epoch is the lifetime of one session plan. A conversation MAY span
several epochs.

Every model request, tool invocation, and result MUST carry `epoch_id` and
`plan_digest`. A runtime MUST reject a result whose epoch is not the
current epoch. A result produced under an earlier epoch MUST NOT be
presented as authorized by a later plan.

Filesystem mutation is not authority mutation. An agent that modifies
`Skillfile.json` where write policy permits it does not change the running
epoch. The modification is input to a subsequent compilation.

## 5. Session plan

The session plan states what an epoch may do. The environment compiler
produces it; the broker verifies it before opening a session.

### 5.1 Identity

`plan_digest` MUST be the SHA-256 of the canonical serialization of every
field except `plan_digest` itself. `epoch_id` MUST be unique within a
conversation.

### 5.2 Project identity

`project.workspace_root` MUST be an absolute canonical path.
`project.worktree_id` MUST identify the specific checkout. A runtime that
searches upward for a project root MUST stop at a worktree boundary. A
worktree nested inside another checkout MUST NOT inherit the parent
checkout's environment.

`project.skillfile_digest` and `project.closure_digest` bind the plan to
the resolved environment.

### 5.3 Context bundle

`context.bundle_digest` identifies the assembled context. `context.tiers`
records the provenance tiers present, in instruction precedence order.
Defined tiers are `runtime`, `skills`, and `repository`. Content of any
other provenance MUST NOT appear in the bundle.

### 5.4 Model sink and retention

The model provider is an external sink. `model_sink` MUST record the
provider identity, the model, the data classes the epoch may send, and the
provider's retention terms.

`retention` selects the local disposition of model-visible content and
MUST be one of `replayable`, `private`, or `ephemeral`. Local retention
governs local storage only and makes no claim about the provider.

### 5.5 Tool bindings

Each entry of `tools` binds one model-facing tool to one provider
implementation. A binding MUST carry `tool_id`, `interface_id`,
`provider_skill`, `provider_digest`, `entrypoint`, `execution_class`,
`lifecycle`, the input and output schema digests, a `grant`, and a
`confirmation` policy.

`lifecycle` MUST be `one-shot` or `session-worker`. `one-shot` is the
default. A `session-worker` binding MUST carry a fixed grant for the
lifetime of the worker, MUST NOT serve tools from more than one binding,
and MUST NOT have its grant widened after start.

Two bindings MUST NOT share a `tool_id`. A compiler that resolves a
collision MUST fail rather than select one.

`grant` uses the capability vocabulary of the Curator Protocol capability
envelope, narrowed per tool. A binding's grant MUST be a subset of the
declaring skill's envelope.

### 5.6 Host assurance

`host_assurance` records what the platform delivers for each capability
class, using `full`, `partial`, or `none`. A session whose bindings
require `full` for a class that the backend reports as `partial` MUST fail
to open.

## 6. Call plan

The call plan states what one invocation proposes to do.

### 6.1 Construction

The broker MUST construct the call plan from the pinned interface
contract, the validated input, and the current epoch. Neither the model
nor the provider contributes to it.

The broker MUST validate the input against the bound input schema before
constructing the call plan, and MUST reject an invocation whose input does
not validate.

### 6.2 Effects and precision

`effects` enumerates the filesystem paths, network destinations,
credential operations, and signing operations this invocation may perform.

`precision` MUST be `exact`, `bounded`, or `unknown`. `exact` means the
extractor names every effect. `bounded` means it names a containing set.
`unknown` means the extractor cannot narrow the binding's grant.

### 6.3 Profile derivation

The broker MUST derive the invocation's execution profile from `effects`.
The binding's grant bounds what `effects` may contain; a call plan
claiming an effect outside the grant MUST be rejected before execution.

Where `precision` is `unknown`, the derived profile equals the grant. This
is the only case in which an invocation runs at its ceiling.

## 7. Invocation protocol

A conforming runtime exposes four operations across the broker interface.
Wire framing is not specified in this draft.

### 7.1 Session.Open

Input is the workspace root. Output is `epoch_id`, the context bundle, the
model-facing tool list, and `plan_digest`.

The broker MUST verify the plan digest, the closure digest, and the host
assurance requirements before returning.

### 7.2 Tool.Invoke

Input is `call_id`, `tool_id`, and the tool input. Output is a status, a
result, and a receipt digest.

### 7.3 Tool.Cancel

Input is `call_id`. The broker MUST terminate the invocation's process
group where the platform permits it, and MUST record the cancellation in
the receipt chain.

### 7.4 Session.Close

Output is the head of the receipt chain.

### 7.5 Call identity

`call_id` MUST be unique within an epoch. The broker MUST implement
at-most-once semantics: a repeated `call_id` with an identical input
digest MUST return the stored result without re-executing, and a repeated
`call_id` with a different input digest MUST be rejected as a protocol
error.

### 7.6 Concurrency

An interface declares a concurrency class. The broker MUST serialize
invocations of mutating tools that target the same workspace. It MAY run
invocations declared parallel-safe concurrently.

### 7.7 Result bounds

A result MUST carry a content type, a structured payload, stream metadata,
a truncation flag, an output digest, and, where output was spilled, a
reference to the retained artifact. A runtime MUST NOT deliver unbounded
output to a model.

## 8. Plan transition

A transition creates a new epoch without ending the conversation.

The runtime MUST stop admitting new mutating invocations, MUST allow
in-flight invocations to complete or cancel them, and MUST NOT admit an
invocation under the new plan until the boundary is reached.

The environment compiler produces the new plan. The broker MUST present an
authority difference in terms of effects rather than capability
vocabulary, and MUST obtain approval as defined in the approval protocol.

The transition MUST be appended to the log with both plan digests and the
recorded reason. Conversation content is preserved across the boundary.

## 9. Delegation

A delegated session derives its plan from its parent's. Derivation MUST
only remove.

The delegated tool set MUST be a subset of the parent's. Each delegated
grant MUST be a subset of the parent's grant for the same tool. A lease
held by a delegated session MUST NOT exceed the parent's remaining lease
budget. The delegated plan MUST record its own digest and its parent's.
Delegation depth MUST be bounded by the parent plan.

## 10. Receipts and the accountable log

A conforming runtime maintains two surfaces.

The **session event log** is append-only and hash-chained. Each entry
records the event type, call identity, epoch and plan digests, tool
identity, result metadata, a content reference, and a retention class.

The **content store** holds payloads under one of `inline`,
`encrypted-local`, `redacted`, or `digest-only`.

Everything a model saw MUST be accountable: the runtime MUST record its
origin and the exact representation sent. Full payload persistence is
governed by the plan's retention mode, not by the accountability rule.

An execution receipt MUST record the plan digest, the call plan digest,
the provider identity, the enforcement report, the input and output
digests, the timestamps, the outcome, and the effects the provider can
demonstrate.

## 11. Reserved surfaces

The following are named here so that a later draft may define them without
widening an object in this draft: wire framing and transport, provider
identity verification, network mediation and egress allowlisting, signing
capabilities, credential delegation, code execution over capability
bindings, and the protected authority root.

A runtime MUST NOT infer behavior for a reserved surface from the objects
defined above.
