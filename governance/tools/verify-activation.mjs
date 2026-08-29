#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import {
  createHash,
  createPublicKey,
  generateKeyPairSync,
  sign as ed25519Sign,
  verify as ed25519Verify
} from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalize, parseStrictJsonBytes } from "./canonical-json.mjs";
import { loadSchemaRegistry, validateInstance } from "./validate-json-schema.mjs";

const PAYLOAD_PROFILE =
  "UTF8(domain + newline + schema_version + newline) || RFC8785(record_with_signature.value_base64_omitted)";
const GOVERNING_REF = "refs/tags/governance/r0";
const REPOSITORY_DATABASE_ID = 1350747678;
const OWNER_DATABASE_ID = 284274547;
const OWNER_LOGIN = "cindywheele97-art";
const BRANCH_RULESET_ID = 21811138;
const TAG_RULESET_ID = 21811141;
const BRANCH_PULL_REQUEST_PARAMETERS = Object.freeze({
  allowed_merge_methods: Object.freeze(["merge", "squash", "rebase"]),
  dismiss_stale_reviews_on_push: true,
  require_code_owner_review: true,
  require_extra_approval_for_unattributed_changes: true,
  require_last_push_approval: true,
  required_approving_review_count: 1,
  required_review_thread_resolution: true,
  required_reviewers: Object.freeze([])
});
const PUBLISHER_PRINCIPAL_ID = `github-user:${OWNER_DATABASE_ID}:${OWNER_LOGIN}`;
const PUBLISHER_TAGGER = `${OWNER_LOGIN} <${OWNER_DATABASE_ID}+${OWNER_LOGIN}@users.noreply.github.com>`;
const MAX_PRECONDITION_AGE_MS = 15 * 60 * 1000;
const MAX_ADMIN_ATTESTOR_SKEW_MS = 5 * 60 * 1000;
const MAX_CEREMONY_LIFETIME_MS = 60 * 60 * 1000;
const schemaDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "../schemas");
const runtimeRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const activationRuntimeAssetPaths = Object.freeze([
  "governance/schemas/actor-binding.schema.json",
  "governance/schemas/approval-record.schema.json",
  "governance/schemas/approval-target.schema.json",
  "governance/schemas/bootstrap-envelope-policy.schema.json",
  "governance/schemas/bootstrap-envelope.schema.json",
  "governance/schemas/build-log-entry.schema.json",
  "governance/schemas/build-log-evidence-index.schema.json",
  "governance/schemas/common.schema.json",
  "governance/schemas/evidence.schema.json",
  "governance/schemas/gate-run-manifest.schema.json",
  "governance/schemas/governing-gate-activation.schema.json",
  "governance/schemas/governing-gate-content.schema.json",
  "governance/schemas/identity-boundary-policy.schema.json",
  "governance/schemas/namespace-isolation-authorization.schema.json",
  "governance/schemas/payload-manifest.schema.json",
  "governance/schemas/preparation-authorization.schema.json",
  "governance/schemas/proposed-gate-definition.schema.json",
  "governance/schemas/ref-protection-intent.schema.json",
  "governance/schemas/remote-protection-evidence.schema.json",
  "governance/schemas/remote-publication-evidence.schema.json",
  "governance/schemas/remote-ruleset-admin-evidence.schema.json",
  "governance/schemas/repository-continuation-authorization.schema.json",
  "governance/schemas/review-verdict.schema.json",
  "governance/schemas/risk-policy.schema.json",
  "governance/schemas/trust-policy.schema.json",
  "governance/schemas/validation-verdict.schema.json",
  "governance/tools/canonical-json.mjs",
  "governance/tools/validate-json-schema.mjs",
  "governance/tools/verify-activation.mjs",
  "governance/tools/verify-identity-boundary.mjs"
]);

const r0GateAssetPaths = Object.freeze([
  ...activationRuntimeAssetPaths,
  "governance/tools/verify-r0.sh"
]);

const bundleFiles = Object.freeze({
  trust: "trust-policy.json",
  risk: "risk-policy.json",
  envelope: "bootstrap-envelope-policy.json",
  preparer: "actor-binding.preparer.json",
  approver: "actor-binding.approver.json",
  issuer: "actor-binding.issuer.json",
  attestor: "actor-binding.remote-attestor.json",
  proposal: "proposed-gate-definition.json",
  content: "governing-gate-content.json",
  manifest: "payload-manifest.json",
  preconditionAdmin: "remote-ruleset-admin-evidence.precondition.json",
  precondition: "remote-protection-precondition.json",
  target: "approval-target.json",
  approval: "approval-record.json",
  activation: "governing-gate-activation.json",
  publicationAdmin: "remote-ruleset-admin-evidence.publication.json",
  publication: "remote-publication-evidence.json"
});

const captureFiles = Object.freeze({
  preconditionAdmin: "remote-precondition-admin-api-capture.json",
  precondition: "remote-precondition-api-capture.json",
  publicationAdmin: "remote-publication-admin-api-capture.json",
  publication: "remote-publication-api-capture.json"
});

const schemaIds = Object.freeze({
  trust: "urn:aiyuehan-workbench:schema:external-governance-trust-policy:v1",
  risk: "urn:aiyuehan-workbench:schema:external-development-risk-policy:v1",
  envelope: "urn:aiyuehan-workbench:schema:bootstrap-envelope-policy:v1",
  preparer: "urn:aiyuehan-workbench:schema:external-governance-actor-binding:v1",
  approver: "urn:aiyuehan-workbench:schema:external-governance-actor-binding:v1",
  issuer: "urn:aiyuehan-workbench:schema:external-governance-actor-binding:v1",
  attestor: "urn:aiyuehan-workbench:schema:external-governance-actor-binding:v1",
  proposal: "urn:aiyuehan-workbench:schema:proposed-gate-definition:v1",
  content: "urn:aiyuehan-workbench:schema:governing-gate-content:v1",
  manifest: "urn:aiyuehan-workbench:schema:r0-payload-manifest:v1",
  preconditionAdmin: "urn:aiyuehan-workbench:schema:remote-ruleset-admin-evidence:v1",
  precondition: "urn:aiyuehan-workbench:schema:remote-protection-precondition:v1",
  target: "urn:aiyuehan-workbench:schema:external-governance-approval-target:v1",
  approval: "urn:aiyuehan-workbench:schema:external-governance-approval-record:v1",
  activation: "urn:aiyuehan-workbench:schema:governing-gate-activation:v1",
  publicationAdmin: "urn:aiyuehan-workbench:schema:remote-ruleset-admin-evidence:v1",
  publication: "urn:aiyuehan-workbench:schema:remote-publication-evidence:v1"
});

const expectedDomains = Object.freeze({
  "aiyuehan-workbench.external-governance-trust-policy/v1": "aiyuehan-workbench:trust-policy:v1",
  "aiyuehan-workbench.external-development-risk-policy/v1": "aiyuehan-workbench:risk-policy:v1",
  "aiyuehan-workbench.bootstrap-envelope-policy/v1": "aiyuehan-workbench:bootstrap-envelope-policy:v1",
  "aiyuehan-workbench.external-governance-actor-binding/v1": "aiyuehan-workbench:actor-binding:v1",
  "aiyuehan-workbench.remote-ruleset-admin-evidence/v1": "aiyuehan-workbench:remote-ruleset-admin-evidence:v1",
  "aiyuehan-workbench.remote-protection-precondition/v1": "aiyuehan-workbench:remote-protection-precondition:v1",
  "aiyuehan-workbench.external-governance-approval-record/v1": "aiyuehan-workbench:approval-record:v1",
  "aiyuehan-workbench.governing-gate-activation/v1": "aiyuehan-workbench:governing-gate-activation:v1",
  "aiyuehan-workbench.remote-publication-evidence/v1": "aiyuehan-workbench:remote-publication-evidence:v1"
});

const expectedAuthorizedScope = Object.freeze([
  "authorize only the exact GOV-0/R0 governing content policies and gate assets bound by this target",
  "publish only refs/tags/governance/r0 at the exact proposal root commit bound by this target"
]);

const expectedExcludedScope = Object.freeze([
  "M-1 execution",
  "M0 execution",
  "product implementation or product skeleton",
  "External Work Platform installation authentication dynamic qualification or resource mutation",
  "deployment publication release or execution automation other than the one bound governing tag publication",
  "any repository commit tree ref or tag not exactly bound by this target"
]);

