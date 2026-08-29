# AIyuehan Workbench

AIyuehan Workbench (shortened to Workbench in domain terms) governs AI-assisted work while using external runtimes and collaboration surfaces for execution. Its language separates authoritative decisions from projections, evidence from narrative, and stable roles from replaceable runtimes.

## Authority and scope

**Workspace**:
The ownership and policy scope for Runs, identities, Artifacts, credentials, and audit records.
_Avoid_: Tenant, account

**Workbench Authority**:
The authoritative record of Runs, governance facts, execution grants, approvals, and audit history.
_Avoid_: Control plane, source of truth

**External Work Platform**:
A replaceable, non-authoritative collaboration surface that may host projected Issues, Agents, Squads, comments, and status.
_Avoid_: Workbench, authority, provider-specific product name

**External Runtime Provider**:
A replaceable, non-authoritative provider of execution capacity for Runtime Assignments.
_Avoid_: Workbench runtime, authority, provider-specific product name

**Projection**:
A non-authoritative representation of AIyuehan Workbench facts in an External Work Platform.
_Avoid_: Mirror state, synchronized truth

## Work lifecycle

**Workflow Run**:
One governed execution of a versioned Playbook for a declared intent.
_Avoid_: Job, project run

**Stage Run**:
One attempt to complete a named Stage within a Workflow Run. Rework ends that attempt and creates a new Stage Run linked to it.
_Avoid_: Issue status, phase task

**Work Unit**:
A bounded assignment performed inside a Stage Run; it cannot authorize the Stage to advance.
_Avoid_: Stage, gate task

**Candidate**:
The immutable subject proposed for evaluation and possible promotion.
_Avoid_: Latest version, working copy

**Gate Input Revision**:
The immutable revision that binds one Candidate, its Evidence, judgments, and compiled Gate rules for evaluation.
_Avoid_: Latest evidence, current state

## Governance records

**Artifact**:
An immutable, content-identified record produced or consumed by governed work.
_Avoid_: Attachment, message

**Evidence**:
An Artifact that records an observed check, its subject, provenance, and outcome.
_Avoid_: Claim, summary

**Attestation**:
A verifiable statement binding an identity or trusted producer to a specific digest.
_Avoid_: Role label, assertion text

**Actor Binding**:
An immutable identity snapshot that binds a Principal, Session, role revision, assurance, and exactly one authority basis: Bootstrap Development Envelope, managed Execution Grant, authenticated human session, or system Principal.
_Avoid_: Current user lookup, role name

**Review Verdict**:
An independent judgment of whether a Candidate satisfies its stated specification and standards.
_Avoid_: Test result, approval

**Validation Verdict**:
A one-time, fixed-Candidate judgment that the declared evidence and required checks are genuine and complete.
_Avoid_: Review rerun, implementation handoff

**Gate Basis**:
The immutable set of Candidate, Evidence, judgments, compiled rules, risk, and intended transition evaluated together.
_Avoid_: Gate context, latest packet

**Gate Decision**:
The immutable disposition produced from one Gate Basis and its bound approvals.
_Avoid_: Status update, reviewer comment

**Stage Authorization**:
The immutable authority record permitting one Stage Run to enter `passed` for one Gate Input Revision. Any successor activation is a derived consequence, not reuse of the authorization.
_Avoid_: Token, done status

**Gate Case**:
The governed evaluation lifecycle for one Gate Basis, including any required Approval Requests and its terminal disposition.
_Avoid_: Gate run, review cycle

**Approval Request**:
A request for an eligible human to decide a digest-bound governance question before expiry.
_Avoid_: Notification, review request

**Approval Target**:
The immutable digest-bound question, identities, transition scope, environment, nonce, and expiry presented for human decision.
_Avoid_: Gate packet, approval context

**Approval**:
An eligible human's immutable, expiring decision over one exact approval target.
_Avoid_: Consent comment, checkbox

**Release Packet**:
The sealed Candidate, Evidence, Review Verdict, Validation Verdict, target environment, and release policy presented for approval.
_Avoid_: Deployment checklist, release note

