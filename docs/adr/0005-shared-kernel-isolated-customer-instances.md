---
status: accepted
---

# Share the kernel and isolate customer instances

Customer delivery requires strong isolation, while customer branches and premature shared-database SaaS would fragment governance or increase the blast radius before the kernel is proven.

The first customer-facing architecture uses one shared code kernel. A Deployment Instance is the infrastructure boundary containing one or more Workspaces and its data stores, credentials, runtimes, logs, queues, object storage, search resources, capability/adapter qualifications and backups. M0 creates an internal/test instance; M7 uses synthetic provisional qualification instances before a new, exact customer instance may be released. Customer variation belongs in signed Domain Packs, configuration, and qualified adapters.

Consequences: Workspace-scoped facts inherit an immutable Deployment Instance binding; customer Release Grants require a current Customer Delivery Qualification for the exact deployment profile; provisional instances cannot be relabelled; adding a Domain Pack resource class invalidates prior isolation qualification until rerun; the second simulated customer must require no kernel patch. Rejected alternatives were customer branches, using Workspace as infrastructure scope, and premature shared-database multi-tenancy. Revisit only after two isolated customer instances are proven and a separate SaaS threat model is approved.
