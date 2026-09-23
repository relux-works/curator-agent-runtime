# Apiary authority wire: amendment proposal for waggle signatures

Status: **DRAFT, pending review**, 2026-09-24. Not normative. This proposal changes nothing in the accepted informative design `apiary-design-2026-09-08`: [`docs/apiary/authority-wire.md`](../../apiary/authority-wire.md) and the interactive guide built from the accepted snapshot stay byte-identical until a reviewed adoption rewrites that chapter and rebuilds the guide with a new accepted source reference. Source of the replacement design: `waggle/spec/waggle.md` (draft v4; the operator decided name, SSHSIG, multi-signature and signer providers on 2026-09-24). Related drafts: [minimal roadmap](minimal-roadmap.md), [track](track.md).

## Why

task-board orchestrators and Apiary need the same thing from a signature: a sender that cannot be forged on any transport, verification that works offline, and approvals by more than one party. waggle is the messaging layer decided for task-board orchestrators and their workers; it is a separate public Go module meant to be consumed by task-board and Apiary alike. If Apiary keeps its own preimage format, the same principals would sign two formats with two key registries and two verifiers. Carrying Apiary's authority records in waggle envelopes gives one identity model, one roster and one verification pipeline, and adds what the accepted wire does not have: role-bound co-signatures and key-hardware assurance.

## What the accepted design says today

| Topic | Accepted text (summary) | Where |
| --- | --- | --- |
| Encoding and algorithm | Curator canonical JSON (CCJ) after a versioned freeze, SHA-256, Ed25519; restricted JSON (unique keys, canonical escaping and order, no floats, bounded depth, unknown signed fields rejected) | `docs/apiary/authority-wire.md:60` |
| Signing preimage | ASCII `APIARY\0` + `schema_version` + zero byte + `record_type` + zero byte + canonical unsigned envelope bytes; `signature` excluded; algorithm fixed by profile; Ed25519 key 32 bytes, signature 64 bytes, base64url | `docs/apiary/authority-wire.md:62` |
| Envelope fields | `schema_version`, `record_type`, `message_id`, `issuer`, `audience`, `key_id`, `project_id`, `issued_at_ms`, `expires_at_ms`, `payload`, `artifacts` | `docs/apiary/authority-wire.md:64-90` |
| Enrollment and key certificates | the operator binds a node key to an owner and allowed roles; key certificate with issuer, subject, public key, project/audience/roles, validity and serial; chain to a pinned project root; revocation checkpoint and monotonic high-water checked before admission; rotation and re-enrollment | `docs/apiary/authority-wire.md:94` |
| Node signer | only `SignSubmission` and `SignReview` plus internal enrollment and transport domains; never arbitrary bytes, a new Grant or a project commit | `docs/apiary/authority-wire.md:96` |
| Replay scope | durable inbox key `(project, issuer, message_id)` with body digest; `conflicting_duplicate`; no downgrade of schema, crypto, assurance or freshness profile | `docs/apiary/authority-wire.md:98` |
| XMPP framing | `<envelope xmlns="urn:apiary:envelope:1" encoding="base64url-ccj">`; XML is never signed; stanza and envelope bounds | `docs/apiary/authority-wire.md:104-110` |
| Signed acknowledgements | an application ack is itself a signed envelope with `in_reply_to` and the digest of the original | `docs/apiary/authority-wire.md:122` |
| Halt | any enrolled core node may sign a sole `HaltRequest`; resume needs a committed `ResumeAuthorization` | `docs/apiary/authority-wire.md:13` |

## Proposed change

