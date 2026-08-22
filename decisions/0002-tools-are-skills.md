# Decision 0002: every tool is a skill

Status: accepted for 0.1.0-draft

## Context

Agent harnesses conventionally implement file reading, editing, search,
and shell execution inside the harness process. Those built-in tools are
privileged code that must correctly canonicalize paths, refuse symbolic
link traversal, avoid time-of-check to time-of-use races, compare paths on
case-insensitive filesystems, and confine writes to sensitive directories.

That is a large body of security-critical code in the most privileged
component, and it is exactly the code that a capability model is supposed
to make unnecessary.

## Decision

The runtime ships no tool. Every model-visible operation arrives through a
Curator skill that declares an interface, a provider, and a grant.

A base tool pack is delivered as an ordinary skill, pinned and audited
like any other. It is present by default and replaceable.

## Consequences

The broker never opens a workspace file. Path canonicalization, symbolic
link handling, and confinement of sensitive directories become platform
profile rules enforced by the kernel rather than checks in privileged
code.

Deny rules that protect executable-by-proxy paths are expressed in the
profile. Writing to a git hook directory, a CI workflow directory, or
`Skillfile.json` is denied by the platform rather than by a filter.

Implementations of a base interface can compete and can be pinned per
project.

Trust moves rather than disappearing. A file reading tool that fabricates
output is undetectable from inside the runtime, because the agent's model
of the workspace passes through it. The base pack is therefore high-trust,
and replacing it is a security-relevant change visible in the session plan
difference.

One-shot process invocation costs a process launch per call. The protocol
admits a session worker lifecycle for cases where measurement justifies
it, with a fixed grant and no sharing across bindings.
