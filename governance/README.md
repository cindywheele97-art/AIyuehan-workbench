# GOV-0 external governance root

This directory contains governance-only proposal assets for the pre-product bootstrap protocol described in the AIyuehan Workbench architecture plan. It is not the product Bootstrap Lifecycle and does not authorize product work.

## Authority boundary

The authenticated user has directed continuation after creating the public repository. The current v4 work remains limited to GOV-0/R0 preparation, one governance-only root commit, proposal refs/tags, protection verification, and the minimum push needed for proposal anchors. That instruction does not make an unsigned administrator readback into formal approval or waive the signed activation chain. The active namespace remains AIyuehan-only, and external product or template code remains excluded.

The current normalized identity is:

- display name: `AIyuehan Workbench`;
- repository: `cindywheele97-art/AIyuehan-workbench`;
- machine namespace: `aiyuehan-workbench`;
- schema URN prefix: `urn:aiyuehan-workbench`.

External provider capabilities remain provider-neutral. Renaming must never be used to claim ownership of an external platform, runtime, protocol, or licensed component.

This v4 preparation does not itself start M-1, M0, or product implementation; those stages remain blocked until R0 activation. It performs no installation, external-platform authentication or object creation, dynamic qualification, deployment, release, or customer-resource mutation. It is not a signature-bearing approval of the resulting digest.

## Record classes

- `authorizations/` records bounded preparation authority and exclusions without embedding prohibited historical wording.
- `r0/` contains inactive proposals, the identity boundary, and intended remote-protection contract.
- `schemas/` defines strict future governance records; a schema does not approve or instantiate a record.
- `tools/` contains deterministic governance-only checks and makes no external mutation.
- `build/BUILD-LOG.ndjson` starts a new namespace-isolated coordination epoch; it is not a verdict. Historical evidence paths resolve through `build/BUILD-LOG-EVIDENCE-INDEX.json` to immutable content-addressed snapshots from the proposal root in which the event was recorded. Current entries resolve only against the current closed-world proposal root; before a later root changes any referenced path, that entry must first receive the same snapshot treatment.
- `evidence/` contains digest-only external lineage, code-exclusion evidence, and the public-repository administrator readback.

## Activation rule

R0 is not effective until a real trust root, independently bound actors, complete signed protected-ref evidence, an exact Approval Target, real signatures, a protected governing tag, and independent post-publication readback all exist and validate together. Absent any item, the state remains fail-closed and M-1 cannot start.

Gate content, activation authorization, publisher-admin evidence, and attestor evidence stay separate to prevent digest cycles and false observation claims. `GOVERNING_GATE_ACTIVE` is derived only from the complete chain and is never a self-asserted proposal field.

The current trust proposal intentionally has no key and cannot activate. The public repository and active rulesets now exist, but the administrator readback is neither signed publisher evidence nor evidence from a pull-only attestor. No root key, dependency, external account, or deployment resource is generated, installed, or invented by this preparation.

## Canonical digests and signatures

Governance JSON uses UTF-8, rejects duplicate keys, lone surrogates, and unsafe integer-valued numbers, and canonicalizes under the repository's restricted RFC 8785 profile. Manifest entries hash exact Git blob bytes; record references hash canonical bytes.

Signature messages remain domain-separated by the `aiyuehan-workbench` machine namespace. Verification enforces key use, external root anchoring, role isolation, exact proposal Git bytes, protected-ref publication readback, and the AIyuehan identity boundary.