const gitEnvironment = Object.freeze({
  PATH: "/usr/bin:/bin:/usr/sbin:/sbin",
  LC_ALL: "C",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_SYSTEM: "/dev/null",
  GIT_NO_REPLACE_OBJECTS: "1",
  GIT_OPTIONAL_LOCKS: "0"
});

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function isDigest(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isGitSha(value) {
  return typeof value === "string" && /^[a-f0-9]{40}$/.test(value);
}

function isCeremonyNonce(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

function recordDigest(record) {
  return sha256(Buffer.from(canonicalize(record), "utf8"));
}

function strictBase64(value, label) {
  assert(typeof value === "string" && /^[A-Za-z0-9+/]+={0,2}$/.test(value), `${label} is not base64`);
  const decoded = Buffer.from(value, "base64");
  assert(decoded.length > 0 && decoded.toString("base64") === value, `${label} is not canonical base64`);
  return decoded;
}

function parseTime(value, label) {
  assert(typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\dZ$/.test(value), `${label} is not canonical UTC RFC3339 at whole-second precision`);
  const milliseconds = Date.parse(value);
  assert(Number.isFinite(milliseconds), `${label} is not a real timestamp`);
  assert(new Date(milliseconds).toISOString().replace(".000Z", "Z") === value, `${label} is not a real calendar timestamp`);
  return milliseconds;
}

function signingMessage(record) {
  assert(record && typeof record === "object" && !Array.isArray(record), "signed record must be an object");
  assert(record.signature && typeof record.signature === "object", `${record.schema_version} signature missing`);
  const expectedDomain = expectedDomains[record.schema_version];
  assert(expectedDomain, `unsupported signed schema_version: ${record.schema_version}`);
  assert(record.signature.domain === expectedDomain, `${record.schema_version} signature domain mismatch`);
  assert(record.signature.payload_profile === PAYLOAD_PROFILE, `${record.schema_version} payload profile mismatch`);
  assert(record.signature.algorithm === "Ed25519", `${record.schema_version} signature algorithm mismatch`);
  const projected = structuredClone(record);
  delete projected.signature.value_base64;
  const prefix = `${record.signature.domain}\n${record.schema_version}\n`;
  return Buffer.concat([Buffer.from(prefix, "utf8"), Buffer.from(canonicalize(projected), "utf8")]);
}

function findKey(trust, keyId, usage, role) {
  const matches = trust.trusted_keys.filter((key) => key.key_id === keyId);
  assert(matches.length === 1, `trusted key ${keyId} missing or duplicated`);
  const key = matches[0];
  assert(key.algorithm === "Ed25519", `trusted key ${keyId} algorithm mismatch`);
  assert(key.usages.includes(usage), `trusted key ${keyId} lacks ${usage} usage`);
  if (role) assert(key.allowed_roles.includes(role), `trusted key ${keyId} lacks ${role} role`);
  return key;
}

function verifySignedRecord(record, trust, usage, role, verificationTime) {
  const key = findKey(trust, record.signature.key_id, usage, role);
  const signedAt = parseTime(record.signature.signed_at, `${record.schema_version}.signature.signed_at`);
  const validFrom = parseTime(key.valid_from, `${key.key_id}.valid_from`);
  const validUntil = parseTime(key.valid_until, `${key.key_id}.valid_until`);
  assert(validFrom <= signedAt && signedAt < validUntil, `${key.key_id} signature time is outside key validity`);
  assert(validFrom <= verificationTime && verificationTime < validUntil, `${key.key_id} is not valid at initial activation verification time`);
  assert(key.revoked_at === null, `${key.key_id} is revoked in the bound trust snapshot`);
  const publicKeyBytes = strictBase64(key.public_key_spki_der_base64, `${key.key_id}.public_key_spki_der_base64`);
  const publicKey = createPublicKey({
    key: publicKeyBytes,
    format: "der",
    type: "spki"
  });
  assert(publicKey.asymmetricKeyType === "ed25519", `${key.key_id} SPKI is not an Ed25519 public key`);
  const signatureBytes = strictBase64(record.signature.value_base64, `${record.schema_version}.signature.value_base64`);
  assert(signatureBytes.length === 64, `${record.schema_version} Ed25519 signature must be exactly 64 bytes`);
  const valid = ed25519Verify(
    null,
    signingMessage(record),
    publicKey,
    signatureBytes
  );
  assert(valid, `${record.schema_version} signature verification failed`);
  return { key, signedAt };
}

function loadRegularBytes(directory, fileName) {
  const absolutePath = resolve(directory, fileName);
  const stat = lstatSync(absolutePath);
  assert(stat.isFile() && !stat.isSymbolicLink(), `${fileName} must be a regular file`);
  const bytes = readFileSync(absolutePath);
  assert(bytes.length > 0, `${fileName} must not be empty`);
  return bytes;
}

function loadBundle(bundleDirectory) {
  const records = {};
  const rawRecords = {};
  for (const [name, fileName] of Object.entries(bundleFiles)) {
    const bytes = loadRegularBytes(bundleDirectory, fileName);
    const record = parseStrictJsonBytes(bytes);
    records[name] = record;
    rawRecords[name] = bytes;
  }
  const captures = {};
  for (const [name, fileName] of Object.entries(captureFiles)) {
    const bytes = loadRegularBytes(bundleDirectory, fileName);
    const parsed = parseStrictJsonBytes(bytes);
    assert(parsed && typeof parsed === "object", `${fileName} must contain a JSON object or array`);
    captures[name] = bytes;
  }
  return { records, rawRecords, captures };
}

function validateBundleRecords(records) {
  const registry = loadSchemaRegistry(schemaDirectory);
  for (const [name, fileName] of Object.entries(bundleFiles)) {
    validateInstance(records[name], schemaIds[name], registry, fileName);
  }
  return registry;
}

function verifyRuntimeBinding(repositoryDirectory, proposalCommitSha) {
  assert(isGitSha(proposalCommitSha), "preflight Approval Target commit SHA is invalid");
  const proposalBytes = readCommitBlob(repositoryDirectory, proposalCommitSha, "governance/r0/r0-gate-definition.proposal.json");
  let proposal;
  try {
    proposal = JSON.parse(proposalBytes.toString("utf8"));
  } catch {
    fail("proposal gate definition cannot be minimally parsed for runtime binding");
  }
  assert(proposal && typeof proposal === "object" && !Array.isArray(proposal), "proposal gate definition is not an object");
  assert(Array.isArray(proposal.gate_assets), "proposal gate assets are missing during runtime binding");
  const paths = proposal.gate_assets.map((asset) => asset?.path);
  assertExactSet(paths, r0GateAssetPaths, "R0 gate asset paths");
  const assets = new Map();
  for (const asset of proposal.gate_assets) {
    assert(asset && typeof asset === "object" && safeManifestPath(asset.path), "proposal contains an invalid gate asset path");
    assert(isDigest(asset.sha256), `proposal gate asset digest is invalid: ${asset.path}`);
    assert(!assets.has(asset.path), `proposal duplicates gate asset: ${asset.path}`);
    const commitBytes = readCommitBlob(repositoryDirectory, proposalCommitSha, asset.path);
    assert(sha256(commitBytes) === asset.sha256, `proposal gate asset differs from its target-commit blob: ${asset.path}`);
    assets.set(asset.path, commitBytes);
  }
  for (const path of activationRuntimeAssetPaths) {
    const executingBytes = loadRegularBytes(runtimeRoot, path);
    assert(executingBytes.equals(assets.get(path)), `executing activation runtime differs from approved target-commit bytes: ${path}`);
  }
}

function assertBindingValidAt(bindingState, instant, label) {
  assert(bindingState.issuedAt <= instant && instant < bindingState.expiresAt, `${label} is outside Actor Binding validity`);
}

function verifyActor(binding, expectedRole, trust, trustDigest, trustActivatedAt, verificationTime) {
  assert(binding.role === expectedRole, `expected ${expectedRole} Actor Binding`);
  assert(binding.trust_policy_digest === trustDigest, `${expectedRole} trust digest mismatch`);
  assert(binding.issuer_key_id === binding.signature.key_id, `${expectedRole} issuer key mismatch`);
  assert(binding.revoked_at === null, `${expectedRole} Actor Binding is revoked`);
  const issuedAt = parseTime(binding.issued_at, `${expectedRole}.issued_at`);
  const expiresAt = parseTime(binding.expires_at, `${expectedRole}.expires_at`);
  assert(trustActivatedAt <= issuedAt && issuedAt < expiresAt, `${expectedRole} Actor Binding time range invalid`);
  assert(issuedAt <= verificationTime && verificationTime < expiresAt, `${expectedRole} Actor Binding is not current for initial activation`);
  const signatureState = verifySignedRecord(binding, trust, "actor_binding", "stable_authority", verificationTime);
  assert(signatureState.signedAt === issuedAt, `${expectedRole} signature time must equal issued_at`);
  assert(signatureState.key.principal_id === trust.root_authority_principal_id, `${expectedRole} Actor Binding was not issued by the genesis root authority`);
  assert(trust.eligible_roles.includes(expectedRole), `${expectedRole} is not eligible`);
  return { binding, digest: recordDigest(binding), issuedAt, expiresAt };
}

function assertIndependent(left, right, label) {
  assert(left.principal_id !== right.principal_id, `${label} must use different principals`);
  assert(left.session_id !== right.session_id, `${label} must use different sessions`);
}

function verifySeparationOfDuty(trust, actorStates) {
  assert(canonicalize(trust.separation_of_duty.identity_basis) === canonicalize(["principal_id", "session_id"]), "separation identity basis mismatch");
  assert(trust.separation_of_duty.independence_rule === "both_principal_id_and_session_id_must_differ", "separation independence rule mismatch");
  assert(trust.separation_of_duty.unique_public_key_material_required === true, "unique public key material rule missing");
  const actors = new Map(Object.values(actorStates).map((state) => [state.binding.role, state.binding]));
  const pairs = trust.separation_of_duty.forbidden_role_pairs_for_one_candidate;
  const requiredPairs = [
    ["stable_authority", "definition_issuer"],
    ["stable_authority", "approver"],
    ["stable_authority", "validator"],
    ["definition_issuer", "approver"],
    ["definition_issuer", "validator"],
    ["approver", "validator"]
  ];
  for (const required of requiredPairs) {
    assert(pairs.some((pair) => pair.includes(required[0]) && pair.includes(required[1])), `trust policy omits required separation pair ${required.join("/")}`);
  }
  for (const [leftRole, rightRole] of pairs) {
    if (actors.has(leftRole) && actors.has(rightRole)) assertIndependent(actors.get(leftRole), actors.get(rightRole), `${leftRole} and ${rightRole}`);
  }
}

function verifyTrust(trust, rootAnchorDigest, verificationTime) {
  assert(trust.status === "ACTIVE" && trust.effective === true && trust.revision === 1, "initial trust policy is not active revision 1");
  assert(Array.isArray(trust.trusted_keys) && trust.trusted_keys.length >= 4, "trust policy does not contain enough isolated ceremony keys");
  assert(new Set(trust.trusted_keys.map((key) => key.key_id)).size === trust.trusted_keys.length, "duplicate trust key ID");
  const keyMaterialDigests = trust.trusted_keys.map((key) => sha256(strictBase64(key.public_key_spki_der_base64, `${key.key_id}.public_key_spki_der_base64`)));
  assert(new Set(keyMaterialDigests).size === keyMaterialDigests.length, "trusted key material is reused across key IDs");
  const signatureState = verifySignedRecord(trust, trust, "root_trust_activation", "stable_authority", verificationTime);
  const proposedAt = parseTime(trust.proposed_at, "trust.proposed_at");
  const activatedAt = parseTime(trust.activated_at, "trust.activated_at");
  assert(proposedAt <= activatedAt, "trust activation predates its proposal");
  assert(signatureState.signedAt === activatedAt, "trust signature time must equal activated_at");
  assert(activatedAt <= verificationTime, "trust activation time is in the future");
  assert(signatureState.key.principal_id === trust.root_authority_principal_id, "root authority principal mismatch");
  const actualAnchor = sha256(strictBase64(signatureState.key.public_key_spki_der_base64, "root public key"));
  assert(actualAnchor === rootAnchorDigest, "active trust root key does not match the out-of-band SPKI SHA-256 anchor");
  return { digest: recordDigest(trust), proposedAt, activatedAt, rootKeySpkiSha256: actualAnchor };
}

function verifyPolicy(policy, expectedSchema, issuerState, trust, trustState, verificationTime) {
  assert(policy.schema_version === expectedSchema, `${expectedSchema} schema mismatch`);
  assert(policy.status === "ACTIVE" && policy.effective === true, `${expectedSchema} is not active`);
  assert(policy.trust_policy_digest === trustState.digest, `${expectedSchema} trust digest mismatch`);
  assert(policy.issuer_actor_binding_digest === issuerState.digest, `${expectedSchema} issuer binding mismatch`);
  const signatureState = verifySignedRecord(policy, trust, "policy", "definition_issuer", verificationTime);
  assert(signatureState.key.principal_id === issuerState.binding.principal_id, `${expectedSchema} signing key principal mismatch`);
  const activatedAt = parseTime(policy.activated_at, `${expectedSchema}.activated_at`);
  assert(signatureState.signedAt === activatedAt, `${expectedSchema} signature time must equal activated_at`);
  assert(activatedAt <= verificationTime, `${expectedSchema} activation time is in the future`);
  assert(trustState.activatedAt <= activatedAt, `${expectedSchema} predates active trust`);
  assertBindingValidAt(issuerState, activatedAt, `${expectedSchema} issuer`);
  return { digest: recordDigest(policy), activatedAt };
}

function canonicalEqual(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function verifyActivatedPolicyLineage(proposal, active, mutableFields, label) {
  const proposedProjection = structuredClone(proposal);
  const activeProjection = structuredClone(active);
  for (const field of mutableFields) {
    delete proposedProjection[field];
    delete activeProjection[field];
  }
  assert(canonicalEqual(proposedProjection, activeProjection), `${label} changed immutable proposal fields during activation`);
}

function verifyContentLineage(proposal, content) {
  assert(proposal.status === "PROPOSED" && proposal.effective === false, "proposal state mismatch");
  assert(content.status === "FROZEN_PENDING_ACTIVATION" && content.effective === false, "governing content state mismatch");
  const stableFields = [
    "definition_id", "revision", "milestone", "execution_class", "provider_credentials",
    "gate_assets", "runner", "commands", "evidence_requirements", "skip_policy",
    "clean_tree_required", "dynamic_external_effects_allowed", "allowed_effects",
    "forbidden_effects", "required_outputs", "forbidden_claims", "activation_requirements"
  ];
  for (const field of stableFields) assert(canonicalEqual(proposal[field], content[field]), `governing content changed approved proposal field ${field}`);
}

function assertExactSet(actual, expected, label) {
  assert(Array.isArray(actual) && actual.length === expected.length, `${label} length mismatch`);
  const actualSet = new Set(actual);
  assert(actualSet.size === actual.length && expected.every((value) => actualSet.has(value)), `${label} set mismatch`);
}

function verifyRulesets(rulesets, label, { adminView }) {
  assert(rulesets.length === 2, `${label} must contain exactly two active rulesets`);
  assert(new Set(rulesets.map((ruleset) => ruleset.ruleset_id)).size === 2, `${label} duplicates a ruleset ID`);
  const branch = rulesets.filter((ruleset) => ruleset.target === "branch");
  const tag = rulesets.filter((ruleset) => ruleset.target === "tag");
  assert(branch.length === 1 && tag.length === 1, `${label} must contain one branch and one tag ruleset`);
  for (const ruleset of rulesets) {
    assert(ruleset.enforcement === "active", `${label} ruleset ${ruleset.ruleset_id} is not active`);
    assert(ruleset.source_type === "Repository" && ruleset.source === `${OWNER_LOGIN}/AIyuehan-workbench`, `${label} ruleset ${ruleset.ruleset_id} source mismatch`);
    assertExactSet(ruleset.exclude_refs, [], `${label} ruleset ${ruleset.ruleset_id} exclude refs`);
    if (adminView) {
      assert(canonicalEqual(ruleset.bypass_actors, [{ actor_id: OWNER_DATABASE_ID, actor_type: "User", bypass_mode: "always" }]), `${label} ruleset ${ruleset.ruleset_id} bypass actors differ from the one stable-authority publisher`);
    } else {
      assert(!Object.hasOwn(ruleset, "bypass_actors"), `${label} pull-only observation must not claim hidden bypass actors`);
    }
  }
  assertExactSet(branch[0].include_refs, ["refs/heads/main", "refs/heads/governance/r0-proposal"], `${label} branch include refs`);
  assertExactSet(branch[0].rules, ["creation", "update", "deletion", "non_fast_forward", "pull_request"], `${label} branch rules`);
  assert(branch[0].ruleset_id === BRANCH_RULESET_ID, `${label} branch ruleset database ID mismatch`);
  assert(branch[0].name === "governance-main-branch", `${label} branch ruleset name mismatch`);
  assert(canonicalEqual(branch[0].pull_request_parameters, BRANCH_PULL_REQUEST_PARAMETERS), `${label} branch pull-request parameters mismatch`);
  assertExactSet(tag[0].include_refs, ["refs/tags/gov0-r0-proposal-v4", GOVERNING_REF], `${label} tag include refs`);
  assertExactSet(tag[0].rules, ["creation", "update", "deletion"], `${label} tag rules`);
  assert(tag[0].ruleset_id === TAG_RULESET_ID, `${label} tag ruleset database ID mismatch`);
  assert(tag[0].name === "governance-r0-tags", `${label} tag ruleset name mismatch`);
  assert(!Object.hasOwn(tag[0], "pull_request_parameters"), `${label} tag ruleset must not contain pull-request parameters`);
}

function normalizedRulesets(rulesets, { includeBypass }) {
  return rulesets
    .map((ruleset) => {
      const normalized = {
        ruleset_id: ruleset.ruleset_id,
        name: ruleset.name,
        target: ruleset.target,
        source_type: ruleset.source_type,
        source: ruleset.source,
        enforcement: ruleset.enforcement,
        include_refs: bytewiseSorted(ruleset.include_refs),
        exclude_refs: bytewiseSorted(ruleset.exclude_refs),
        rules: bytewiseSorted(ruleset.rules)
      };
      if (Object.hasOwn(ruleset, "pull_request_parameters")) normalized.pull_request_parameters = structuredClone(ruleset.pull_request_parameters);
      if (includeBypass) normalized.bypass_actors = structuredClone(ruleset.bypass_actors);
      return normalized;
    })
    .sort((left, right) => Buffer.compare(Buffer.from(left.target, "utf8"), Buffer.from(right.target, "utf8")));
}

function assertPublicRulesetsMatchAdmin(publicRulesets, adminRulesets, label) {
  assert(canonicalEqual(normalizedRulesets(publicRulesets, { includeBypass: false }), normalizedRulesets(adminRulesets, { includeBypass: false })), `${label} public ruleset observation differs from publisher admin evidence`);
}

function verifyRepositoryIdentity(repository, label) {
  assert(repository.owner === OWNER_LOGIN && repository.name === "AIyuehan-workbench", `${label} repository name mismatch`);
  assert(repository.private === false && repository.default_branch === "main", `${label} repository visibility/default mismatch`);
  assert(repository.url === "https://github.com/cindywheele97-art/AIyuehan-workbench", `${label} repository URL mismatch`);
  assert(repository.database_id === REPOSITORY_DATABASE_ID, `${label} repository database ID mismatch`);
}

function manifestRepositoryObservation(repository) {
  assert(repository && typeof repository === "object" && !Array.isArray(repository), "manifest repository identity is missing");
  return {
    database_id: repository.repository_numeric_id,
    owner: repository.owner,
    name: repository.name,
    private: repository.visibility === "private",
    default_branch: repository.default_branch,
    url: repository.expected_url
  };
}

function verifyManifestRepositoryBindings(manifest, records) {
  const manifestRepository = manifestRepositoryObservation(manifest.repository);
  verifyRepositoryIdentity(manifestRepository, "manifest");
  for (const [label, repository] of [
    ["precondition publisher admin evidence", records.preconditionAdmin.repository],
    ["precondition", records.precondition.repository],
    ["publication publisher admin evidence", records.publicationAdmin.repository],
    ["publication", records.publication.repository]
  ]) {
    assert(canonicalEqual(manifestRepository, repository), `${label} repository differs from the payload manifest repository identity`);
  }
  return manifestRepository;
}

function githubPrincipalDatabaseId(principalId, label) {
  assert(typeof principalId === "string", `${label} principal ID is missing`);
  const match = /^github-user:([1-9][0-9]*):([A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)$/.exec(principalId);
  assert(match, `${label} principal ID is not a bound GitHub user identity`);
  const databaseId = Number(match[1]);
  assert(Number.isSafeInteger(databaseId), `${label} GitHub database ID is unsafe`);
  return databaseId;
}

function verifyRemoteAuthorityBindings(record, attestorState, publisherState, label) {
  assert(record.producer_actor_binding_digest === attestorState.digest, `${label} attestor binding mismatch`);
  assert(record.publisher_actor_binding_digest === publisherState.digest, `${label} publisher binding mismatch`);
  assert(record.publisher_github_actor_id === OWNER_DATABASE_ID, `${label} publisher GitHub actor mismatch`);
  assert(publisherState.binding.principal_id === PUBLISHER_PRINCIPAL_ID, `${label} publisher principal is not the fixed repository owner`);
  const attestorDatabaseId = githubPrincipalDatabaseId(attestorState.binding.principal_id, `${label} attestor`);
  assert(attestorDatabaseId === record.attestor_access.github_actor_database_id, `${label} attestor access identity mismatch`);
  assert(attestorDatabaseId !== OWNER_DATABASE_ID, `${label} attestor must not be the repository owner`);
  assert(record.attestor_access.repository_permission === "pull_only", `${label} attestor permission is not pull-only`);
  assert(record.attestor_access.can_push === false, `${label} attestor can push`);
  assert(record.attestor_access.can_administer_rulesets === false, `${label} attestor can administer rulesets`);
}

function verifyPublisherAdminEvidence(record, capture, trust, publisherState, phase, commitSha, treeSha, ceremonyNonce, verificationTime) {
  const label = phase === "PRECONDITION" ? "precondition publisher admin evidence" : "publication publisher admin evidence";
  assert(record.phase === phase, `${label} phase mismatch`);
  verifyRepositoryIdentity(record.repository, label);
  assert(record.proposal_commit_sha === commitSha && record.proposal_tree_sha === treeSha, `${label} proposal identity mismatch`);
  assert(record.ceremony_nonce === ceremonyNonce, `${label} ceremony nonce mismatch`);
  assert(record.governing_ref === GOVERNING_REF, `${label} governing ref mismatch`);
  assert(record.raw_api_capture_sha256 === sha256(capture), `${label} raw API capture digest mismatch`);
  assert(record.producer_actor_binding_digest === publisherState.digest, `${label} publisher binding mismatch`);
  assert(record.publisher_github_actor_id === OWNER_DATABASE_ID, `${label} GitHub publisher mismatch`);
  assert(publisherState.binding.principal_id === PUBLISHER_PRINCIPAL_ID, `${label} publisher principal mismatch`);
  verifyRulesets(record.rulesets, label, { adminView: true });
  if (phase === "PRECONDITION") {
    assert(record.governing_ref_absent === true && !Object.hasOwn(record, "published_tag"), `${label} must prove the governing ref absent`);
  } else {
    assert(record.governing_ref_absent === false && record.published_tag?.ref === GOVERNING_REF, `${label} must bind the published governing tag`);
  }
  const observedAt = parseTime(record.observed_at, `${label}.observed_at`);
  assert(observedAt <= verificationTime, `${label} observation time is in the future`);
  assertBindingValidAt(publisherState, observedAt, label);
  const signatureState = verifySignedRecord(record, trust, "evidence", "stable_authority", verificationTime);
  assert(signatureState.key.principal_id === publisherState.binding.principal_id, `${label} signing principal mismatch`);
  assert(signatureState.signedAt === observedAt, `${label} signature time must equal observed_at`);
  return { digest: recordDigest(record), observedAt };
}

function verifyRemotePrecondition(precondition, captures, trust, attestorState, publisherState, adminRecord, adminState, commitSha, treeSha, verificationTime) {
  verifyRepositoryIdentity(precondition.repository, "precondition");
  assert(canonicalEqual(precondition.repository, adminRecord.repository), "precondition publisher and attestor repository observations differ");
  assert(precondition.proposal_commit_sha === commitSha && precondition.proposal_tree_sha === treeSha, "remote precondition proposal identity mismatch");
  assert(isCeremonyNonce(precondition.ceremony_nonce), "ceremony nonce must be exactly 256-bit unpadded base64url");
  assert(precondition.governing_ref === GOVERNING_REF && precondition.governing_ref_absent === true, "governing ref must be absent before publication");
  assert(precondition.raw_api_capture_sha256 === sha256(captures.precondition), "precondition raw API capture digest mismatch");
  verifyRemoteAuthorityBindings(precondition, attestorState, publisherState, "precondition");
  assert(precondition.bypass_actors_visibility === "OMITTED_NO_WRITE_ACCESS", "precondition bypass visibility mismatch");
  assert(precondition.publisher_admin_evidence_digest === adminState.digest, "precondition publisher admin evidence mismatch");
  assertPublicRulesetsMatchAdmin(precondition.rulesets, adminRecord.rulesets, "precondition");
  verifyRulesets(precondition.rulesets, "precondition", { adminView: false });
  const expectedRefs = ["refs/heads/main", "refs/heads/governance/r0-proposal", "refs/tags/gov0-r0-proposal-v4"];
  assertExactSet(precondition.protected_proposal_refs.map((item) => item.ref), expectedRefs, "precondition protected proposal refs");
  for (const item of precondition.protected_proposal_refs) assert(item.peeled_commit_sha === commitSha, `${item.ref} does not peel to the proposal commit`);
  const observedAt = parseTime(precondition.observed_at, "precondition.observed_at");
  assert(adminState.observedAt <= observedAt && observedAt - adminState.observedAt <= MAX_ADMIN_ATTESTOR_SKEW_MS, "precondition admin and attestor captures are out of order or too far apart");
  assert(observedAt <= verificationTime, "precondition observation time is in the future");
  assertBindingValidAt(attestorState, observedAt, "precondition attestor");
  const signatureState = verifySignedRecord(precondition, trust, "evidence", "validator", verificationTime);
  assert(signatureState.key.principal_id === attestorState.binding.principal_id, "precondition signing principal mismatch");
  assert(signatureState.signedAt === observedAt, "precondition signature time must equal observed_at");
  return { digest: recordDigest(precondition), observedAt };
}

function gitBytes(repositoryDirectory, arguments_) {
  try {
    return execFileSync("/usr/bin/git", ["-C", resolve(repositoryDirectory), ...arguments_], {
      env: gitEnvironment,
      encoding: "buffer",
      maxBuffer: 32 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"]
    });
  } catch {
    fail(`Git verification command failed: git ${arguments_.join(" ")}`);
  }
}

function gitText(repositoryDirectory, arguments_) {
  return gitBytes(repositoryDirectory, arguments_).toString("utf8").replace(/\n$/, "");
}

function safeManifestPath(value) {
  return typeof value === "string" && /^[A-Za-z0-9._/@+-]+$/.test(value) && !value.startsWith("/") && !value.startsWith("-") && !value.split("/").some((part) => part === "" || part === "." || part === "..");
}

function bytewiseSorted(values) {
  return [...values].sort((left, right) => Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8")));
}

function readCommitBlob(repositoryDirectory, commitSha, path) {
  assert(safeManifestPath(path), `unsafe manifest path: ${path}`);
  return gitBytes(repositoryDirectory, ["cat-file", "blob", `${commitSha}:${path}`]);
}

function governingTagMessage(target, approvalDigest, activationDigest) {
  return [
    "AIyuehan-workbench-governing-tag/v1",
    `repository-id: ${target.repository_id}`,
    `ceremony-nonce: ${target.ceremony_nonce}`,
    `proposal-commit: ${target.proposal_commit_sha}`,
    `proposal-tree: ${target.proposal_tree_sha}`,
    `payload-manifest-raw-sha256: ${target.payload_manifest_raw_sha256}`,
    `approval-target-sha256: ${recordDigest(target)}`,
    `approval-record-sha256: ${approvalDigest}`,
    `activation-sha256: ${activationDigest}`,
    ""
  ].join("\n");
}

function parsePublisherTaggerHeader(line) {
  const prefix = `tagger ${PUBLISHER_TAGGER} `;
  assert(typeof line === "string" && line.startsWith(prefix), "governing tagger identity differs from the fixed stable-authority publisher");
  const match = /^([0-9]+) \+0000$/.exec(line.slice(prefix.length));
  assert(match, "governing tagger timestamp or timezone is invalid");
  const seconds = Number(match[1]);
  assert(Number.isSafeInteger(seconds), "governing tagger timestamp is unsafe");
  const milliseconds = seconds * 1000;
  assert(Number.isSafeInteger(milliseconds), "governing tagger time is unsafe");
  return milliseconds;
}

function verifyRepositoryPayload(repositoryDirectory, records, rawRecords, target, approvalDigest, activationDigest, activationAuthorizedAt, verificationTime) {
  assert(gitText(repositoryDirectory, ["rev-parse", "--show-object-format"]) === "sha1", "repository object format must be sha1 for the bound schemas");
  assert(gitText(repositoryDirectory, ["cat-file", "-t", target.proposal_commit_sha]) === "commit", "proposal commit object missing");
  const commitBytes = gitBytes(repositoryDirectory, ["cat-file", "commit", target.proposal_commit_sha]);
  const separatorIndex = commitBytes.indexOf(Buffer.from("\n\n"));
  assert(separatorIndex >= 0, "proposal commit object is malformed");
  const commitHeaders = commitBytes.subarray(0, separatorIndex).toString("utf8").split("\n");
  assert(!commitHeaders.some((line) => line.startsWith("parent ")), "proposal commit is not a root commit");
  assert(gitText(repositoryDirectory, ["show", "-s", "--format=%T", target.proposal_commit_sha]) === target.proposal_tree_sha, "proposal tree SHA mismatch");
  assert(gitText(repositoryDirectory, ["for-each-ref", "--format=%(refname)", "refs/replace"]) === "", "replace refs are forbidden during activation verification");

  const treeRecords = gitBytes(repositoryDirectory, ["ls-tree", "-rz", "--full-tree", target.proposal_commit_sha]).toString("utf8").split("\0").filter(Boolean);
  const tree = new Map();
  for (const line of treeRecords) {
    const match = /^(\d{6}) ([a-z]+) ([a-f0-9]{40})\t(.+)$/.exec(line);
    assert(match, "unparseable Git tree entry");
    const [, mode, type, objectSha, path] = match;
    assert(type === "blob" && (mode === "100644" || mode === "100755"), `forbidden Git object or mode at ${path}`);
    const expectedMode = path.startsWith("governance/tools/") && (path.endsWith(".sh") || path.endsWith(".mjs")) ? "100755" : "100644";
    assert(mode === expectedMode, `Git mode mismatch at ${path}`);
    tree.set(path, { objectSha, mode });
  }

  const entries = records.manifest.entries;
  const entryPaths = entries.map((entry) => entry.path);
  assert(entryPaths.every(safeManifestPath), "manifest contains an unsafe path");
  assert(new Set(entryPaths).size === entryPaths.length, "manifest contains duplicate paths");
  assert(canonicalEqual(entryPaths, bytewiseSorted(entryPaths)), "manifest paths are not bytewise sorted");
  const expectedTreePaths = bytewiseSorted([...entryPaths, "governance/r0/payload-manifest.json"]);
  assert(canonicalEqual(bytewiseSorted([...tree.keys()]), expectedTreePaths), "manifest closed-world path set differs from the proposal Git tree");

  for (const entry of entries) {
    const bytes = readCommitBlob(repositoryDirectory, target.proposal_commit_sha, entry.path);
    assert(bytes.length === entry.bytes, `manifest byte count mismatch at ${entry.path}`);
    assert(sha256(bytes) === entry.sha256, `manifest exact Git blob digest mismatch at ${entry.path}`);
  }
  const manifestBytes = readCommitBlob(repositoryDirectory, target.proposal_commit_sha, "governance/r0/payload-manifest.json");
  assert(manifestBytes.equals(rawRecords.manifest), "detached manifest bytes differ from the proposal Git blob");
  assert(sha256(manifestBytes) === target.payload_manifest_raw_sha256, "target manifest raw SHA-256 mismatch");

  const proposalEntry = entries.filter((entry) => entry.path === "governance/r0/r0-gate-definition.proposal.json");
  assert(proposalEntry.length === 1 && proposalEntry[0].sha256 === sha256(rawRecords.proposal), "detached proposal is not the exact manifest proposal entry");
  assert(readCommitBlob(repositoryDirectory, target.proposal_commit_sha, proposalEntry[0].path).equals(rawRecords.proposal), "detached proposal bytes differ from the proposal Git blob");
  for (const asset of records.content.gate_assets) {
    const matches = entries.filter((entry) => entry.path === asset.path);
    assert(matches.length === 1 && matches[0].sha256 === asset.sha256, `governing gate asset is not bound by the payload manifest: ${asset.path}`);
  }

  const policyProposals = {
    trust: parseStrictJsonBytes(readCommitBlob(repositoryDirectory, target.proposal_commit_sha, "governance/r0/trust-policy.proposal.json")),
    risk: parseStrictJsonBytes(readCommitBlob(repositoryDirectory, target.proposal_commit_sha, "governance/r0/risk-policy.proposal.json")),
    envelope: parseStrictJsonBytes(readCommitBlob(repositoryDirectory, target.proposal_commit_sha, "governance/r0/bootstrap-envelope-policy.proposal.json"))
  };

  const tagObjectSha = gitText(repositoryDirectory, ["rev-parse", `${GOVERNING_REF}^{tag}`]);
  assert(isGitSha(tagObjectSha) && gitText(repositoryDirectory, ["cat-file", "-t", tagObjectSha]) === "tag", "governing ref is not an annotated tag");
  assert(gitText(repositoryDirectory, ["rev-parse", `${GOVERNING_REF}^{commit}`]) === target.proposal_commit_sha, "governing tag does not peel to the proposal commit");
  const tagBytes = gitBytes(repositoryDirectory, ["cat-file", "tag", tagObjectSha]);
  const separator = tagBytes.indexOf(Buffer.from("\n\n"));
  assert(separator >= 0, "governing tag object has no message separator");
  const tagHeaders = tagBytes.subarray(0, separator).toString("utf8").split("\n");
  assert(tagHeaders.filter((line) => line === `object ${target.proposal_commit_sha}`).length === 1, "governing tag does not directly name the proposal commit object");
  assert(tagHeaders.filter((line) => line === "type commit").length === 1, "governing tag does not directly target a commit");
  assert(tagHeaders.filter((line) => line === "tag governance/r0").length === 1, "governing tag object name mismatch");
  const taggerLines = tagHeaders.filter((line) => line.startsWith("tagger "));
  assert(taggerLines.length === 1, "governing tag must contain exactly one tagger header");
  const taggedAt = parsePublisherTaggerHeader(taggerLines[0]);
  assert(activationAuthorizedAt <= taggedAt && taggedAt < parseTime(target.publication_deadline, "target.publication_deadline"), "governing tag creation is outside the authorized publication window");
  assert(taggedAt <= verificationTime, "governing tag creation time is in the future");
  const tagMessage = tagBytes.subarray(separator + 2);
  const expectedMessage = Buffer.from(governingTagMessage(target, approvalDigest, activationDigest), "utf8");
  assert(tagMessage.equals(expectedMessage), "governing tag message does not exactly bind the activation chain");
  return {
    policyProposals,
    tagObjectSha,
    tagMessageSha256: sha256(tagMessage),
    taggedAt
  };
}

function verifyRemotePublication(publication, captures, trust, attestorState, publisherState, adminRecord, adminState, precondition, target, approvalDigest, activationDigest, tagState, activationAuthorizedAt, verificationTime) {
  verifyRepositoryIdentity(publication.repository, "publication");
  assert(canonicalEqual(publication.repository, precondition.repository), "publication repository differs from precondition repository");
  assert(canonicalEqual(publication.repository, adminRecord.repository), "publication publisher and attestor repository observations differ");
  assert(publication.remote_precondition_evidence_digest === recordDigest(precondition), "publication precondition digest mismatch");
  assert(publication.governing_gate_activation_digest === activationDigest, "publication activation digest mismatch");
  assert(publication.approval_target_digest === recordDigest(target), "publication target digest mismatch");
  assert(publication.approval_record_digest === approvalDigest, "publication Approval Record digest mismatch");
  assert(publication.ceremony_nonce === target.ceremony_nonce && publication.activation_sequence === 0, "publication ceremony identity mismatch");
  assert(publication.raw_api_capture_sha256 === sha256(captures.publication), "publication raw API capture digest mismatch");
  verifyRemoteAuthorityBindings(publication, attestorState, publisherState, "publication");
  assert(canonicalEqual(publication.attestor_access, precondition.attestor_access), "publication attestor access differs from precondition access");
  assert(publication.bypass_actors_visibility === "OMITTED_NO_WRITE_ACCESS", "publication bypass visibility mismatch");
  assert(publication.publisher_admin_evidence_digest === adminState.digest, "publication publisher admin evidence mismatch");
  assert(publication.publisher_actor_binding_digest === precondition.publisher_actor_binding_digest, "publication publisher binding differs from precondition publisher binding");
  assert(publication.publisher_github_actor_id === precondition.publisher_github_actor_id, "publication publisher GitHub actor differs from precondition publisher actor");
  assertPublicRulesetsMatchAdmin(publication.rulesets, adminRecord.rulesets, "publication");
  verifyRulesets(publication.rulesets, "publication", { adminView: false });
  assert(publication.published_tag.ref === GOVERNING_REF, "publication governing ref mismatch");
  assert(publication.published_tag.tag_object_sha === tagState.tagObjectSha, "publication tag object SHA mismatch");
  assert(publication.published_tag.peeled_commit_sha === target.proposal_commit_sha, "publication peeled commit mismatch");
  assert(publication.published_tag.peeled_tree_sha === target.proposal_tree_sha, "publication peeled tree mismatch");
  assert(publication.published_tag.tag_message_sha256 === tagState.tagMessageSha256, "publication tag message digest mismatch");
  assert(canonicalEqual(adminRecord.published_tag, publication.published_tag), "publication publisher and attestor tag observations differ");
  const readBackAt = parseTime(publication.read_back_at, "publication.read_back_at");
  assert(activationAuthorizedAt <= readBackAt && readBackAt < parseTime(target.publication_deadline, "target.publication_deadline"), "publication readback is outside the authorized window");
  assert(tagState.taggedAt <= readBackAt, "publication readback predates governing tag creation");
  assert(adminState.observedAt <= readBackAt && readBackAt - adminState.observedAt <= MAX_ADMIN_ATTESTOR_SKEW_MS, "publication admin and attestor captures are out of order or too far apart");
  assert(readBackAt <= verificationTime, "publication readback time is in the future");
  assertBindingValidAt(attestorState, readBackAt, "publication attestor");
  const signatureState = verifySignedRecord(publication, trust, "evidence", "validator", verificationTime);
  assert(signatureState.key.principal_id === attestorState.binding.principal_id, "publication signing principal mismatch");
  assert(signatureState.signedAt === readBackAt, "publication signature time must equal read_back_at");
  return { digest: recordDigest(publication), readBackAt };
}

function verifyBundle(bundleDirectory, repositoryDirectory, rootAnchorDigest) {
  assert(isDigest(rootAnchorDigest), "root-key-spki-sha256 must be exactly 64 lowercase hexadecimal characters");
  const verificationTime = Date.now();
  const { records, rawRecords, captures } = loadBundle(bundleDirectory);
  assert(isGitSha(records.target?.proposal_commit_sha), "Approval Target proposal commit is invalid before runtime binding");
  verifyRuntimeBinding(repositoryDirectory, records.target.proposal_commit_sha);
  const registry = validateBundleRecords(records);

  const trustState = verifyTrust(records.trust, rootAnchorDigest, verificationTime);
  const actorStates = {
    preparer: verifyActor(records.preparer, "stable_authority", records.trust, trustState.digest, trustState.activatedAt, verificationTime),
    approver: verifyActor(records.approver, "approver", records.trust, trustState.digest, trustState.activatedAt, verificationTime),
    issuer: verifyActor(records.issuer, "definition_issuer", records.trust, trustState.digest, trustState.activatedAt, verificationTime),
    attestor: verifyActor(records.attestor, "validator", records.trust, trustState.digest, trustState.activatedAt, verificationTime)
  };
  verifySeparationOfDuty(records.trust, actorStates);
  assert(actorStates.preparer.binding.principal_id === PUBLISHER_PRINCIPAL_ID, "stable-authority publisher principal is not the fixed repository owner");

  const riskState = verifyPolicy(records.risk, "aiyuehan-workbench.external-development-risk-policy/v1", actorStates.issuer, records.trust, trustState, verificationTime);
  const envelopeState = verifyPolicy(records.envelope, "aiyuehan-workbench.bootstrap-envelope-policy/v1", actorStates.issuer, records.trust, trustState, verificationTime);
  verifyContentLineage(records.proposal, records.content);
  assert(records.content.trust_policy_digest === trustState.digest, "governing content trust digest mismatch");
  assert(records.content.risk_policy_digest === riskState.digest, "governing content risk digest mismatch");
  assert(records.content.bootstrap_envelope_policy_digest === envelopeState.digest, "governing content envelope digest mismatch");

  const proposalDigest = recordDigest(records.proposal);
  const contentDigest = recordDigest(records.content);
  const manifestDigest = recordDigest(records.manifest);
  assert(records.manifest.status === "PENDING_FORMAL_APPROVAL" && records.manifest.effective === false, "proposal manifest state mismatch");
  const manifestGeneratedAt = parseTime(records.manifest.generated_at, "manifest.generated_at");
  verifyManifestRepositoryBindings(records.manifest, records);

  const target = records.target;
  assert(target.action === "authorize_governing_gate_publication", "Approval Target action mismatch");
  assert(isGitSha(target.proposal_commit_sha) && isGitSha(target.proposal_tree_sha), "Approval Target Git identity invalid");
  assert(target.payload_manifest_digest === manifestDigest, "Approval Target manifest canonical digest mismatch");
  assert(target.payload_manifest_raw_sha256 === sha256(rawRecords.manifest), "Approval Target manifest raw digest mismatch");
  assert(target.trust_policy_digest === trustState.digest, "Approval Target trust mismatch");
  assert(target.risk_policy_digest === riskState.digest, "Approval Target risk mismatch");
  assert(target.bootstrap_envelope_policy_digest === envelopeState.digest, "Approval Target envelope mismatch");
  assert(target.proposed_gate_definition_digest === proposalDigest, "Approval Target proposal mismatch");
  assert(target.governing_gate_content_digest === contentDigest, "Approval Target governing content mismatch");
  assert(target.gate_assets_digest === recordDigest(records.content.gate_assets), "Approval Target gate-assets mismatch");
  assert(target.preparer_actor_binding_digest === actorStates.preparer.digest, "Approval Target preparer mismatch");
  assert(target.intended_protected_ref === GOVERNING_REF && target.activation_sequence === 0 && target.supersedes_activation_digest === null, "Approval Target genesis publication identity mismatch");
  assert(canonicalEqual(target.authorized_scope, expectedAuthorizedScope), "Approval Target authorized scope differs from the fixed R0 scope");
  assert(canonicalEqual(target.excluded_scope, expectedExcludedScope), "Approval Target excluded scope differs from the fixed R0 exclusions");
  assert(isCeremonyNonce(target.ceremony_nonce), "Approval Target ceremony nonce must be exactly 256-bit unpadded base64url");

  const preconditionAdminState = verifyPublisherAdminEvidence(records.preconditionAdmin, captures.preconditionAdmin, records.trust, actorStates.preparer, "PRECONDITION", target.proposal_commit_sha, target.proposal_tree_sha, target.ceremony_nonce, verificationTime);
  assert(manifestGeneratedAt <= preconditionAdminState.observedAt, "remote protection precondition predates its proposal manifest");
  const preconditionState = verifyRemotePrecondition(records.precondition, captures, records.trust, actorStates.attestor, actorStates.preparer, records.preconditionAdmin, preconditionAdminState, target.proposal_commit_sha, target.proposal_tree_sha, verificationTime);
  assert(target.remote_precondition_evidence_digest === preconditionState.digest, "Approval Target precondition evidence mismatch");
  assert(records.precondition.ceremony_nonce === target.ceremony_nonce, "precondition ceremony nonce mismatch");
  const expectedRepositoryId = `github:${REPOSITORY_DATABASE_ID}:cindywheele97-art/AIyuehan-workbench`;
  assert(target.repository_id === expectedRepositoryId, "Approval Target repository identity mismatch");

  const targetCreatedAt = parseTime(target.created_at, "Approval Target created_at");
  const targetExpiresAt = parseTime(target.expires_at, "Approval Target expires_at");
  const publicationDeadline = parseTime(target.publication_deadline, "Approval Target publication_deadline");
  assert(preconditionState.observedAt <= targetCreatedAt && targetCreatedAt - preconditionState.observedAt <= MAX_PRECONDITION_AGE_MS, "remote precondition is stale or postdates the Approval Target");
  assert(targetCreatedAt < targetExpiresAt && publicationDeadline === targetExpiresAt, "Approval Target expiry/publication deadline mismatch");
  assert(targetExpiresAt - targetCreatedAt <= MAX_CEREMONY_LIFETIME_MS, "Approval Target ceremony lifetime exceeds one hour");
  assert(targetCreatedAt <= verificationTime && verificationTime < publicationDeadline, "initial activation verification is outside the publication window");
  assert(trustState.activatedAt <= targetCreatedAt, "Approval Target predates active trust");
  assert(riskState.activatedAt <= targetCreatedAt, "Approval Target predates active risk policy");
  assert(envelopeState.activatedAt <= targetCreatedAt, "Approval Target predates active bootstrap-envelope policy");
  assert(manifestGeneratedAt <= targetCreatedAt, "Approval Target predates its proposal manifest");
  assertBindingValidAt(actorStates.preparer, targetCreatedAt, "Approval Target preparer");

  const targetDigest = recordDigest(target);
  const approval = records.approval;
  assert(approval.approval_target_digest === targetDigest, "Approval Record target mismatch");
  assert(approval.approver_actor_binding_digest === actorStates.approver.digest, "Approval Record Approver mismatch");
  assert(approval.choice === "approve" && approval.ceremony_nonce === target.ceremony_nonce, "Approval Record choice or nonce mismatch");
  const approvalIssuedAt = parseTime(approval.issued_at, "Approval issued_at");
  assert(targetCreatedAt <= approvalIssuedAt && approvalIssuedAt < publicationDeadline, "Approval is outside target validity");
  assert(approvalIssuedAt <= verificationTime, "Approval time is in the future");
  assertBindingValidAt(actorStates.approver, approvalIssuedAt, "Approver");
  const approvalSignature = verifySignedRecord(approval, records.trust, "approval", "approver", verificationTime);
  assert(approvalSignature.key.principal_id === records.approver.principal_id, "Approval signing principal mismatch");
  assert(approvalSignature.signedAt === approvalIssuedAt, "Approval signature time must equal issued_at");
  const approvalDigest = recordDigest(approval);

  const activation = records.activation;
  assert(activation.status === "AUTHORIZED_PENDING_PUBLICATION" && activation.effective === false, "activation authorization prematurely claims effectiveness");
  assert(activation.governing_gate_content_digest === contentDigest, "activation content mismatch");
  assert(activation.approved_proposal_digest === proposalDigest, "activation proposal mismatch");
  assert(activation.payload_manifest_digest === manifestDigest, "activation manifest mismatch");
  assert(activation.approval_target_digest === targetDigest && activation.approval_record_digest === approvalDigest, "activation approval chain mismatch");
  assert(activation.remote_precondition_evidence_digest === preconditionState.digest, "activation precondition mismatch");
  assert(activation.ceremony_nonce === target.ceremony_nonce, "activation ceremony nonce mismatch");
  assert(activation.issuer_actor_binding_digest === actorStates.issuer.digest, "activation issuer mismatch");
  assert(activation.intended_protected_ref === GOVERNING_REF && activation.activation_sequence === 0 && activation.supersedes_activation_digest === null, "activation genesis identity mismatch");
  assert(activation.publication_deadline === target.publication_deadline, "activation publication deadline mismatch");
  const activationAuthorizedAt = parseTime(activation.authorized_at, "activation.authorized_at");
  assert(approvalIssuedAt <= activationAuthorizedAt && activationAuthorizedAt < publicationDeadline, "activation authorization is outside the Approval window");
  assert(activationAuthorizedAt <= verificationTime, "activation authorization time is in the future");
  assertBindingValidAt(actorStates.issuer, activationAuthorizedAt, "activation issuer");
  const activationSignature = verifySignedRecord(activation, records.trust, "gate_definition", "definition_issuer", verificationTime);
  assert(activationSignature.key.principal_id === records.issuer.principal_id, "activation signing principal mismatch");
  assert(activationSignature.signedAt === activationAuthorizedAt, "activation signature time must equal authorized_at");
  const activationDigest = recordDigest(activation);

  const repositoryState = verifyRepositoryPayload(repositoryDirectory, records, rawRecords, target, approvalDigest, activationDigest, activationAuthorizedAt, verificationTime);
  validateInstance(repositoryState.policyProposals.trust, schemaIds.trust, registry, "Git trust proposal");
  validateInstance(repositoryState.policyProposals.risk, schemaIds.risk, registry, "Git risk proposal");
  validateInstance(repositoryState.policyProposals.envelope, schemaIds.envelope, registry, "Git envelope proposal");
  verifyActivatedPolicyLineage(repositoryState.policyProposals.trust, records.trust, ["status", "effective", "trusted_keys", "activated_at", "root_authority_principal_id", "signature"], "trust policy");
  verifyActivatedPolicyLineage(repositoryState.policyProposals.risk, records.risk, ["status", "effective", "trust_policy_digest", "issuer_actor_binding_digest", "activated_at", "signature"], "risk policy");
  verifyActivatedPolicyLineage(repositoryState.policyProposals.envelope, records.envelope, ["status", "effective", "trust_policy_digest", "issuer_actor_binding_digest", "activated_at", "signature"], "bootstrap-envelope policy");

  const publicationAdminState = verifyPublisherAdminEvidence(records.publicationAdmin, captures.publicationAdmin, records.trust, actorStates.preparer, "POST_PUBLICATION", target.proposal_commit_sha, target.proposal_tree_sha, target.ceremony_nonce, verificationTime);
  assert(canonicalEqual(normalizedRulesets(records.preconditionAdmin.rulesets, { includeBypass: true }), normalizedRulesets(records.publicationAdmin.rulesets, { includeBypass: true })), "publisher admin rulesets changed during the activation ceremony");
  assert(canonicalEqual(records.publicationAdmin.repository, records.preconditionAdmin.repository), "publisher admin repository changed during the activation ceremony");
  assert(canonicalEqual(records.publicationAdmin.published_tag, {
    ref: GOVERNING_REF,
    tag_object_sha: repositoryState.tagObjectSha,
    peeled_commit_sha: target.proposal_commit_sha,
    peeled_tree_sha: target.proposal_tree_sha,
    tag_message_sha256: repositoryState.tagMessageSha256
  }), "publisher admin publication tag differs from the exact Git tag object");
  assert(activationAuthorizedAt <= publicationAdminState.observedAt && publicationAdminState.observedAt < publicationDeadline, "publisher admin publication evidence is outside the authorized window");
  assert(repositoryState.taggedAt <= publicationAdminState.observedAt, "publisher admin publication evidence predates governing tag creation");
  const publicationState = verifyRemotePublication(records.publication, captures, records.trust, actorStates.attestor, actorStates.preparer, records.publicationAdmin, publicationAdminState, records.precondition, target, approvalDigest, activationDigest, repositoryState, activationAuthorizedAt, verificationTime);

  return {
    status: "GOVERNING_GATE_ACTIVE",
    effective_derived_from_complete_publication_chain: true,
    activation_record_status: activation.status,
    initial_activation_verification_time: new Date(verificationTime).toISOString(),
    repository: target.repository_id,
    proposal_commit_sha: target.proposal_commit_sha,
    proposal_tree_sha: target.proposal_tree_sha,
    payload_manifest_digest: manifestDigest,
    payload_manifest_raw_sha256: target.payload_manifest_raw_sha256,
    governing_gate_content_digest: contentDigest,
    approval_target_digest: targetDigest,
    approval_record_digest: approvalDigest,
    activation_digest: activationDigest,
    precondition_publisher_admin_evidence_digest: preconditionAdminState.digest,
    publication_publisher_admin_evidence_digest: publicationAdminState.digest,
    publication_evidence_digest: publicationState.digest,
    governing_tag_object_sha: repositoryState.tagObjectSha,
    governing_ref: GOVERNING_REF,
    root_key_spki_sha256: trustState.rootKeySpkiSha256
  };
}

function selfTest() {
  loadSchemaRegistry(schemaDirectory);
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const record = {
    schema_version: "aiyuehan-workbench.external-governance-approval-record/v1",
    approval_id: "self-test",
    signature: {
      domain: "aiyuehan-workbench:approval-record:v1",
      payload_profile: PAYLOAD_PROFILE,
      algorithm: "Ed25519",
      key_id: "self-test-key",
      signed_at: "2026-08-29T00:00:00Z",
      value_base64: "AA=="
    }
  };
  const message = signingMessage(record);
  const signature = ed25519Sign(null, message, privateKey);
  assert(ed25519Verify(null, message, publicKey, signature), "Ed25519 positive self-test failed");
  record.approval_id = "mutated";
  assert(!ed25519Verify(null, signingMessage(record), publicKey, signature), "Ed25519 mutation self-test failed");
  assert(parseTime("2026-08-29T00:00:00Z", "self-test") === 1787961600000, "strict timestamp positive self-test failed");
  let rejected = false;
  try { parseTime("2026-08-29 00:00:00", "self-test"); } catch { rejected = true; }
  assert(rejected, "non-RFC3339 timestamp negative self-test failed");
  assert(parsePublisherTaggerHeader(`tagger ${PUBLISHER_TAGGER} 1787961600 +0000`) === 1787961600000, "publisher tagger positive self-test failed");
  rejected = false;
  try { parsePublisherTaggerHeader(`tagger ${PUBLISHER_TAGGER} 1787961600 -0700`); } catch { rejected = true; }
  assert(rejected, "publisher tagger timezone negative self-test failed");

  const repository = {
    database_id: REPOSITORY_DATABASE_ID,
    owner: OWNER_LOGIN,
    name: "AIyuehan-workbench",
    private: false,
    default_branch: "main",
    url: "https://github.com/cindywheele97-art/AIyuehan-workbench"
  };
  const manifest = {
    repository: {
      owner: OWNER_LOGIN,
      name: "AIyuehan-workbench",
      visibility: "public",
      expected_url: "https://github.com/cindywheele97-art/AIyuehan-workbench",
      remote_state: "PUBLIC_PROTECTED_GOVERNANCE_PROPOSAL",
      repository_numeric_id: REPOSITORY_DATABASE_ID,
      default_branch: "main"
    }
  };
  const rulesets = [
    {
      ruleset_id: BRANCH_RULESET_ID,
      name: "governance-main-branch",
      target: "branch",
      source_type: "Repository",
      source: `${OWNER_LOGIN}/AIyuehan-workbench`,
      enforcement: "active",
      include_refs: ["refs/heads/main", "refs/heads/governance/r0-proposal"],
      exclude_refs: [],
      rules: ["creation", "update", "deletion", "non_fast_forward", "pull_request"],
      pull_request_parameters: structuredClone(BRANCH_PULL_REQUEST_PARAMETERS)
    },
    {
      ruleset_id: TAG_RULESET_ID,
      name: "governance-r0-tags",
      target: "tag",
      source_type: "Repository",
      source: `${OWNER_LOGIN}/AIyuehan-workbench`,
      enforcement: "active",
      include_refs: ["refs/tags/gov0-r0-proposal-v4", GOVERNING_REF],
      exclude_refs: [],
      rules: ["creation", "update", "deletion"]
    }
  ];
  const repositoryRecords = {
    preconditionAdmin: { repository: structuredClone(repository) },
    precondition: { repository: structuredClone(repository) },
    publicationAdmin: { repository: structuredClone(repository) },
    publication: { repository: structuredClone(repository) }
  };
  verifyRepositoryIdentity(repository, "self-test repository");
  verifyManifestRepositoryBindings(manifest, repositoryRecords);
  verifyRulesets(rulesets, "self-test rulesets", { adminView: false });

  const expectRejected = (operation, label) => {
    let mutationRejected = false;
    try { operation(); } catch { mutationRejected = true; }
    assert(mutationRejected, `${label} negative self-test failed`);
  };
  expectRejected(() => verifyRepositoryIdentity({ ...repository, database_id: REPOSITORY_DATABASE_ID + 1 }, "mutated repository"), "repository database ID mutation");
  expectRejected(() => {
    const mutated = structuredClone(rulesets);
    mutated[0].ruleset_id = BRANCH_RULESET_ID + 1;
    verifyRulesets(mutated, "mutated branch ruleset", { adminView: false });
  }, "branch ruleset ID mutation");
  expectRejected(() => {
    const mutated = structuredClone(rulesets);
    mutated[1].ruleset_id = TAG_RULESET_ID + 1;
    verifyRulesets(mutated, "mutated tag ruleset", { adminView: false });
  }, "tag ruleset ID mutation");
  expectRejected(() => {
    const mutated = structuredClone(rulesets);
    mutated[0].name = "renamed-branch-ruleset";
    verifyRulesets(mutated, "mutated branch ruleset name", { adminView: false });
  }, "ruleset name mutation");
  expectRejected(() => {
    const mutated = structuredClone(rulesets);
    mutated[0].pull_request_parameters.required_approving_review_count = 0;
    verifyRulesets(mutated, "mutated pull-request parameters", { adminView: false });
  }, "pull-request parameter mutation");
  expectRejected(() => {
    const mutatedRecords = structuredClone(repositoryRecords);
    mutatedRecords.publication.repository.database_id = REPOSITORY_DATABASE_ID + 1;
    verifyManifestRepositoryBindings(manifest, mutatedRecords);
  }, "manifest/publication repository mapping mutation");
  process.stdout.write("ACTIVATION VERIFIER SELF-TEST PASS\n");
}

function parseArguments(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!["--bundle", "--repository", "--root-key-spki-sha256"].includes(argument)) fail(`unknown argument: ${argument}`);
    assert(index + 1 < argv.length, `missing value for ${argument}`);
    assert(result[argument] === undefined, `duplicate argument: ${argument}`);
    result[argument] = argv[++index];
  }
  for (const required of ["--bundle", "--repository", "--root-key-spki-sha256"]) assert(result[required], `missing required argument: ${required}`);
  return result;
}

try {
  if (process.argv.length === 3 && process.argv[2] === "--self-test") {
    selfTest();
  } else {
    const arguments_ = parseArguments(process.argv.slice(2));
    const result = verifyBundle(arguments_["--bundle"], arguments_["--repository"], arguments_["--root-key-spki-sha256"]);
    process.stdout.write(`${JSON.stringify(result)}\n`);
  }
} catch (error) {
  process.stderr.write(`ACTIVATION VERIFY FAIL: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
