# Security Policy

## Scope

This repository contains a specification. Report a defect here when a
normative rule is unsound, an invariant is unenforceable as written, or a
claim in the threat model overstates what the protocol delivers.

Report implementation vulnerabilities to the implementation's own
repository.

## Reporting

Open a private security advisory through GitHub on this repository, or
write to the maintainer listed in the README.

Include the document and section, the rule at issue, and the sequence that
violates it. A worked example that a conforming implementation would
accept is more useful than a description.

## What this specification claims

Read [`docs/threat-model.md`](docs/threat-model.md) before reporting. The
protocol deliberately does not claim information noninterference, immunity
to prompt injection, honest providers, confidentiality of content sent to
a remote model, or defense against a targeted attacker holding the user's
own credentials. A report that one of these is unmet describes a stated
non-goal rather than a defect.

A report that one of the stated claims is unmet, or that a non-goal is
reachable in a way the threat model does not describe, is a defect.
