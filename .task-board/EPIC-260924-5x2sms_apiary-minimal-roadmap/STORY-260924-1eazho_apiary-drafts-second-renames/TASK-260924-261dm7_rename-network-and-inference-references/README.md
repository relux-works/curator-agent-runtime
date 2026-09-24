# TASK-260924-261dm7: rename-network-and-inference-references

## Description
Replace curator-network with curator-network-profiles and curator-engine with curator-inference-manager in docs/drafts/apiary (EN and RU); `curator engine <verb>` becomes `curator-inference-manager <verb>`.

## Scope
(define task scope)

## Acceptance Criteria
grep for curator-network (not -profiles) and curator-engine in docs/drafts/apiary finds nothing.
