# Decision 0005: immutable epochs and attenuating delegation

Status: accepted for 0.1.0-draft

## Context

A harness built for composition treats reconfiguration during a session as
a normal operation. For a runtime whose purpose is bounded authority, a
transcript executed under two different environments is difficult to
reason about and impossible to audit cleanly.

A session plan that never changes is also impractical. Work discovers new
requirements, and closing the conversation to gain one capability is a
usability cliff that people will route around.

Delegation raises the same question from the other side. An agent that
spawns a subagent must not be able to obtain through the child what it
could not do itself.

## Decision

A conversation and an execution epoch are separate objects. A session plan
is immutable for the lifetime of its epoch. A conversation may span
several epochs through an explicit transition that compiles a new plan,
presents an authority difference, obtains approval, and records both
digests.

Every model request, invocation, and result carries its epoch identifier
and plan digest, so a result from an earlier epoch can never be presented
as authorized by a later plan.

Delegation only removes. A delegated plan's tools, grants, and lease
budgets are subsets of its parent's.

## Consequences

An agent cannot escalate by editing `Skillfile.json`. Modifying a file is
not modifying authority; the edit is input to a later compilation.

Approval has a natural granularity. Durable authority is confirmed once
per epoch; individual consequential effects are confirmed as they arise.

Conversation content survives a transition, so the usability cliff is
avoided without making authority mutable.

Delegation cannot become an escalation channel. Stating attenuation as an
invariant in the first version avoids a protocol break later, since
retrofitting it would invalidate existing plans.

The transition boundary requires draining in-flight invocations, which
adds a state that an implementation must handle correctly.
