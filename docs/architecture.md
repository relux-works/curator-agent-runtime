# Architecture

This document is informative. It describes a reference topology for a
conforming runtime and the order in which the surfaces are expected to be
built. The normative rules are in [`protocol/runtime.md`](../protocol/runtime.md).

## Topology

```text
  human ──── console ──────────────┐
                                   │
  model API ──── agent-core ───────┤
                                   ▼
                            curator-broker
                                   │
                     ┌─────────────┴─────────────┐
                     ▼                           ▼
              tool provider               tool provider
              (confined)                  (confined)
```

`curator-compile` runs before the session and does not appear above. It
resolves the Skillfile closure, verifies content identity, applies audit
policy, and writes a session plan. Its output is reviewable by a person
before an epoch opens, which is why the compiler is trusted at plan time
and absent at run time.

The broker owns the console. That placement is what makes the trusted path
in the approval protocol implementable: the component describing an action
to a person is the component that will execute it.

The core is the least trusted local process. It handles model output, and
model output is the untrusted input to the whole system. Giving it neither
a filesystem capability nor a process creation capability means a
compromise of the core yields the ability to request allowed tools with
worse arguments, and nothing else.

## Language and process boundaries

The compiler stays in the language of the existing Curator manager
implementation. It runs offline, and rewriting it buys nothing.

The core and the broker are separate concerns and may start as one binary
with two internal boundaries, provided the invariants hold. Splitting them
into separate processes with distinct confinement is the natural M1 step.

A native language with a single static binary suits both. The Curator
Protocol already defines a Go build driver for compiled skill commands, so
Go keeps one toolchain across the runtime and the providers it launches. A
memory-safe language for the broker becomes more attractive at M2, when
the broker becomes the authority root.

## Milestones

M0 establishes the hypothesis: a working coding agent whose entire tool
surface derives from a pinned Curator environment, with no third-party
code inside the agent process.

M0 contains the compiler emitting a session plan, the broker with call
plans and one-shot providers under a real platform profile on one
operating system, console approvals, receipts, the append-only log, the
core with one model provider adapter, and a base tool pack shipped as an
ordinary skill. Shell is present, absent from the plan by default, and
fully instrumented.

M1 adds provider identity verification, sandbox adapters for the remaining
platforms, network and credential and signing capabilities, approval
leases, retention policy, session workers where measurement justifies
them, and code execution over capability bindings.

M2 adds the protected authority root: a signed session plan, an
authenticated interface peer, separate user accounts for the core and for
providers, a code-signed trusted computing base owned outside the user
account, hardware-backed approvals, and remote anchoring of the receipt
chain.

## Shell as an instrument

Shell is in M0 because a runtime without it cannot be used for real work,
and a runtime that is not used teaches nothing about which typed
interfaces are missing.

Every shell invocation records why a typed tool was insufficient, the
command digest, the executable families invoked, the profile applied,
network requested and used, paths read and written, exit status, latency,
and whether an existing interface could have served.

Two measurements drive the interface roadmap. Shell dependency rate is the
fraction of completed tasks that required shell. Typed replacement
opportunity is the set of recurring invocation classes that a stable
interface would cover.

Shell is not a design failure. Uninstrumented shell is.

## Adopted design

DeepSeek Harness is the reference implementation this design was measured
against, and several of its published mechanisms are adopted here because
they are correct.

The capability seam vocabulary of definition, provider, and consumer names
this structure better than binding does. The closed and fail-closed
approval outcome vocabulary is adopted directly and extended with leases,
which it does not have. Enforcement reported as full or partial, with a
prohibition on presenting one as the other, is adopted as host assurance.
Call identity, cooperative cancellation, concurrency classes, output spill
files, and a portable schema subset are adopted.

Two of its properties are deliberately not adopted. Plugin registration as
a trusted same-process contract is the property this runtime exists to
avoid. Composability of the running configuration through patch layers
conflicts with an immutable authority environment and is replaced by
explicit epoch transitions.