## Execution and identity

**Role Contract**:
The stable responsibilities, allowed inputs, required outputs, and prohibitions for a governed role.
_Avoid_: Agent prompt, model profile

**Runtime Assignment**:
The replaceable binding of a Role Contract to an executable agent, model, host, and runtime configuration.
_Avoid_: Role, identity

**Execution Grant**:
A time-limited authorization for a named identity to perform constrained work in a specific Workspace and runtime scope.
_Avoid_: Credential, permission flag

**Runtime Isolation Profile**:
The immutable execution-isolation requirements for operating-system identity, mounts, network, host capabilities, resources, and secret injection.
_Avoid_: Runtime name, container config

**Context Snapshot**:
The immutable context supplied to one Execution Attempt.
_Avoid_: Conversation history, latest context

**Execution Attempt**:
One identity-bound attempt to perform assigned work under an Execution Grant.
_Avoid_: Agent session, task run

**Execution Receipt**:
The immutable record binding an Execution Attempt to its Context Snapshot, Runtime Assignment, Execution Grant, outputs, and terminal observation.
_Avoid_: Log summary, run message

**External Effect**:
An intended mutation of a system outside Workbench whose acknowledgement and observed result may arrive separately.
_Avoid_: Command, request

**Projection Intent**:
An immutable declaration of which authoritative Workbench fact should be represented externally.
_Avoid_: Provider request, synchronization command

**Projection Binding**:
The observed relationship between one Projection Intent and its external representation.
_Avoid_: External ID, mirrored record

## Playbooks and evolution

**Compiled Playbook**:
The immutable, validated form of a Playbook used by Workflow Runs and Gate evaluation.
_Avoid_: YAML file, workflow prompt

**Capability Snapshot**:
An immutable observation of which upstream protocol behaviours a particular external release provides, proven by an exact qualified probe harness. It does not qualify a later production adapter.
_Avoid_: Feature flags, assumed support

**Adapter Qualification**:
The Deployment Instance-scoped immutable evidence that one exact global Adapter Release digest satisfies its provider-neutral contract against that instance's Capability Snapshot, runtime profile, and failure matrix.
_Avoid_: Capability Snapshot, unit-test pass

**Qualified Playbook Binding**:
The immutable result of proving that one Compiled Playbook can run in a specific Deployment Instance with a specific Capability Snapshot, exact Adapter Qualification set, Projection Profile, and active Domain Packs.
_Avoid_: Deployed workflow, environment config

**Risk Policy**:
The versioned governance requirements that determine evidence, independence, approval, and execution assurance for a declared risk.
_Avoid_: Risk score, gate flags

**Domain Pack**:
A versioned set of domain terms, Artifact kinds, Playbook rules, and policies that extends the shared Workbench kernel.
_Avoid_: Customer fork, plugin script

**Domain Pack Trust Policy**:
The versioned rules for eligible namespaces, signers, keys, algorithms, rotation, revocation, and historical verification of Domain Pack manifests.
_Avoid_: Signature present, trusted plugin

**Deployment Instance**:
An infrastructure and runtime boundary containing one or more Workspaces, with one resource manifest, Capability Snapshot, exact Adapter Qualification set, Projection Profile, runtime profiles, credentials, and recovery assets.
_Avoid_: Workspace, customer account

**Customer Deployment Instance**:
A Deployment Instance dedicated to one customer. A provisional qualification instance is not a production customer instance and cannot be relabelled into one.
_Avoid_: Workspace, customer branch, qualification instance

**Customer Delivery Qualification**:
The immutable proof that an exact deployment profile, active Domain Packs, license disposition, data residency, and isolation controls satisfy customer-delivery policy. A later customer Release Packet must bind that profile and an exact intended Customer Deployment Instance.
_Avoid_: Deployment approval, readiness note

**Qualification Grant**:
A one-shot or short-lived Execution Grant that may create only a synthetic, `qualification_pending` provisional Deployment Instance for customer-delivery proof. It cannot carry customer traffic or be relabelled into production.
_Avoid_: Customer Release Grant, test environment label

