# Changelog

All notable changes to the Curator Agent Runtime Specification are
recorded here. The format follows Keep a Changelog, and versions follow
semantic versioning of the specification surface.

## 0.1.0-draft — 2026-08-23

Initial draft. Fixes the object model and the invariants; does not yet
define wire framing or the reserved surfaces named in the runtime
protocol.

### Added

- Runtime protocol: components and trust domains, ten invariants,
  execution epochs, session plan, call plan, invocation operations, plan
  transition, delegation, receipts and the accountable log.
- Tool interface protocol: interface identity, portable schema subset,
  normative semantics, effect extractor, provider binding, conformance
  vectors, and the base interface set.
- Approval protocol: trusted path, closed outcome vocabulary, plan
  approval, effect approval, approval leases, presentation requirements,
  and session policy.
- Decisions 0001 through 0005.
- Schemas for the session plan, call plan, execution receipt, and approval
  lease.
- Informative architecture and threat model documents.
