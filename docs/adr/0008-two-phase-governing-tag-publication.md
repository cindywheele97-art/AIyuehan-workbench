# ADR-0008: Derive governing activation only after protected-tag publication

- Status: Proposed / pending exact-digest approval
- Scope: GOV-0/R0 external governance only
- Effective: false

## Context

An Approval Target can bind remote protection evidence collected before approval, and an Activation Authorization can bind the resulting Approval Record. The governing tag cannot safely be part of that same digest graph: its message must bind the final Activation Authorization digest, while proof that the tag exists is available only after the tag has been created and pushed. Making either record depend on the other would create a digest cycle or leave the signed activation detached from the protected Git anchor.

## Decision

Use a two-phase genesis ceremony:

1. The stable-authority publisher uses its ruleset-administration session to sign a precondition `RemoteRulesetAdminEvidence`: repository database ID `1350747678`; branch and tag ruleset database IDs `21811138` and `21811141`; complete active ruleset source, include conditions, an exact empty exclude list, rules, the branch ruleset's complete pull-request parameters, the sole always-bypass GitHub user, governing-ref absence, and a digest of the admin-visible raw API capture. The tag ruleset must not carry pull-request parameters.
2. A different pull-only remote attestor independently reads the repository, refs, and public ruleset fields, records `bypass_actors_visibility = OMITTED_NO_WRITE_ACCESS`, binds the publisher-admin evidence digest, and signs the `RemoteProtectionPrecondition`. Its capture must follow the admin capture within five minutes and match every public ruleset field.
3. The Approval Target binds the exact root commit/tree, canonical and raw payload-manifest digests, active policy/content/asset digests, precondition digest, one 256-bit ceremony nonce, publication deadline, activation sequence `0`, and `supersedes = null`.
4. An independent Approver signs the Approval Record. An independent Definition Issuer then signs an `AUTHORIZED_PENDING_PUBLICATION` Activation Authorization. That record is explicitly not effective by itself.
5. The stable-authority publisher bound to GitHub user database ID `284274547` creates one annotated `refs/tags/governance/r0` tag. Its exact tagger identity and fixed-format message bind the publisher, repository identity, nonce, proposal commit/tree, raw manifest digest, Approval Target digest, Approval Record digest, and Activation Authorization digest.
6. The publisher signs post-publication `RemoteRulesetAdminEvidence` binding the exact tag and unchanged admin-visible rules. The independent pull-only attestor then performs its own readback and signs `RemotePublicationEvidence`, binding the admin-evidence digest, its restricted access, tag object, peeled commit/tree, message digest, public rules, raw API capture, and preceding chain.
7. Only the composite verifier may derive `GOVERNING_GATE_ACTIVE`, and only when both publisher/admin and attestor captures for both phases, the external root-key SPKI digest, exact target-commit runtime/schema bytes, signatures, role separation, times, Git object bytes, and protected-tag message all validate. The external runner must first materialize the verifier, canonicalizer, validator, and schemas from the exact approved commit in an isolated directory; self-verification by an already replaced executable is not a trust anchor.

The stable-authority publisher, Definition Issuer, Approver, and remote attestor must have different Principal IDs, Session IDs, and public-key material. Only the publisher may hold repository/ruleset administration authority. GitHub intentionally withholds `bypass_actors` from callers without write access to a ruleset, so the attestor remains a different pull-only GitHub user and never claims to observe that hidden field; it instead binds and cross-checks the publisher's separately signed admin capture.

## Consequences

- There is no activation/tag digest cycle.
- Replaying the same complete bundle is idempotent; a different genesis activation cannot replace the fixed protected tag.
- Creation protection removes the race in which another actor could claim the governing tag name before the authorized publisher.
- Empty exclusion conditions are required; a matching GitHub exclude condition would otherwise make an apparently included governance ref unprotected.
- Admin-visible bypass state and independent read-only ref/rule observations have separate producers and raw captures; neither is silently normalized into evidence the producer could not observe.
- All schema and activation-runtime bytes are gate assets in the approved root commit; a dirty or substituted runtime fails closed.
- Initial activation verification must finish before the one-hour publication deadline. Historical verification will require retained immutable output from that initial ceremony and is not inferred from the current wall clock alone.
- The proposal tag `gov0-r0-proposal-v4` remains non-governing.
- The public repository now has active branch and tag rulesets, and the administrator readback observed no remote refs. This removes the former protection-capability blocker but does not satisfy either signed publisher evidence or independent pull-only attestor evidence.
- Until a real out-of-band root key exists and the complete role-separated signed approval, activation, publication, and readback bundle is produced, R0 remains an ineffective proposal. M-1, M0, and product implementation remain unstarted.
