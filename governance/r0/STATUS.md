# GOV-0/R0 status

```text
R0 = PROPOSAL / PENDING_FORMAL_APPROVAL
CURRENT_PROPOSAL = gov0-r0-proposal-v4 / NON-GOVERNING
IDENTITY = AIyuehan Workbench
MACHINE_NAMESPACE = aiyuehan-workbench
IDENTITY_BOUNDARY = AIYUEHAN_ONLY / ZERO_RESIDUE_REQUIRED
PUBLIC_REPOSITORY = cindywheele97-art/AIyuehan-workbench / ID 1350747678
REPOSITORY_OWNER = cindywheele97-art / USER ID 284274547
REPOSITORY_VISIBILITY = PUBLIC
PREDECESSOR = EXTERNAL_DIGEST_BOUND / NOT_PUBLISHABLE_FROM_ACTIVE_REPOSITORY
FORMAL_APPROVAL = PENDING_EXACT_DIGEST
EFFECTIVE = false
ROOT_TRUST_KEY = ABSENT / REQUIRED
ACTIVATION_SCHEMA_ENGINE = PRESENT / CLOSED KEYWORD PROFILE / SELF-TESTED
OUT_OF_BAND_ROOT_SPKI_ANCHOR = ABSENT / REQUIRED
ACTIVATION_BUNDLE = ABSENT / REQUIRED
REMOTE_PROTECTION_PRECONDITION = ABSENT / REQUIRED
REMOTE_PROTECTION_ADMIN_READBACK = PRESENT / UNSIGNED / NOT_ATTESTATION
EXACT_DIGEST_APPROVAL_RECORD = ABSENT / REQUIRED
GOVERNING_GATE_CONTENT = ABSENT
GOVERNING_GATE_ACTIVATION_AUTHORIZATION = ABSENT
REMOTE_PUBLICATION_EVIDENCE = ABSENT / REQUIRED
GOVERNING_REF_OR_TAG = ABSENT
BRANCH_RULESET = 21811138 / ACTIVE / ADMIN_READBACK
TAG_RULESET = 21811141 / ACTIVE / ADMIN_READBACK
REMOTE_REFS_AT_ADMIN_READBACK = EMPTY
REMOTE_PROTECTION = ACTIVE_RULESETS / SIGNED_INDEPENDENT_EVIDENCE_PENDING
M-1 = NOT_STARTED / BLOCKED_PENDING_R0
M0 = NOT_STARTED / BLOCKED_PENDING_R0_AND_M-1
PRODUCT_IMPLEMENTATION = NOT_STARTED
INSTALLATION = NOT_STARTED / NOT_AUTHORIZED
DEPLOYMENT = NOT_STARTED / NOT_AUTHORIZED
```

The local proposal tag is only an unsigned annotated anchor. It is neither a cryptographic signature nor a governing tag.

## Identity and source boundary

The active repository must contain no prohibited namespace token in any path, file bytes, ref, config, reflog, commit, tree, blob, or tag object. Original inputs, raw historical authority records, and predecessor Git objects remain outside the workspace in a digest-bound local archive. External bootstrap product and template files are excluded.

## Public protection readback

The public repository exists with active branch ruleset `21811138` and active tag ruleset `21811141`. The branch ruleset includes `main` and `governance/r0-proposal`, has an empty exclude set, and declares creation, update, deletion, non-fast-forward, and pull-request rules. Its pull-request parameters allow exactly merge, squash, and rebase; dismiss stale reviews on push; require code-owner review, extra approval for unattributed changes, last-push approval, one approving review, and review-thread resolution; and use an empty required-reviewers list. The tag ruleset includes `gov0-r0-proposal-v4` and `governance/r0`, has an empty exclude set, declares creation, update, and deletion rules, and has no pull-request parameters. Each ruleset has exactly one `always` bypass actor: GitHub `User` database ID `284274547`. The remote had no refs when this administrator readback was taken.

This administrator readback is unsigned. It is not publisher-signed Ruleset Admin Evidence, not a pull-only attestor's signed Remote Protection Precondition, and not formal approval.

## Next authorization boundary

The stable publisher must produce signed admin evidence from a retained raw capture, and a different pull-only attestor must independently bind the public fields and governing-ref absence. A real external root key, exact-digest Approval Record, Definition Issuer authorization, protected `governance/r0` tag, and independent post-publication evidence remain separate prerequisites. M-1 cannot start until the complete chain and role-isolation evidence validate.
