# Curator Agent Runtime Approval Protocol 0.1

This document is normative. It defines how a conforming runtime obtains
human consent, what that consent covers, and how consent is bounded in
time and count.

The key words MUST, MUST NOT, REQUIRED, SHOULD, SHOULD NOT, and MAY are to
be interpreted as described in RFC 2119.

## 1. Scope

This document governs consent for effects within an epoch and consent for
a transition between epochs. It does not govern authentication of the
person, which is outside this specification.

## 2. Trusted path

Approval rendering and consent capture MUST occur in the broker's trust
domain.

A component that processes model output MUST NOT register an approval
answerer, answer an approval request, or render the description a person
reads when deciding. A runtime that renders approvals from the component
holding the conversation admits a compromise in which the broker faithfully
enforces the plan while the consent was obtained for a different action.

The description presented to a person MUST be derived from the call plan
the broker will execute. A runtime MUST NOT present a description supplied
by the model or by a provider.

## 3. Outcome vocabulary

An approval resolves to exactly one of `allowed-once`, `rejected`,
`cancelled`, or `unavailable`.

The vocabulary is closed and fails closed. A missing answerer, a
non-responding answerer, an answerer that raises, and an answerer whose
response does not conform MUST all resolve to `unavailable`. A caller MUST
treat every outcome other than `allowed-once` as denial.

`allowed-once` grants exactly the invocation described by the call plan
presented. It MUST NOT be reused for a subsequent invocation, including an
invocation with identical input.

Every request and its outcome MUST be appended to the session event log as
a paired record carrying the call plan digest.

## 4. Plan approval

Plan approval occurs once per epoch, before the first model request bound
to that epoch.

The runtime MUST present the epoch's durable authority in terms of
effects. It MUST state which paths may be read, which paths may be
written, which executables may run, which network destinations are
reachable, which credential and signing operations are available, which
model provider receives content and under what retention, and whether a
shell is present.

For a transition, the runtime MUST present the difference between the
previous and the new authority rather than the full plan, and MUST show
additions, removals, and changes separately.

## 5. Effect approval

An invocation requires just-in-time approval when any of the following
holds:

1. the call plan names a network destination outside the machine;
2. the call plan is destructive and not reversible;
3. the call plan names a signing or credential operation;
4. the invocation is the first invocation of `curator.tool/shell-exec@1`
   in the epoch;
5. the invocation requests a profile wider than the session default;
6. the call plan mutates remote state irreversibly;
7. `precision` is `unknown`.

A runtime MUST NOT require approval for an invocation that satisfies none
of these conditions and is covered by plan approval. Requiring consent for
routine reads defeats consent for consequential effects.

## 6. Approval leases

A lease grants bounded repetition of one effect class. It is the mechanism
by which a person avoids repeated identical decisions without granting
open permission.

A lease MUST record the epoch, the interface identifier, the effect class,
a maximum count, an expiry, and whether it is revocable. A lease MUST be
scoped to a single epoch and MUST NOT survive a plan transition.

A lease MUST be created by the broker in response to a human decision. A
runtime MUST NOT create a lease from model output, from a provider
response, or from configuration supplied by a skill.

Consumption MUST decrement the count. An exhausted, expired, or revoked
lease MUST NOT be extended; a subsequent invocation returns to section 5.

A lease held by a delegated session MUST NOT exceed the parent's remaining
budget for the same effect class.

Current lease state MUST be visible in epoch state and MUST be revocable
by the person at any time.

## 7. Presentation requirements

An approval prompt is a decision about an action. A runtime MUST present
what will happen, not the capability vocabulary that permits it.

A prompt MUST state the action, what leaves the machine, what does not
leave the machine, and whether the effect is reversible. It SHOULD name
the concrete target rather than the pattern that admits it.

```text
Create a pull request in relux-works/curator

Sent:       branch name, title, description, already-published commits
Not sent:   other working tree files, local secrets
Reversible: the pull request can be closed
```

Where content of unknown provenance must be shown to a person, a runtime
MUST render it as quoted data and MUST NOT render it in a form that reads
as runtime instruction.

## 8. Session policy

A session policy governs what happens before any answerer runs. Defined
values are `ask` and `never`. `never` MUST resolve every request to
`rejected` without dispatching an answerer.

The effective policy MUST be reconstructible from the session event log. A
policy change MUST be recorded as an event.

A runtime MUST NOT offer a policy value that resolves requests to
`allowed-once` without a human decision. Unattended operation is expressed
by a plan that grants the required authority, reviewed once at plan
approval, not by an answerer that consents automatically.