1. **Signature container.** A signed record travels as a waggle envelope: `payload` is base64url of the exact CCJ bytes of the unsigned record (the canonicalization and restricted-JSON rules of `:60` are unchanged, and the payload is never re-serialized); `sigs` is a list of one or more SSHSIG entries over those same bytes. The SSHSIG signed structure (magic `SSHSIG`, namespace, hash algorithm, SHA-512 of the payload) replaces the `APIARY\0` preimage of `:62`.
2. **Domain separation moves into the namespace.** What the preimage prefix bound (`schema_version`, `record_type`) is bound by the SSHSIG namespace instead, together with the signer's role, for example `OperationIntent.apiary-proposal-1@apiary` for the author and `approve.OperationIntent.apiary-proposal-1@apiary` for an approver. The exact spelling is open (question 1). A signature made for one record type, schema version or role does not verify under another.
3. **Multi-signature by role.** Each entry names its role: `author` (the issuing node signer or orchestrator), `approver` (an operator), `endorser` (a parent orchestrator). The payload names the expected co-signers, so the author commits to the approver it asked for. A committed policy says which record types need which roles; extra signatures never grant anything. The accepted rule that any enrolled core node may halt alone (`:13`) stays expressible as a policy that requires only `author` for `HaltRequest`.
4. **Keys, certificates and the roster.** The key certificate of `:94` maps onto OpenSSH certificates (signing CA, principals, validity window, serial, key id); project and role binding travel as certificate extensions checked by the verifier. The pinned project root becomes a committed `allowed_signers` roster read at a pinned revision, with a key revocation list and the policy file next to it. OpenSSH certificates are single-level, so a chain to the project root is expressed by listing each CA key in the roster with its own principals and namespaces, and by co-signatures when a second party must vouch at message time.
5. **Signer providers and assurance.** Signing goes through pluggable providers (`ssh-agent` for ordinary, FIDO and agent-exposed Secure Enclave keys; later a direct Secure Enclave helper, TPM and PIV). Enrollment verifiers record an assurance level (`software` < `hardware-bound` < `attested`), and a per-signature `user_verified` fact comes from FIDO flags where the format carries it. Policy sets the minimum assurance per role and record type, with an explicit fallback for operators without hardware keys. The node signer limits of `:96` do not change: providers sit behind the node signer, and model context never reaches a key.
6. **Key algorithms.** Ed25519 stays the default for software keys. SSHSIG also carries FIDO keys (`sk-ssh-ed25519@openssh.com`, `sk-ecdsa-sha2-nistp256@openssh.com`) and ECDSA P-256 keys held in a Secure Enclave. The admissible key types per role are fixed by policy, never negotiated from the message, which preserves the no-fallback rule of `:62`.
7. **XMPP framing.** The `<envelope>` element of `:104-110` carries the waggle envelope instead of a bare signed CCJ object (the `encoding` attribute value changes; its spelling is open). XML stays unsigned. XMPP remains the federation carrier; waggle's local, NATS JetStream and board-server carriers move the same envelope bytes.
8. **Acknowledgements.** The application acks of `:122` map onto waggle receipts (`received_durable`, `delivered`, `read`, `applied`, `rejected:<reason>`, `expired`), signed by the receiving host; `in_reply_to` and the digest of the original stay.

## What stays

- CCJ canonical bytes and the restricted-JSON rules (`:60`) for the payload.
- The replay scope, deduplication keys, `conflicting_duplicate` and the downgrade prohibition (`:98`); waggle deduplicates on the same shape of key with the payload digest.
- The node signer's closed signing interface (`:96`).
- Size bounds and the artifact protocol (`:92`, `:110`, `:128`), adjusted for larger signatures (see consequences).
- Authority semantics: a signature proves who made a claim, not that the claim is true; grants, leases, fencing, halt and resume rules and the L0–L2 quorum levels are unchanged.

## Consequences

- Stored records can be verified offline with stock OpenSSH (`ssh-keygen -Y verify`) and the roster at the recorded revision.
- Apiary and task-board share one identity, roster and verification implementation (the waggle module) instead of two.
- An SSHSIG entry embeds the signer's public key or certificate, so it is several hundred bytes rather than a bare 64-byte Ed25519 signature; the envelope and stanza bounds of `:110` must account for every signature a policy can require.
- Conformance vectors change: SSHSIG sign and verify vectors (wrong namespace, wrong role, changed byte, expired certificate, revoked key, missing co-signature, insufficient assurance) replace the preimage vectors.

## Open questions

1. Namespace spelling for Apiary record types, schema versions and roles, and whether Apiary uses an `@apiary` namespace family or shares waggle's classes for overlapping message kinds (cancel, halt).
2. Which Apiary key-certificate fields (project, audience, roles) become OpenSSH certificate extensions and which stay roster options.
3. How roster and revocation-list revisions feed the authority's revocation checkpoint and monotonic high-water.
4. Which record types need an `approver` or `endorser` signature (for example `ResumeAuthorization`, or a halt across owners).
5. The `encoding` attribute value and version negotiation for the XMPP element.
6. Whether the future `apiary-spec` normative grammar defines SSHSIG envelopes itself or references waggle's specification.

## Review

Pending review by the maintainers of this repository. Adoption requires a revision of `docs/apiary/authority-wire.md`, new conformance vectors, and a rebuild of the interactive guide with a new accepted source reference.
