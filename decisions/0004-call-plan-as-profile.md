# Decision 0004: the call plan is the execution profile

Status: accepted for 0.1.0-draft

## Context

A per-tool grant answers what a tool may ever do. It does not answer what
this invocation will do, which is what a person confirms and what a
receipt should record.

An intermediate object that describes one invocation solves the approval
problem. If that object only feeds the approval dialog and the log, it is
advisory: the extractor and the provider can disagree, and the person
approved a description that does not match the execution.

## Decision

The call plan is the input to the invocation's execution profile, not only
to its presentation.

The grant in the session plan is a ceiling. The call plan is the profile
applied. The receipt records what was observed. A call plan claiming an
effect outside the grant is rejected before execution.

The effect extractor that produces the call plan is part of the normative
interface contract.

## Consequences

The description a person approves and the confinement the platform applies
are derived from the same object, so they cannot diverge. A provider that
attempts an effect it did not declare is denied by the platform.

`precision` becomes operational rather than descriptive. An extractor that
cannot narrow the grant reports `unknown`, and the derived profile is then
the full ceiling. A shell is loud because of how the profile is derived,
not by convention.

Every interface must supply an effect extractor. This is authoring burden
and a new surface for defects, and it belongs in the conformance vectors.

Extraction precision varies by operation. Applying a patch to a named path
is exact. Committing writes somewhere under a git directory and is
bounded. The vocabulary admits all three cases rather than forcing a
binary answer.
