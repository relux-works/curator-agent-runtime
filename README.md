# Curator Agent Runtime Specification

**Version:** 0.1.0-draft

**Date:** 2026-08-23

**Status:** Draft

**Authors:** Ivan Oparin

**License:** MIT

The Curator Agent Runtime is an open protocol for executing an AI coding
agent whose entire surface of action is compiled ahead of the session from
a pinned Curator environment. It defines the session plan, the per-call
effect plan, the invocation protocol, the approval model, and the
execution receipt.

The specification is implementation-neutral. A conforming runtime may use
any language, process topology, sandbox backend, model provider, or user
interface, provided it satisfies the invariants in
[`protocol/runtime.md`](protocol/runtime.md).

## Relationship to the Curator Protocol

The [Curator Protocol](https://github.com/relux-works/curator-spec)
defines how skills are identified, resolved, closed over, audited, and
installed. It answers what a project's agent environment contains.

This specification defines how that environment is executed. It consumes
the resolved closure and produces a session plan; it does not redefine
package identity, manifest schemas, closure resolution, or the audit
registry.

Two properties of the Curator Protocol are load-bearing here. Content
identity makes a tool binding reproducible. The capability envelope in
`agent-skill.json` becomes an enforced grant rather than an audit surface.

## Design commitments

Two commitments determine every structural rule in this specification.

Context is managed. The runtime assembles what the model reads from a
verified store and delivers it across an interface boundary. A conforming
runtime does not read instruction files out of a writable workspace.

Tools are skills. The runtime ships no tool of its own. Every model-visible
operation arrives through a Curator skill that declares its interface, its
provider, and its capability grant.

## Specification set

| Part | Role |
|---|---|
| [Runtime protocol](protocol/runtime.md) | Normative session plan, call plan, invocation, epochs, delegation, and receipt rules |
| [Tool interface protocol](protocol/tool-interface.md) | Normative interface identity, portable schema subset, effect extraction, and provider binding |
| [Approval protocol](protocol/approval.md) | Normative trusted path, outcome vocabulary, plan and effect approval, and leases |
| [Architecture](docs/architecture.md) | Informative component map, trust domains, and milestones |
| [Threat model](docs/threat-model.md) | Informative statement of what this protocol claims and does not claim |
| [Decisions](decisions/) | Accepted architecture decision records |
| [Schemas](schemas/v1/) | JSON Schema for the session plan, call plan, receipt, and approval lease |

## Status of this draft

Version 0.1.0 fixes the object model and the invariants. It does not yet
specify wire framing, provider identity verification, network mediation,
signing capabilities, or the protected authority root. Those surfaces are
named in the runtime protocol as reserved and are specified in later
drafts.

No conformance class is defined yet. A conformance suite requires the
interface vectors described in the tool interface protocol.
