---
status: accepted
---

# Deployment Instance contains Workspaces

Capability, adapter, runtime, resource, and recovery qualifications belong to an infrastructure boundary, while Runs, Grants, Artifacts, Gates, and Approvals belong to a Workspace. Making the customer instance a child of one Workspace reverses that ownership and prevents shared internal instances.

Global trust records govern signed packs and adapter releases. A Deployment Instance owns capability snapshots, adapter qualifications, projection/runtime profiles, resources, and one or more version-bound Workspaces. Each Workflow Run pins a Qualified Playbook Binding that joins its Workspace to that exact instance revision.

Consequences: M0 creates an internal/test instance; M7 creates synthetic qualification instances; cross-instance references fail closed; changing instance capabilities creates a new binding rather than mutating a Run. Rejected alternatives were Workspace-as-infrastructure-scope and a global undifferentiated runtime. Revisit only with a proven multi-instance migration model that preserves every historical binding digest.
