# Threat model

This document is informative. It states what a conforming runtime claims,
what it does not claim, and which attacker each claim addresses. A
specification that overstates its guarantees is worse than one that offers
fewer.

## Attacker classes

**Untargeted code running as the user.** A dependency install script, a
compromised package, or any process that runs with the user's own
credentials and does not know this runtime exists. This is the attacker
the protocol addresses.

**A malicious or compromised skill.** A skill that the project installed
and that supplies a provider implementation. Treated as untrusted, and
confined by its grant.

**Content of unknown provenance.** A file, a fetched page, or a tool
result containing text intended to steer the model. Delivered as data,
constrained by what an epoch can do.

**A targeted attacker holding the user's credentials.** An attacker that
knows the runtime's design and can write to the user's files. Version 1
does not defend against this class.

## What the protocol claims

An epoch's authority is computable before the session starts, from pinned
content, and is reviewable as a difference between plans.

No third-party code runs inside the process that holds the conversation.

Every model-visible operation is a binding fixed at plan time. A model
cannot cause an operation that the plan does not contain.

An invocation runs under a profile derived from its declared effects, and
a provider that exceeds those effects is denied by the platform rather
than detected afterward.

A shell is absent unless granted, and its grant is visible in the plan.

Modifying a file does not modify authority. An agent that edits the
project's Skillfile does not change the running epoch.

Delegation attenuates. A subagent cannot obtain authority its parent
lacks.

Human consent is captured by the component that executes, and is bounded
by count and epoch when it is repeated.

Everything the model saw is accountable: the runtime records its origin
and the exact representation sent.

## What the protocol does not claim

**Information noninterference.** Once data is visible to the model, the
model can paraphrase, aggregate, translate, encode, or act on it without
reproducing it. The protocol bounds which sources an epoch may read and
which sinks it may reach. It does not track data through the model, and
attempting to would produce a false sense of control.

The model provider is itself a sink. A file read under a grant of
`network: none` has already left the machine if the model runs remotely.
This is why the model sink and its retention terms are fields of the
session plan rather than client configuration.

**Immunity to prompt injection.** Provenance tiers help the policy layer
and the person distinguish origin. A model still interprets text
semantically. The architecture reduces the consequences of injection by
bounding what any instruction can cause. It does not prevent the
instruction from being followed.

**Honest providers.** Conformance vectors establish that an implementation
behaves correctly on the vectors. A file reading tool that fabricates
output is not detectable from inside the runtime, because the agent's
model of the workspace passes through it. Base interfaces are therefore
high-trust, and replacing an implementation is a security-relevant change
that appears in the plan difference.

**Confidentiality of read content.** Local retention modes govern local
storage. A remote provider retains under its own terms.

**Protection from a targeted same-account attacker.** A broker running
under the user's account can be replaced on disk, started by a different
launcher, given a substituted configuration, or handed a forged session
plan. Confining a provider does not require privilege, but anchoring the
integrity of the component that confines does. That anchor is M2 and is
specified as a protected authority root rather than as a privileged
daemon, because the root must also verify the plan's signature and the
identity of its interface peer.

**A guaranteed kernel boundary on every platform.** Backends differ, and
some report partial enforcement. The protocol requires that partial is
reported as partial and that a caller requiring an absolute boundary
refuses. It does not promise that every platform can deliver one.

## Residual risk after M2

Even with a protected authority root, the model provider adapter, the
transport, and the model provider itself remain in the trusted computing
base for confidentiality. A person who requires that repository content
never leaves the machine must select a local model sink, and the session
plan is where that selection is recorded and enforced.
