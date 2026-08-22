# Decision 0001: a separate runtime rather than a host profile

Status: accepted for 0.1.0-draft

## Context

Existing agent harnesses extend by loading third-party code into the
process that runs the model loop. Registration is a same-process contract,
so every installed extension joins the trusted computing base. One
published harness states this directly and is honest that its worker
isolation provides containment rather than a security boundary.

Two options were considered for this protocol. The first was a restricted
profile of such a host, with the security boundary in an external
component. The second was a separate runtime.

The restricted profile is cheaper. It inherits streaming, cancellation,
persistence, compaction, provider adapters, and a user interface. Its cost
is structural: a host whose central property is that any layer of its
running configuration can be replaced from above cannot also guarantee
that a security-critical seam stays bound. Prompt integrity, result
integrity, and the trusted path for approvals all require the component
that assembles the model request and renders consent to be trusted, and in
that design it is not.

## Decision

The runtime is specified as its own environment.

The environment compiler, the broker, and the core are separate
responsibilities with distinct trust levels. The core, which processes
model output, is the least trusted local component. The broker owns the
human relationship and the execution boundary.

An existing harness remains a design reference and a source of adopted
mechanisms. It is not a dependency.

## Consequences

Prompt integrity and result integrity are in scope, which is what the
original context-management goal requires.

The trusted path for approvals is achievable, because no component that
handles model output can answer an approval.

The trusted computing base is chosen rather than inherited. It does not
include a package ecosystem whose supply chain the protocol otherwise
spends effort defending against.

Model provider adapters, streaming, persistence, and the client become
implementation work owned here. Adapter surface churns with provider APIs
and is the least differentiated part of the system. The first
implementation supports one provider behind a narrow interface.