**Gate Definition**:
The versioned, Candidate-independent declaration of commands, toolchains, timeouts, evidence requirements, and skip policy for a development Gate.
_Avoid_: CI script, Gate Run Manifest

**Governing Gate Definition**:
The signed Gate Definition frozen by a stable governance authority before a Candidate is created. It governs that Candidate and cannot be replaced by it.
_Avoid_: Candidate gate config, proposed definition

**Proposed Gate Definition**:
A candidate change to Gate policy that must pass the currently governing definition and, if approved, becomes effective only for later Candidates.
_Avoid_: Current gate override, self-approved policy

**Gate Run Manifest**:
The sealed record binding one fixed Candidate to one Governing Gate Definition, stable issuer, runner identity, toolchain, commands, and evidence locations.
_Avoid_: Gate Definition, test report

**Bootstrap Mode**:
The explicitly limited operating mode used before Workbench can govern its own development.
_Avoid_: Manual mode, temporary exception

**Bootstrap Development Envelope**:
An external-authority, digest-bound and expiring authorization for one GOV-0 development or governance role to run declared commands through M4. Once Workbench can issue Execution Grants, every managed external effect additionally requires one; the Envelope cannot authorize product Runtime dispatch, customer resources, deployment, or capability proof by itself.
_Avoid_: Execution Grant, bootstrap bypass

**External Governance Trust Policy Snapshot**:
The immutable GOV-0 trust root recording eligible authorities, roles, keys, algorithms, validity, rotation, and revocation semantics used to verify historical Actor Bindings and approvals.
_Avoid_: Current key list, user identity claim

**External Governance Approval Record**:
A canonical signed decision binding a Governing Gate Definition and Bootstrap Envelope policy to an eligible external Approver Actor Binding before the governed Candidate exists.
_Avoid_: Chat approval, unsigned plan status

**Remote Protection Precondition**:
A pull-only attestor's signed observation, made before approval, that binds the public repository and proposal Git identity to active branch/tag rules, the attestor's restricted access, governing-tag absence, and a separate publisher-signed Ruleset Admin Evidence digest. It explicitly does not claim visibility of GitHub's hidden bypass actors.
_Avoid_: Repository setting screenshot, claim that a tag is protected

**Remote Protection Admin Readback**:
An unsigned administrator-visible observation used to confirm that a repository and expected rulesets currently exist. It is operational input only and cannot substitute for signed publisher evidence or an independent pull-only attestor's observation.
_Avoid_: Remote Ruleset Admin Evidence, Remote Protection Precondition

**Remote Ruleset Admin Evidence**:
The stable publisher's signed admin-visible capture of exact repository ruleset source, include and empty-exclude conditions, rules, sole bypass actor, phase-specific governing-ref state, and raw API capture digest. A pull-only attestor binds this record but cannot replace it because GitHub hides bypass actors from non-write callers.
_Avoid_: Read-only attestor claim about hidden bypass actors, unsigned admin screenshot

**Governing Gate Activation Authorization**:
The Definition Issuer's signed, digest-bound authorization to publish one approved Governing Gate Definition. It remains `AUTHORIZED_PENDING_PUBLICATION` and ineffective until the protected-tag publication chain validates.
_Avoid_: Active gate, governing tag, deployment authorization

**Remote Publication Evidence**:
An independent pull-only attestor's signed post-publication readback binding its restricted access, a publisher-signed post-publication Ruleset Admin Evidence digest, protected governing tag object, peeled proposal commit/tree, fixed tag-message digest, public active rules, and raw API capture to the approval and activation chain.
_Avoid_: Push success, local tag, unsigned API summary

**Derived Governing Activation**:
The `GOVERNING_GATE_ACTIVE` result produced only when the external root anchor, schemas, signatures, role separation, exact Git bytes, Approval, Activation Authorization, protected tag, and pre/post remote Evidence all validate together.
_Avoid_: Activation file status, Approval alone, tag existence alone
