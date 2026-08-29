---
status: accepted
---

# Gate Authority owns Stage promotion

External systems can commit status before Workbench detects drift, so a later Reconciler cannot provide preventive control.

Only Gate Authority may create a Stage Authorization and promote a Stage Run. It serializes the Gate Case and atomically commits the Gate Decision, authorization, Stage transition, derived successor activation, event, and outbox using Authority-only credentials. Reconciler may repair a failed Projection but cannot legitimize an external transition after the fact.

Consequences: Gate Authority and effect workers require separate process/database identities or an Authority-only database routine; the Gate decision path cannot call true external systems; unavailable evidence fails closed. Rejected alternatives were prompt-enforced status discipline and post-hoc correction. Revisit only if another mechanism can prove the same atomic, non-bypassable transition invariant.
