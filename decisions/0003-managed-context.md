# Decision 0003: context is delivered, not read

Status: accepted for 0.1.0-draft

## Context

Agent harnesses load instructions from files in the user's home directory
and in the project working tree. Those files are ordinary writable files.
Any process running as the user can modify them, and the next session
loads the modification as trusted instruction. A dependency install script
is sufficient to place it.

Detecting modification is possible with a baseline and a hash chain, but
within one user account the attacker can modify the baseline as well.
Detection also runs after the fact.

## Decision

The runtime assembles context from the verified store named in the session
plan and delivers it across the broker interface. A conforming runtime
does not read agent instructions from a path that the session's own tools
may write.

The core holds no filesystem capability at all, so it cannot read such a
file even by mistake.

## Consequences

The class of attack that modifies a context file to change agent behavior
is eliminated rather than detected. There is no instruction file in the
writable workspace to modify.

Repository-supplied context remains admissible as a provenance tier,
because it is version controlled and reviewed. It is recorded in the
context bundle digest and carries its tier.

Content of any other provenance is data. Tool results, file contents, and
fetched pages are delivered in a data channel.

This reduces the consequences of prompt injection. It does not prevent it.
A model interprets text semantically, and a labeled channel does not make
it immune. The protocol therefore constrains what an epoch can do rather
than claiming the model cannot be misled.
