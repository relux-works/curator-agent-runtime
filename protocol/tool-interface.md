# Curator Tool Interface Protocol 0.1

This document is normative. It defines what a tool interface contract
contains, how a provider binds to it, and what an implementation must
satisfy to claim the interface.

The key words MUST, MUST NOT, REQUIRED, SHOULD, SHOULD NOT, and MAY are to
be interpreted as described in RFC 2119.

## 1. Scope

An interface is the stable contract between a model-facing tool name and
the behavior a provider delivers. Competing implementations bind to the
same interface, so an interface MUST pin behavior and not only shape.

## 2. Interface identity

An interface identifier has the form `curator.tool/<name>@<major>`.

`<name>` MUST match `^[a-z][a-z0-9-]*$`. `<major>` MUST be a positive
integer. A change that alters accepted input, produced output, declared
effects, or the error model MUST increment the major version.

A session plan binds a `tool_id` to exactly one `interface_id`. The
`tool_id` is the name the model sees and MAY differ from the interface
name.

## 3. Portable schema subset

Model providers accept different JSON Schema dialects. An interface MUST
express its input and output schema in the portable subset defined here,
and a runtime MUST compile that subset into the dialect its provider
accepts.

The subset admits `type` of `object`, `array`, `string`, `integer`,
`number`, and `boolean`; `properties`, `required`, and `additionalProperties`
on objects; `items` on arrays; `enum` on scalars; `description` on any
node; and `oneOf` with at least two branches where a value MUST match
exactly one.

A construct outside the subset MUST be rejected when the session plan is
built. A runtime MUST NOT silently drop an unsupported construct, and MUST
NOT alter an interface during a conversation.

## 4. Normative semantics

An interface MUST specify, for every operation it defines:

1. path resolution and canonicalization rules;
2. symbolic link handling;
3. character encoding behavior, including invalid input;
4. size limits and truncation behavior;
5. the error model, as a closed set of error identities;
6. the concurrency class, as `parallel-safe` or `workspace-exclusive`;
7. idempotency, as `idempotent` or `mutating`.

Two implementations that satisfy the same interface MUST be substitutable
without changing prompts, skills, or session plans that consume it.

## 5. Effect extractor

An interface MUST define an effect extractor: a total function from
validated input to the effects an invocation may perform.

```text
curator.tool/fs-apply-patch@1

effect(input):
  filesystem.write = canonicalize(input.path)
  network          = []
  destructive      = true
  reversible       = input.expected_digest != null
  precision        = exact
```

The extractor MUST be deterministic and MUST depend only on validated
input and session plan fields. It MUST NOT consult the filesystem,
network, or provider.

The extractor MUST report `precision` as `exact`, `bounded`, or `unknown`
as defined in the runtime protocol. An extractor that cannot bound an
effect class MUST report `unknown` for the invocation rather than
understating it.

The extractor is normative because the runtime derives the execution
profile from its output. An interface whose extractor understates an
effect produces an invocation that the platform denies.

## 6. Provider binding

A binding names the skill that supplies the implementation, the content
digest of that skill, the entrypoint within it, and the execution class.

`execution_class` MUST be one of `process`, `component`, or `remote`.
`process` invokes a native executable under a platform profile.
`component` instantiates a capability-addressed component. `remote`
delegates to a mediated endpoint. This draft specifies the object; only
`process` has defined enforcement rules, in the runtime protocol.

A runtime MUST NOT resolve an interface to an implementation at
invocation time. The binding is fixed when the session plan is built.
Where two installed skills claim the same interface, the compiler MUST
fail and MUST NOT apply a precedence rule.

## 7. Conformance vectors

An interface MUST ship vectors that exercise its declared semantics. A
vector set MUST cover path resolution, symbolic links, encoding, size
limits, every error identity, and the declared concurrency class.

Passing the vectors establishes that an implementation behaves correctly
on the vectors. It does not establish that an implementation reports
honestly about the system it observes. A tool that fabricates its output
is not detectable from inside the runtime. Base interfaces that the agent
relies on for its model of the workspace therefore remain high-trust
components, and replacing their implementation is a security-relevant
change that MUST be visible in the session plan difference.

## 8. Base interface set

The following interfaces are defined by this specification set and are
expected in a usable environment. Their contracts are specified in a later
draft.

| Interface | Class | Idempotency |
|---|---|---|
| `curator.tool/fs-read@1` | parallel-safe | idempotent |
| `curator.tool/fs-search@1` | parallel-safe | idempotent |
| `curator.tool/fs-apply-patch@1` | workspace-exclusive | mutating |
| `curator.tool/git-status@1` | parallel-safe | idempotent |
| `curator.tool/git-diff@1` | parallel-safe | idempotent |
| `curator.tool/shell-exec@1` | workspace-exclusive | mutating |

`curator.tool/fs-apply-patch@1` takes a path, an expected content digest,
and a patch. The expected digest removes the need for runtime state that
tracks which files a session has read.

`curator.tool/shell-exec@1` reports `precision: unknown` for every
invocation. Its presence in a session plan is an explicit grant, and the
approval protocol treats its first invocation in an epoch as an effect
requiring approval.
