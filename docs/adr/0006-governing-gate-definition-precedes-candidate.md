---
status: accepted
---

# Governing Gate Definition precedes the Candidate

A Candidate-controlled gate can remove or weaken the checks used to judge itself, so separating Gate Definition from Gate Run Manifest does not by itself establish a trust root.

Stable governance authority freezes, signs, and approves a Governing Gate Definition and immutable gate assets before Candidate creation. GOV-0 issuer and approver identities use signed External Governance Actor Bindings verified against an immutable trust-policy snapshot, not nonexistent product Grants. The Gate Run Manifest, Compiled Gate Plan, Gate Basis, Evidence, Verdicts, Approval, and Release Packet bind that digest. A Candidate may propose a new Definition only as a separate governance Candidate evaluated under the old Definition; approval makes it effective for later Candidates.

Consequences: Builder, Candidate, and Conductor cannot replace the current gate; stable N governs N+1; the first GOV-0 definition requires a digest-bound external Approval Record. Rejected alternatives were Candidate-local package scripts as trust root and post-hoc Reviewer detection. Revisit only if an external policy service provides an equally immutable, pre-Candidate and historically verifiable governing identity.
