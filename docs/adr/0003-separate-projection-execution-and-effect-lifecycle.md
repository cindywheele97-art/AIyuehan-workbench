---
status: accepted
---

# Separate Projection from Execution and internalize External Effects

Agent/Stage representation and Execution Attempt lifecycle change for different reasons and serve different callers; combining them produced a wide provider-shaped interface.

Projection and Execution are separate deep modules. Durable dispatch, uncertain acknowledgement, adoption, reconciliation, deduplication, cancellation races, and immutable event recording live in a private `_internal/external-effect-lifecycle` package used only by their implementations, not in a public catch-all interface.

Consequences: both modules expose provider-neutral outcomes and keep External Work Platform DTOs and External Runtime Provider DTOs behind their respective adapters; internal effect state is modeled on separate delivery, observation, outcome and reconciliation axes. Rejected alternatives were one broad provider adapter or duplicated ledgers. Revisit the package visibility only if a new governed caller passes the deletion test; do not expose it merely for tests.
