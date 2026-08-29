# GitHub public-ref protection administrator readback

Evidence status: **unsigned operational readback for GOV-0/R0 v4 preparation**.

The observation time and raw API response digest are not asserted by this Markdown summary. A later signed evidence record must bind both from its retained raw capture.

## Repository identity

- Repository: `cindywheele97-art/AIyuehan-workbench`
- Repository database ID: `1350747678`
- Visibility: public
- Owner: GitHub `User` database ID `284274547`
- Remote refs at administrator readback: empty

## Active branch ruleset

- Ruleset database ID: `21811138`
- Enforcement: `active`
- Included refs: `main`, `governance/r0-proposal`
- Excluded refs: empty
- Rules: creation, update, deletion, non-fast-forward, pull request
- Pull-request parameters: merge methods exactly `merge`, `squash`, and `rebase`; stale reviews dismissed on push; code-owner review required; unattributed changes require extra approval; last-push approval required; one approving review required; review-thread resolution required; required-reviewers list empty
- Sole bypass actor: GitHub `User` database ID `284274547`, bypass mode `always`

## Active tag ruleset

- Ruleset database ID: `21811141`
- Enforcement: `active`
- Included refs: `gov0-r0-proposal-v4`, `governance/r0`
- Excluded refs: empty
- Rules: creation, update, deletion
- Pull-request parameters: absent / not applicable
- Sole bypass actor: GitHub `User` database ID `284274547`, bypass mode `always`

## Evidence boundary

This record confirms the administrator-read facts used to prepare the v4 proposal. It is not signed publisher `RemoteRulesetAdminEvidence`, is not a pull-only attestor's `RemoteProtectionPrecondition`, and cannot establish independent evidence, exact-digest formal approval, governing-tag publication, or derived R0 activation.

The external root key, role-separated signatures, independent precondition evidence, Approval Record, Activation Authorization, protected `governance/r0` tag, and post-publication evidence are absent. M-1, M0, and product implementation have not started.
