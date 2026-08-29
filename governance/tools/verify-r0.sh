#!/usr/bin/env bash

set -euo pipefail

mode="${1:-proposal}"
case "$mode" in
  pre-manifest|proposal|sealed) ;;
  *)
    echo "usage: governance/tools/verify-r0.sh [pre-manifest|proposal|sealed]" >&2
    exit 2
    ;;
esac

export PATH="/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin"
export LC_ALL=C
export GIT_CONFIG_GLOBAL=/dev/null
export GIT_CONFIG_SYSTEM=/dev/null
export GIT_NO_REPLACE_OBJECTS=1
export GIT_OPTIONAL_LOCKS=0
export GIT_CONFIG_COUNT=3
export GIT_CONFIG_KEY_0=core.fsmonitor
export GIT_CONFIG_VALUE_0=false
export GIT_CONFIG_KEY_1=core.hooksPath
export GIT_CONFIG_VALUE_1=/dev/null
export GIT_CONFIG_KEY_2=core.fileMode
export GIT_CONFIG_VALUE_2=true
unset BASH_ENV ENV NODE_OPTIONS NODE_PATH GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_OBJECT_DIRECTORY GIT_ALTERNATE_OBJECT_DIRECTORIES

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

temp_dir="$(mktemp -d)"
trap 'rm -rf "$temp_dir"' EXIT

fail() {
  echo "R0 VERIFY FAIL: $*" >&2
  exit 1
}

safe_repo_path() {
  local candidate="$1"
  [[ -n "$candidate" && "$candidate" != /* && "$candidate" != -* ]] || fail "unsafe repository path: $candidate"
  printf '%s' "$candidate" | grep -Eq '^[A-Za-z0-9._/@+-]+$' || fail "repository path contains forbidden bytes: $candidate"
  case "/$candidate/" in
    *'//'*|*'/./'*|*'/../'*) fail "repository path contains unsafe segment: $candidate" ;;
  esac
}

require_regular_file() {
  safe_repo_path "$1"
  [[ -f "./$1" && ! -L "./$1" ]] || fail "required regular file missing: $1"
}

sha256_file() {
  safe_repo_path "$1"
  shasum -a 256 "./$1" | awk '{print $1}'
}

canonical_sha256() {
  safe_repo_path "$1"
  /opt/homebrew/bin/node governance/tools/canonical-json.mjs "./$1" | shasum -a 256 | awk '{print $1}'
}

gate_semantic_projection_sha256() {
  safe_repo_path "$1"
  /opt/homebrew/bin/node --input-type=module -e '
    import { createHash } from "node:crypto";
    import { readFileSync } from "node:fs";
    import { canonicalize, parseStrictJsonBytes } from "./governance/tools/canonical-json.mjs";
    const record = parseStrictJsonBytes(readFileSync(process.argv[1]));
    for (const asset of record.gate_assets) {
      if (asset.path === "governance/tools/verify-r0.sh") delete asset.sha256;
    }
    process.stdout.write(createHash("sha256").update(canonicalize(record)).digest("hex"));
  ' "./$1"
}

for executable in /bin/bash /bin/mv /usr/bin/awk /usr/bin/cmp /usr/bin/diff /usr/bin/env /usr/bin/find /usr/bin/git /usr/bin/grep /usr/bin/jq /usr/bin/mktemp /opt/homebrew/bin/node /usr/bin/ruby /usr/bin/sed /usr/bin/shasum /usr/bin/sort /usr/bin/stat /usr/bin/tr /usr/bin/wc /usr/bin/xargs; do
  [[ -x "$executable" ]] || fail "required trusted executable missing: $executable"
done

[[ "$(/bin/bash --version | /usr/bin/sed -n '1p')" == "GNU bash, version 3.2.57(1)-release (arm64-apple-darwin24)" ]] || fail "bash version drift"
[[ "$(/usr/bin/git --version)" == "git version 2.39.5 (Apple Git-154)" ]] || fail "git version drift"
[[ "$(/usr/bin/jq --version)" == "jq-1.7.1-apple" ]] || fail "jq version drift"
[[ "$(/opt/homebrew/bin/node --version)" == "v26.7.0" ]] || fail "node version drift"
[[ "$(/usr/bin/shasum --version 2>&1 | /usr/bin/sed -n '1p')" == "6.02" ]] || fail "shasum version drift"

required_files=(
  .github/CODEOWNERS
  .gitignore
  CONTEXT.md
  README.md
  docs/adr/0001-workbench-authority-external-platform-projection.md
  docs/adr/0002-gate-authority-owns-stage-promotion.md
  docs/adr/0003-separate-projection-execution-and-effect-lifecycle.md
  docs/adr/0004-execution-grant-precedes-real-execution.md
  docs/adr/0005-shared-kernel-isolated-customer-instances.md
  docs/adr/0006-governing-gate-definition-precedes-candidate.md
  docs/adr/0007-deployment-instance-contains-workspaces.md
  docs/adr/0008-two-phase-governing-tag-publication.md
  governance/README.md
  governance/authorizations/R0-AIYUEHAN-NAMESPACE-AUTHORIZATION.json
  governance/authorizations/R0-PUBLIC-CONTINUATION-AUTHORIZATION.json
  governance/build/BUILD-LOG-EVIDENCE-INDEX.json
  governance/build/BUILD-LOG.ndjson
  governance/evidence/EXTERNAL-LINEAGE.md
  governance/evidence/EXTERNAL-SOURCE-DIGESTS.sha256
  governance/evidence/GITHUB-PUBLIC-PROTECTION-ADMIN-READBACK-AIYUEHAN.md
  governance/evidence/THIRD-PARTY-CODE-EXCLUSION.md
  governance/evidence/history/sequence-0001/088cf8d37397d5d29443511f779217148745e329d102adf6a05c20a2a2c0a524.snapshot
  governance/evidence/history/sequence-0001/92d13fa5ec959e0a7b810b03e0373f4caebe1b85ce95f609e60384cdf5dfef16.snapshot
  governance/evidence/history/sequence-0001/93c71bcc10bb3752dbea766861a67707325ea2f9a63338a9fbc8384ba3cf7841.snapshot
  governance/evidence/history/sequence-0001/cb018f0db7097bed13fe2f61ad2607709b7413d8bfbdfaf2347dabfdfdae345f.snapshot
  governance/evidence/history/sequence-0001/ec3febc9639cebfb69dbc4fb3cd0a4645c750e5b6f870319251d007126ce5d0f.snapshot
  governance/r0/STATUS.md
  governance/r0/bootstrap-envelope-policy.proposal.json
  governance/r0/identity-boundary-policy.proposal.json
  governance/r0/m-1-gate-definition.proposal.json
  governance/r0/r0-gate-definition.proposal.json
  governance/r0/ref-protection-intent.json
  governance/r0/risk-policy.proposal.json
  governance/r0/trust-policy.proposal.json
  governance/schemas/actor-binding.schema.json
  governance/schemas/approval-record.schema.json
  governance/schemas/approval-target.schema.json
  governance/schemas/bootstrap-envelope-policy.schema.json
  governance/schemas/bootstrap-envelope.schema.json
  governance/schemas/build-log-evidence-index.schema.json
  governance/schemas/build-log-entry.schema.json
  governance/schemas/common.schema.json
  governance/schemas/evidence.schema.json
  governance/schemas/gate-run-manifest.schema.json
  governance/schemas/governing-gate-activation.schema.json
  governance/schemas/governing-gate-content.schema.json
  governance/schemas/identity-boundary-policy.schema.json
  governance/schemas/namespace-isolation-authorization.schema.json
  governance/schemas/payload-manifest.schema.json
  governance/schemas/preparation-authorization.schema.json
  governance/schemas/proposed-gate-definition.schema.json
  governance/schemas/ref-protection-intent.schema.json
  governance/schemas/remote-protection-evidence.schema.json
  governance/schemas/remote-publication-evidence.schema.json
  governance/schemas/remote-ruleset-admin-evidence.schema.json
  governance/schemas/repository-continuation-authorization.schema.json
  governance/schemas/review-verdict.schema.json
  governance/schemas/risk-policy.schema.json
  governance/schemas/trust-policy.schema.json
  governance/schemas/validation-verdict.schema.json
  governance/tools/canonical-json.mjs
  governance/tools/validate-json-schema.mjs
  governance/tools/verify-activation.mjs
  governance/tools/verify-identity-boundary.mjs
  governance/tools/verify-m1-static.sh
  governance/tools/verify-r0.sh
  AIyuehan-workbench-architecture-and-development-plan-v1.2.md
)

for required in "${required_files[@]}"; do
  require_regular_file "$required"
done

non_regular="$(find . -path ./.git -prune -o ! -type d ! -type f -print | sed -n '1p')"
[[ -z "$non_regular" ]] || fail "non-regular filesystem entry is forbidden: ${non_regular#./}"

printf '%s\n' "${required_files[@]}" | sort > "$temp_dir/expected-files"
if [[ "$mode" != "pre-manifest" ]]; then
  printf '%s\n' governance/r0/payload-manifest.json >> "$temp_dir/expected-files"
  sort "$temp_dir/expected-files" > "$temp_dir/expected-files-sorted"
  /bin/mv "$temp_dir/expected-files-sorted" "$temp_dir/expected-files"
fi
find . -path ./.git -prune -o -type f -print | sed 's#^./##' | sort > "$temp_dir/actual-files"
cmp -s "$temp_dir/expected-files" "$temp_dir/actual-files" || {
  echo "R0 closed file set mismatch:" >&2
  diff -u "$temp_dir/expected-files" "$temp_dir/actual-files" >&2 || true
  fail "only the exact governance/design file allowlist is permitted"
}

while IFS= read -r json_file; do
  /opt/homebrew/bin/node governance/tools/canonical-json.mjs "./$json_file" >/dev/null || fail "strict JSON or canonicalization failed: $json_file"
  /usr/bin/jq -e . "./$json_file" >/dev/null || fail "JSON parse failed: $json_file"
done < <(find governance -type f -name '*.json' | sed 's#^./##' | sort)

while IFS= read -r schema_file; do
  /usr/bin/jq -e '
    .["$schema"] == "https://json-schema.org/draft/2020-12/schema" and
    ((.["$id"] | type) == "string") and
    (.["$id"] | startswith("urn:aiyuehan-workbench:schema:"))
  ' "$schema_file" >/dev/null || fail "schema declaration invalid: $schema_file"
  while IFS= read -r schema_ref; do
    case "$schema_ref" in
      \#/*|urn:aiyuehan-workbench:schema:*) ;;
      *) fail "schema uses unresolved relative or external ref in $schema_file: $schema_ref" ;;
    esac
  done < <(/usr/bin/jq -r '.. | objects | .["$ref"]? // empty' "$schema_file")
done < <(find governance/schemas -type f -name '*.json' | sort)

find governance/schemas -type f -name '*.json' -print0 | /usr/bin/xargs -0 /usr/bin/jq -r '.["$id"]' | sort -u > "$temp_dir/schema-ids"
while IFS= read -r schema_ref; do
  case "$schema_ref" in
    \#/*) ;;
    urn:aiyuehan-workbench:schema:*)
      schema_ref_base="${schema_ref%%#*}"
      /usr/bin/grep -Fxq "$schema_ref_base" "$temp_dir/schema-ids" || fail "schema ref has no registered local schema: $schema_ref"
      ;;
  esac
done < <(find governance/schemas -type f -name '*.json' -print0 | /usr/bin/xargs -0 /usr/bin/jq -r '.. | objects | .["$ref"]? // empty')

validate_schema_instance() {
  local schema_id="$1"
  local instance_path="$2"
  shift 2
  /opt/homebrew/bin/node governance/tools/validate-json-schema.mjs \
    --schemas governance/schemas \
    --schema "$schema_id" \
    --instance "$instance_path" "$@" >/dev/null || fail "JSON Schema validation failed: $instance_path"
}

expect_schema_rejection() {
  local schema_id="$1"
  local instance_path="$2"
  local label="$3"
  if /opt/homebrew/bin/node governance/tools/validate-json-schema.mjs \
    --schemas governance/schemas \
    --schema "$schema_id" \
    --instance "$instance_path" >/dev/null 2>&1; then
    fail "JSON Schema negative test accepted forbidden mutation: $label"
  fi
}

validate_schema_instance urn:aiyuehan-workbench:schema:namespace-isolation-authorization:v1 governance/authorizations/R0-AIYUEHAN-NAMESPACE-AUTHORIZATION.json
validate_schema_instance urn:aiyuehan-workbench:schema:repository-continuation-authorization:v1 governance/authorizations/R0-PUBLIC-CONTINUATION-AUTHORIZATION.json
validate_schema_instance urn:aiyuehan-workbench:schema:build-log-evidence-index:v1 governance/build/BUILD-LOG-EVIDENCE-INDEX.json
validate_schema_instance urn:aiyuehan-workbench:schema:identity-boundary-policy:v1 governance/r0/identity-boundary-policy.proposal.json
validate_schema_instance urn:aiyuehan-workbench:schema:external-governance-trust-policy:v1 governance/r0/trust-policy.proposal.json
validate_schema_instance urn:aiyuehan-workbench:schema:external-development-risk-policy:v1 governance/r0/risk-policy.proposal.json
validate_schema_instance urn:aiyuehan-workbench:schema:bootstrap-envelope-policy:v1 governance/r0/bootstrap-envelope-policy.proposal.json
validate_schema_instance urn:aiyuehan-workbench:schema:proposed-gate-definition:v1 governance/r0/r0-gate-definition.proposal.json
validate_schema_instance urn:aiyuehan-workbench:schema:proposed-gate-definition:v1 governance/r0/m-1-gate-definition.proposal.json
validate_schema_instance urn:aiyuehan-workbench:schema:ref-protection-intent:v1 governance/r0/ref-protection-intent.json

/usr/bin/jq '.visibility = "private"' governance/r0/ref-protection-intent.json > "$temp_dir/ref-intent-private.json"
expect_schema_rejection urn:aiyuehan-workbench:schema:ref-protection-intent:v1 "$temp_dir/ref-intent-private.json" "private ref-protection intent"
/usr/bin/jq '(.rulesets[] | select(.target == "tag") | .include_refs[0]) = "refs/tags/gov0-r0-proposal-v3"' governance/r0/ref-protection-intent.json > "$temp_dir/ref-intent-v3.json"
expect_schema_rejection urn:aiyuehan-workbench:schema:ref-protection-intent:v1 "$temp_dir/ref-intent-v3.json" "v3 proposal ref"
/usr/bin/jq '.repository_numeric_id = 1' governance/r0/ref-protection-intent.json > "$temp_dir/ref-intent-repository-id.json"
expect_schema_rejection urn:aiyuehan-workbench:schema:ref-protection-intent:v1 "$temp_dir/ref-intent-repository-id.json" "wrong repository database ID"
/usr/bin/jq '(.rulesets[] | select(.target == "branch") | .ruleset_id) = 1' governance/r0/ref-protection-intent.json > "$temp_dir/ref-intent-ruleset-id.json"
expect_schema_rejection urn:aiyuehan-workbench:schema:ref-protection-intent:v1 "$temp_dir/ref-intent-ruleset-id.json" "wrong branch ruleset database ID"
/usr/bin/jq '(.rulesets[] | select(.target == "branch") | .pull_request_parameters.required_approving_review_count) = 0' governance/r0/ref-protection-intent.json > "$temp_dir/ref-intent-pr-parameters.json"
expect_schema_rejection urn:aiyuehan-workbench:schema:ref-protection-intent:v1 "$temp_dir/ref-intent-pr-parameters.json" "wrong pull-request parameters"

for remote_schema in governance/schemas/remote-protection-evidence.schema.json governance/schemas/remote-publication-evidence.schema.json governance/schemas/remote-ruleset-admin-evidence.schema.json; do
  /usr/bin/jq -e '
    .["$defs"].repository.properties.database_id.const == 1350747678 and
    .["$defs"].repository.properties.private.const == false and
    .["$defs"].ruleset.allOf[0].then.properties.ruleset_id.const == 21811138 and
    .["$defs"].ruleset.allOf[0].then.properties.name.const == "governance-main-branch" and
    (.["$defs"].ruleset.allOf[0].then.required | index("pull_request_parameters") != null) and
    .["$defs"].pull_request_parameters.properties.required_approving_review_count.const == 1 and
    .["$defs"].ruleset.allOf[0].else.properties.ruleset_id.const == 21811141 and
    .["$defs"].ruleset.allOf[0].else.properties.name.const == "governance-r0-tags" and
    .["$defs"].ruleset.allOf[0].else.properties.pull_request_parameters == false
  ' "$remote_schema" >/dev/null || fail "remote evidence schema does not bind the exact public repository and rulesets: $remote_schema"
  /usr/bin/grep -q 'refs/tags/gov0-r0-proposal-v4' "$remote_schema" || fail "remote evidence schema does not bind the v4 proposal ref: $remote_schema"
  if /usr/bin/grep -q 'refs/tags/gov0-r0-proposal-v3' "$remote_schema"; then
    fail "remote evidence schema still permits the v3 proposal ref: $remote_schema"
  fi
done

/opt/homebrew/bin/node --input-type=module -e '
  import { readFileSync } from "node:fs";
  import { parseStrictJsonBytes } from "./governance/tools/canonical-json.mjs";
  const bytes = readFileSync(process.argv[1]);
  if (bytes.length === 0 || bytes[bytes.length - 1] !== 0x0a) throw new Error("BUILD-LOG must end with LF");
  const lines = bytes.subarray(0, bytes.length - 1).toString("utf8").split("\n");
  if (lines.some((line) => line.length === 0)) throw new Error("BUILD-LOG contains a blank line");
  for (const line of lines) parseStrictJsonBytes(Buffer.from(line, "utf8"));
' governance/build/BUILD-LOG.ndjson || fail "BUILD-LOG strict NDJSON validation failed"

validate_schema_instance urn:aiyuehan-workbench:schema:build-log-entry:v1 governance/build/BUILD-LOG.ndjson --ndjson

[[ "$(/usr/bin/sed -n '1p' governance/build/BUILD-LOG.ndjson | /usr/bin/shasum -a 256 | /usr/bin/awk '{print $1}')" == "7032a4c1cd9dea800cece5d9799faa78708f68ed332bbdf9cc58497f9b699ea0" ]] || fail "BUILD-LOG sequence 1 bytes changed"
[[ "$(/usr/bin/sed -n '2p' governance/build/BUILD-LOG.ndjson | /usr/bin/shasum -a 256 | /usr/bin/awk '{print $1}')" == "045b3317167c8070cdfe01cf9e692e933e1a1c9452ee5a87f94ac94039e1ece3" ]] || fail "BUILD-LOG sequence 2 bytes changed"
[[ "$(sha256_file governance/build/BUILD-LOG.ndjson)" == "0be07a69f03dc6deef6fe2fac9524bba1af393c81c38130ca19dfe71ee00a3cd" ]] || fail "BUILD-LOG bytes differ from the reviewed three-event history"

/usr/bin/jq -s -e '
  length == 3 and
  (map(.sequence) == [1,2,3]) and
  .[0].schema_version == "aiyuehan-workbench.build-log-entry/v1" and
  .[0].sequence == 1 and
  .[0].actor_role == "conductor" and
  .[0].event == "GOV0_R0_AIYUEHAN_NAMESPACE_AUTHORIZED" and
  .[0].subject == "cindywheele97-art/AIyuehan-workbench" and
  .[0].state.gov0_r0 == "RESEALING_NAMESPACE_ISOLATED_PROPOSAL" and
  .[0].state.formal_approval == "PENDING_EXACT_DIGEST" and
  .[0].state.effective == false and
  .[0].state.identity_boundary == "AIYUEHAN_ONLY" and
  .[0].state.predecessor_commit_sha1 == "e1b461f6db5b58e4c3b5b8eef37d4316f27ef2d1" and
  .[0].state.predecessor_archive_sha256 == "096478a6f0213804a8ba67c29c1c58334809f971edf524f2579a90939934aa76" and
  .[0].state.m_minus_1 == "NOT_STARTED_NOT_AUTHORIZED" and
  .[0].state.m0 == "NOT_STARTED_NOT_AUTHORIZED" and
  .[0].state.private_remote == "NOT_CREATED" and
  .[0].state.remote_protection == "BLOCKED_PROTECTION_ENTITLEMENT" and
  .[1] == {
    schema_version:"aiyuehan-workbench.build-log-entry/v1",
    sequence:2,
    recorded_at:"2026-08-29T16:59:05Z",
    actor_role:"conductor",
    event:"GOV0_R0_PUBLIC_RULESETS_ACTIVE",
    subject:"cindywheele97-art/AIyuehan-workbench",
    state:{
      gov0_r0:"PUBLIC_PROTECTED_PROPOSAL_V4_PREPARATION",
      formal_approval:"PENDING_EXACT_DIGEST",
      effective:false,
      repository_visibility:"PUBLIC",
      repository_numeric_id:1350747678,
      proposal_refs:"UNPUBLISHED",
      branch_ruleset_id:21811138,
      tag_ruleset_id:21811141,
      admin_readback:"OBSERVED_NOT_SIGNED",
      independent_attestor:"ABSENT_REQUIRED",
      m_minus_1:"NOT_STARTED_NOT_AUTHORIZED",
      m0:"NOT_STARTED_NOT_AUTHORIZED"
    },
    evidence:[
      "governance/authorizations/R0-PUBLIC-CONTINUATION-AUTHORIZATION.json",
      "governance/evidence/GITHUB-PUBLIC-PROTECTION-ADMIN-READBACK-AIYUEHAN.md",
      "governance/r0/STATUS.md",
      "governance/r0/ref-protection-intent.json"
    ],
    claims_excluded:[
      "formal approval",
      "signed publisher evidence",
      "independent pull-only attestor evidence",
      "governing gate activation",
      "M-1 start",
      "M0 start",
      "product implementation",
      "installation authentication or deployment"
    ]
  } and
  .[2] == {
    schema_version:"aiyuehan-workbench.build-log-entry/v1",
    sequence:3,
    recorded_at:"2026-08-29T17:26:15Z",
    actor_role:"conductor",
    event:"GOV0_R0_HISTORICAL_EVIDENCE_SNAPSHOT_RECOVERED",
    subject:"governance/build/BUILD-LOG.ndjson",
    state:{
      recovered_sequence:1,
      source_proposal_commit_sha1:"3d0da0b3239688a2da89aeac993e12a341a894ec",
      source_recovery_bundle_sha256:"0bcf06b2f839d4337963ffd9366f62dabd0fabdf36ee209e8a9d878f0e2e1625",
      snapshot_count:5,
      sequence_1_bytes_unchanged:true,
      sequence_2_bytes_unchanged:true,
      resolution:"CONTENT_ADDRESSED_SNAPSHOT_INDEX",
      effective:false
    },
    evidence:[
      "governance/build/BUILD-LOG-EVIDENCE-INDEX.json",
      "governance/evidence/history/sequence-0001/088cf8d37397d5d29443511f779217148745e329d102adf6a05c20a2a2c0a524.snapshot",
      "governance/evidence/history/sequence-0001/92d13fa5ec959e0a7b810b03e0373f4caebe1b85ce95f609e60384cdf5dfef16.snapshot",
      "governance/evidence/history/sequence-0001/93c71bcc10bb3752dbea766861a67707325ea2f9a63338a9fbc8384ba3cf7841.snapshot",
      "governance/evidence/history/sequence-0001/cb018f0db7097bed13fe2f61ad2607709b7413d8bfbdfaf2347dabfdfdae345f.snapshot",
      "governance/evidence/history/sequence-0001/ec3febc9639cebfb69dbc4fb3cd0a4645c750e5b6f870319251d007126ce5d0f.snapshot"
    ],
    claims_excluded:[
      "mutation of sequence 1",
      "mutation of sequence 2",
      "replacement of source proposal history",
      "formal approval",
      "governing gate activation",
      "M-1 start",
      "M0 start",
      "product implementation"
    ]
  }
' governance/build/BUILD-LOG.ndjson >/dev/null || fail "BUILD-LOG state mismatch"

[[ "$(sha256_file governance/build/BUILD-LOG-EVIDENCE-INDEX.json)" == "21f0c04be395b9af88d7ebdc8278ba6dc34cdc0c3ea59cbb3b1af025ee0678ac" ]] || fail "BUILD-LOG evidence index bytes differ from the recovered mapping"
[[ "$(canonical_sha256 governance/build/BUILD-LOG-EVIDENCE-INDEX.json)" == "7765ba9b8fad9b1ac324976b9018711fb36a72db2fd24b680a1a13f3aa212a6b" ]] || fail "BUILD-LOG evidence index semantic digest differs from the recovered mapping"
/usr/bin/jq -n -e \
  --slurpfile log governance/build/BUILD-LOG.ndjson \
  --slurpfile index governance/build/BUILD-LOG-EVIDENCE-INDEX.json '
    ($index[0].recorded_at == "2026-08-29T17:26:15Z") and
    ($index[0].historical_snapshots[0].sequence == 1) and
    ($index[0].historical_snapshots[0].source_proposal_commit_sha1 == "3d0da0b3239688a2da89aeac993e12a341a894ec") and
    ($index[0].historical_snapshots[0].source_proposal_tree_sha1 == "8f1ba6ede31e4bdce07ab8cdb5f1db9b74bd8012") and
    ($index[0].historical_snapshots[0].source_proposal_tag_object_sha1 == "311acdd83e2f6c810bf412a178f802240c8c4600") and
    ($index[0].historical_snapshots[0].source_recovery_bundle_sha256 == "0bcf06b2f839d4337963ffd9366f62dabd0fabdf36ee209e8a9d878f0e2e1625") and
    ($index[0].current_entries == {first_sequence:2,resolution:"CURRENT_ROOT_CLOSED_WORLD_MANIFEST"}) and
    ($log[0].evidence == ($index[0].historical_snapshots[0].evidence | map(.original_path))) and
    ($log[2].evidence[0] == "governance/build/BUILD-LOG-EVIDENCE-INDEX.json") and
    (($log[2].evidence[1:] | sort) == ($index[0].historical_snapshots[0].evidence | map(.snapshot_path) | sort))
  ' >/dev/null || fail "BUILD-LOG evidence index does not resolve the immutable sequence-1 snapshot"

while IFS=$'\t' read -r snapshot_path expected_raw_sha256 expected_git_blob_sha1; do
  require_regular_file "$snapshot_path"
  [[ "${snapshot_path##*/}" == "${expected_raw_sha256}.snapshot" ]] || fail "historical evidence snapshot is not content-addressed: $snapshot_path"
  [[ "$(sha256_file "$snapshot_path")" == "$expected_raw_sha256" ]] || fail "historical evidence snapshot SHA-256 mismatch: $snapshot_path"
  [[ "$(/usr/bin/git hash-object --no-filters -- "$snapshot_path")" == "$expected_git_blob_sha1" ]] || fail "historical evidence snapshot Git blob mismatch: $snapshot_path"
done < <(/usr/bin/jq -r '.historical_snapshots[0].evidence[] | [.snapshot_path,.raw_sha256,.git_blob_sha1] | @tsv' governance/build/BUILD-LOG-EVIDENCE-INDEX.json)

[[ "$(sha256_file AIyuehan-workbench-architecture-and-development-plan-v1.2.md)" == "be60ffbd9573b00b26e186295064a55dc255eaec05b7ca7ebc6cf70001b65274" ]] || fail "AIyuehan architecture baseline digest mismatch"
[[ "$(sha256_file governance/evidence/EXTERNAL-SOURCE-DIGESTS.sha256)" == "8b2477b2b8f7904d450ab7b2f753b9ea857f6287bcc62cc049db4fe77c755146" ]] || fail "external source digest record bytes differ from the reviewed lineage"
[[ "$(/usr/bin/wc -l < governance/evidence/EXTERNAL-SOURCE-DIGESTS.sha256 | /usr/bin/tr -d ' ')" == "3" ]] || fail "external source digest record must contain exactly three lines"
/usr/bin/grep -qx 'd55c8754b0fa1a19d6f2701f09957ed8000d333ac54ab64dfe78d85bda119700  external-architecture-input-v1' governance/evidence/EXTERNAL-SOURCE-DIGESTS.sha256 || fail "external architecture input digest missing"
/usr/bin/grep -qx '5976297261dfba6299695ab615aa8b28d482d01f2d672a0092bd2f4df04cc9bf  external-bootstrap-archive-v1' governance/evidence/EXTERNAL-SOURCE-DIGESTS.sha256 || fail "external bootstrap archive digest missing"
/usr/bin/grep -qx '908b94cacd17ed384fbc028bdbc5f08b161a2376d14700077d4ba9a6bd358513  predecessor-derived-architecture-v1.1' governance/evidence/EXTERNAL-SOURCE-DIGESTS.sha256 || fail "predecessor architecture digest missing"
[[ "$(sha256_file governance/evidence/GITHUB-PUBLIC-PROTECTION-ADMIN-READBACK-AIYUEHAN.md)" == "08447dfd15c09423d69e9febcbd7d92daa666af462e3857b6895c11d169971f8" ]] || fail "GitHub public protection admin-readback evidence bytes differ from the reviewed record"
[[ "$(sha256_file governance/evidence/EXTERNAL-LINEAGE.md)" == "289b75eb42785b8296c5ecb30e78b8f9792565cfb68e7882d8c60537662549c4" ]] || fail "external lineage bytes differ from the reviewed record"
[[ "$(sha256_file governance/evidence/THIRD-PARTY-CODE-EXCLUSION.md)" == "088cf8d37397d5d29443511f779217148745e329d102adf6a05c20a2a2c0a524" ]] || fail "external code exclusion bytes differ from the reviewed record"
/usr/bin/grep -q 'Repository database ID: `1350747678`' governance/evidence/GITHUB-PUBLIC-PROTECTION-ADMIN-READBACK-AIYUEHAN.md || fail "GitHub repository identity evidence missing"
/usr/bin/grep -q 'Ruleset database ID: `21811138`' governance/evidence/GITHUB-PUBLIC-PROTECTION-ADMIN-READBACK-AIYUEHAN.md || fail "branch ruleset admin readback missing"
/usr/bin/grep -q 'Ruleset database ID: `21811141`' governance/evidence/GITHUB-PUBLIC-PROTECTION-ADMIN-READBACK-AIYUEHAN.md || fail "tag ruleset admin readback missing"
/usr/bin/grep -q 'required-reviewers list empty' governance/evidence/GITHUB-PUBLIC-PROTECTION-ADMIN-READBACK-AIYUEHAN.md || fail "branch pull-request parameters admin readback missing"
/usr/bin/grep -q 'Pull-request parameters: absent / not applicable' governance/evidence/GITHUB-PUBLIC-PROTECTION-ADMIN-READBACK-AIYUEHAN.md || fail "tag pull-request parameter absence missing"
/usr/bin/grep -q 'Remote refs at administrator readback: empty' governance/evidence/GITHUB-PUBLIC-PROTECTION-ADMIN-READBACK-AIYUEHAN.md || fail "empty remote-ref admin readback missing"
/usr/bin/grep -q 'is not a pull-only attestor' governance/evidence/GITHUB-PUBLIC-PROTECTION-ADMIN-READBACK-AIYUEHAN.md || fail "unsigned admin-readback boundary missing"
/usr/bin/grep -q 'External recovery bundle SHA-256: `0bcf06b2f839d4337963ffd9366f62dabd0fabdf36ee209e8a9d878f0e2e1625`' governance/evidence/EXTERNAL-LINEAGE.md || fail "v3 predecessor archive binding missing"
/usr/bin/grep -q 'Exact SHA-256 intersection count was zero' governance/evidence/THIRD-PARTY-CODE-EXCLUSION.md || fail "external code exclusion result missing"

[[ "$(sha256_file governance/authorizations/R0-AIYUEHAN-NAMESPACE-AUTHORIZATION.json)" == "92d13fa5ec959e0a7b810b03e0373f4caebe1b85ce95f609e60384cdf5dfef16" ]] || fail "namespace authorization bytes differ from the recorded authority"
[[ "$(canonical_sha256 governance/authorizations/R0-AIYUEHAN-NAMESPACE-AUTHORIZATION.json)" == "70825bc42fda44e1e65b14cd7fb7b14149f3bf7d2062a94ebe5b73619b365b57" ]] || fail "namespace authorization differs from the recorded authority"
/usr/bin/jq -e '
  .schema_version == "aiyuehan-workbench.namespace-isolation-authorization/v1" and
  .authorization_id == "gov0-r0-aiyuehan-namespace-isolation-2026-08-29" and
  .recorded_at == "2026-08-29T15:50:31Z" and
  .authority_source == {
    kind: "authenticated_user_message",
    received_date: "2026-08-29",
    instruction_sha256: "90eab6c38f419eb74e4faea2304ab33ab723fb15bfeb758775dcb6262b1c7cc2",
    normalized_decision: "Use only the owner\u0027s AIyuehan identity throughout the active Workbench and exclude external product code and former naming."
  } and
  .canonical_identity == {
    display_name: "AIyuehan Workbench",
    repository_owner: "cindywheele97-art",
    repository_name: "AIyuehan-workbench",
    repository_url: "https://github.com/cindywheele97-art/AIyuehan-workbench",
    machine_namespace: "aiyuehan-workbench",
    urn_prefix: "urn:aiyuehan-workbench",
    code_prefix: "AIyuehan",
    environment_prefix: "AIYUEHAN"
  } and
  .lineage == {
    mode: "EXTERNAL_DIGEST_BOUND_ROOT_RESEAL",
    predecessor_commit_sha1: "e1b461f6db5b58e4c3b5b8eef37d4316f27ef2d1",
    predecessor_tree_sha1: "ef168835d2a897a4e03aee0dcae173421b55231f",
    predecessor_tag_object_sha1: "8e93f628e983e9ede440b472321db8c2978f7a01",
    predecessor_archive_sha256: "096478a6f0213804a8ba67c29c1c58334809f971edf524f2579a90939934aa76"
  } and
  .formal_approval == false and
  .effective_governing_definition == false and
  .remote_action_state == "BLOCKED_PROTECTION_ENTITLEMENT"
' governance/authorizations/R0-AIYUEHAN-NAMESPACE-AUTHORIZATION.json >/dev/null || fail "namespace authorization boundary mismatch"

[[ "$(sha256_file governance/authorizations/R0-PUBLIC-CONTINUATION-AUTHORIZATION.json)" == "bbb84330439fd4677e4dfc5bb09bab7b0ac657536ecbb7206f47e75067107169" ]] || fail "public continuation authorization bytes differ from the recorded authority"
[[ "$(canonical_sha256 governance/authorizations/R0-PUBLIC-CONTINUATION-AUTHORIZATION.json)" == "e92bbf1aeda533353e6726c4d3dedf99537087a4ecf90465fbd74dcb19ae70f0" ]] || fail "public continuation authorization differs from the recorded authority"
/usr/bin/jq -e '
  .schema_version == "aiyuehan-workbench.repository-continuation-authorization/v1" and
  .authorization_id == "gov0-r0-public-continuation-2026-08-29" and
  .recorded_at == "2026-08-29T16:59:05Z" and
  .authority_source == {
    kind:"authenticated_user_message",
    received_date:"2026-08-29",
    instruction_sha256:"59195be38d6cc98931d58bc8950ac8177b615175bbd91c16d84c709209fb4db3",
    normalized_decision:"Continue project development after converting the AIyuehan repository to public visibility, while preserving the governing milestone prerequisites."
  } and
  .repository == {
    owner:"cindywheele97-art",
    name:"AIyuehan-workbench",
    url:"https://github.com/cindywheele97-art/AIyuehan-workbench",
    database_id:1350747678,
    visibility:"public"
  } and
  .development_intent_recorded == true and
  .next_milestone == "R0_ACTIVATION_PREPARATION" and
  .allowed_effects == [
    "configure and read back active public repository branch and tag rulesets",
    "prepare and publish a governance-only R0 proposal through the declared protected refs",
    "continue into each development milestone only after its governing prerequisites become effective"
  ] and
  .forbidden_effects == [
    "treat this instruction as an exact-digest Approval Record or cryptographic signature",
    "represent an owner-admin readback as independent pull-only attestation",
    "publish a governing tag before the signed activation chain validates",
    "start M-1 before R0 derives GOVERNING_GATE_ACTIVE",
    "start M0 or product implementation before an independently accepted M-1",
    "install authenticate deploy release or mutate provider or customer resources without a later exact authorization"
  ] and
  .formal_approval == false and
  .effective_governing_definition == false and
  .remote_action_state == "PUBLIC_RULESETS_ACTIVE_PROPOSAL_REFS_UNPUBLISHED"
' governance/authorizations/R0-PUBLIC-CONTINUATION-AUTHORIZATION.json >/dev/null || fail "public continuation authorization boundary mismatch"

identity_boundary_digest="$(canonical_sha256 governance/r0/identity-boundary-policy.proposal.json)"
[[ "$identity_boundary_digest" == "3caa09cb0870cc1d1754201c5711a8266eff848a141c802f602f41e7313d8dff" ]] || fail "identity boundary policy differs from the reviewed scope"
/opt/homebrew/bin/node governance/tools/verify-identity-boundary.mjs workspace >/dev/null || fail "AIyuehan identity boundary verification failed"

trust_digest="$(canonical_sha256 governance/r0/trust-policy.proposal.json)"
risk_digest="$(canonical_sha256 governance/r0/risk-policy.proposal.json)"
envelope_digest="$(canonical_sha256 governance/r0/bootstrap-envelope-policy.proposal.json)"

[[ "$trust_digest" == "13d2598962cb48832e58ea3b4de89b8aa3179173f0d13a04ad00c5f9af9d8b81" ]] || fail "trust proposal semantic digest differs from the reviewed scope"
[[ "$risk_digest" == "ca2daef8f457964683940e9e3e954c0b2076ac08ccde367761919a07898150e4" ]] || fail "risk proposal semantic digest differs from the reviewed scope"
[[ "$envelope_digest" == "edf793a140295f8b3bed2d440f200813b6ed049ce54cb7e9040d90276ac662a6" ]] || fail "bootstrap-envelope proposal semantic digest differs from the reviewed scope"

/usr/bin/jq -e '
  .status == "PROPOSED" and .effective == false and
  .canonicalization == {name:"RFC8785",profile:"aiyuehan-workbench-restricted-ijson-v1",digest_algorithm:"sha256"} and
  (.trusted_keys | length) == 0 and
  (has("signature") | not) and (has("root_authority_principal_id") | not)
' governance/r0/trust-policy.proposal.json >/dev/null || fail "trust proposal is not fail-closed"

for policy_file in governance/r0/risk-policy.proposal.json governance/r0/bootstrap-envelope-policy.proposal.json; do
  /usr/bin/jq -e --arg trust "$trust_digest" '
    .status == "PROPOSED" and .effective == false and .trust_policy_digest == $trust and
    (has("signature") | not) and (has("issuer_actor_binding_digest") | not)
  ' "$policy_file" >/dev/null || fail "policy proposal boundary or trust binding mismatch: $policy_file"
done

verify_gate_assets() {
  local definition_file="$1"
  local previous=""
  while IFS=$'\t' read -r asset_path expected_digest; do
    safe_repo_path "$asset_path"
    [[ "$asset_path" > "$previous" ]] || fail "gate assets must be unique and path-sorted: $definition_file"
    previous="$asset_path"
    require_regular_file "$asset_path"
    [[ "$(sha256_file "$asset_path")" == "$expected_digest" ]] || fail "gate asset digest mismatch in $definition_file: $asset_path"
  done < <(/usr/bin/jq -r '.gate_assets[] | [.path, .sha256] | @tsv' "$definition_file")
}

assert_gate_asset_paths() {
  local definition_file="$1"
  shift
  printf '%s\n' "$@" | sort > "$temp_dir/expected-gate-assets"
  /usr/bin/jq -r '.gate_assets[].path' "$definition_file" > "$temp_dir/actual-gate-assets"
  cmp -s "$temp_dir/expected-gate-assets" "$temp_dir/actual-gate-assets" || fail "gate asset path set mismatch: $definition_file"
}

for definition_file in governance/r0/r0-gate-definition.proposal.json governance/r0/m-1-gate-definition.proposal.json; do
  /usr/bin/jq -e --arg trust "$trust_digest" --arg risk "$risk_digest" --arg envelope "$envelope_digest" '
    .status == "PROPOSED" and .effective == false and
    .trust_policy_digest == $trust and .risk_policy_digest == $risk and
    .bootstrap_envelope_policy_digest == $envelope and
    .skip_policy == "fail" and .clean_tree_required == true and
    (.commands | length) > 0 and
    (all(.commands[]; .required == true and (.argv | length) > 0 and .cwd == "." and .timeout_seconds > 0))
  ' "$definition_file" >/dev/null || fail "proposed gate definition invariant failed: $definition_file"
  verify_gate_assets "$definition_file"
done

[[ "$(gate_semantic_projection_sha256 governance/r0/r0-gate-definition.proposal.json)" == "8f01452bd6c4fb6e55ee1dd32308bd59bc63ff8498f9529b1c88d26a55277a3b" ]] || fail "R0 gate semantic projection differs from the reviewed scope"
[[ "$(gate_semantic_projection_sha256 governance/r0/m-1-gate-definition.proposal.json)" == "37e6abe55a392add075cb105fd12f3d3f2c4d5d74ef97ee112079446d715e645" ]] || fail "M-1 gate semantic projection differs from the reviewed scope"

assert_gate_asset_paths governance/r0/r0-gate-definition.proposal.json \
  governance/schemas/actor-binding.schema.json \
  governance/schemas/approval-record.schema.json \
  governance/schemas/approval-target.schema.json \
  governance/schemas/bootstrap-envelope-policy.schema.json \
  governance/schemas/bootstrap-envelope.schema.json \
  governance/schemas/build-log-entry.schema.json \
  governance/schemas/build-log-evidence-index.schema.json \
  governance/schemas/common.schema.json \
  governance/schemas/evidence.schema.json \
  governance/schemas/gate-run-manifest.schema.json \
  governance/schemas/governing-gate-activation.schema.json \
  governance/schemas/governing-gate-content.schema.json \
  governance/schemas/identity-boundary-policy.schema.json \
  governance/schemas/namespace-isolation-authorization.schema.json \
  governance/schemas/payload-manifest.schema.json \
  governance/schemas/preparation-authorization.schema.json \
  governance/schemas/proposed-gate-definition.schema.json \
  governance/schemas/ref-protection-intent.schema.json \
  governance/schemas/remote-protection-evidence.schema.json \
  governance/schemas/remote-publication-evidence.schema.json \
  governance/schemas/remote-ruleset-admin-evidence.schema.json \
  governance/schemas/repository-continuation-authorization.schema.json \
  governance/schemas/review-verdict.schema.json \
  governance/schemas/risk-policy.schema.json \
  governance/schemas/trust-policy.schema.json \
  governance/schemas/validation-verdict.schema.json \
  governance/tools/canonical-json.mjs \
  governance/tools/validate-json-schema.mjs \
  governance/tools/verify-activation.mjs \
  governance/tools/verify-identity-boundary.mjs \
  governance/tools/verify-r0.sh

assert_gate_asset_paths governance/r0/m-1-gate-definition.proposal.json \
  governance/schemas/evidence.schema.json \
  governance/schemas/gate-run-manifest.schema.json \
  governance/schemas/review-verdict.schema.json \
  governance/schemas/validation-verdict.schema.json \
  governance/tools/verify-m1-static.sh

/usr/bin/jq -e '
  .revision == 5 and
  .milestone == "GOV-0/R0" and
  .execution_class == "governance_static_validation" and
  .provider_credentials == "none" and
  .dynamic_external_effects_allowed == false and
  .runner.kind == "local_external_governance_runner" and
  .runner.network == "denied" and
  .runner.toolchain == [
    {name:"bash",path:"/bin/bash",version:"3.2.57(1)-release"},
    {name:"git",path:"/usr/bin/git",version:"2.39.5 (Apple Git-154)"},
    {name:"jq",path:"/usr/bin/jq",version:"1.7.1-apple"},
    {name:"node",path:"/opt/homebrew/bin/node",version:"26.7.0"},
    {name:"shasum",path:"/usr/bin/shasum",version:"6.02"}
  ] and
  .commands == [{
    id:"verify-r0-sealed",
    argv:["/usr/bin/env","-i","PATH=/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin","LC_ALL=C","GIT_CONFIG_GLOBAL=/dev/null","GIT_CONFIG_SYSTEM=/dev/null","/bin/bash","--noprofile","--norc","governance/tools/verify-r0.sh","sealed"],
    cwd:".",timeout_seconds:120,required:true
  }] and
  .forbidden_claims == ["FormalApproval","ActiveTrustPolicy","GoverningGateDefinition","ProtectedRemote","M-1Started","M0Started"]
' governance/r0/r0-gate-definition.proposal.json >/dev/null || fail "R0 gate definition exact semantic fence mismatch"

/usr/bin/jq -e '
  .revision == 2 and
  .milestone == "M-1" and
  .execution_class == "static_assessment" and
  .provider_credentials == "none" and
  .dynamic_external_effects_allowed == false and
  .runner.network == "read_only_allowlist" and
  .commands == [{id:"verify-m-minus-1-static-outputs",argv:["/bin/bash","governance/tools/verify-m1-static.sh"],cwd:".",timeout_seconds:120,required:true}] and
  .required_outputs == ["StaticCapabilityAssessment","DynamicQualificationPlan","PinnedReleaseInventory","LicenseDisposition"] and
  .forbidden_claims == ["CapabilitySnapshot","AdapterQualification","RuntimeQualification"] and
  (.activation_requirements[0] | startswith("a later governance Candidate replaces the intentional blocker")) and
  (.forbidden_effects | index("External Runtime Provider Task Agent Squad Issue or Workspace creation or mutation") != null) and
  (.forbidden_effects | index("installation authentication or provider credential use") != null) and
  (.forbidden_effects | index("product code M0 skeleton database or deployment assets") != null) and
  (.forbidden_effects | index("push deploy publish or release") != null)
' governance/r0/m-1-gate-definition.proposal.json >/dev/null || fail "M-1 static-only or intentional-blocker fence mismatch"

/usr/bin/jq -e '
  .repository == "cindywheele97-art/AIyuehan-workbench" and
  .repository_numeric_id == 1350747678 and
  .visibility == "public" and
  .status == "ACTIVE_ADMIN_READBACK_ONLY" and
  .observed_at == "2026-08-29T16:57:02Z" and
  .enforcement_required == "active" and
  .rulesets == [
    {
      ruleset_id:21811138,
      name:"governance-main-branch",
      target:"branch",
      source_type:"Repository",
      source:"cindywheele97-art/AIyuehan-workbench",
      enforcement:"active",
      include_refs:["refs/heads/main","refs/heads/governance/r0-proposal"],
      exclude_refs:[],
      rules:["creation","update","deletion","non_fast_forward","pull_request"],
      pull_request_parameters:{
        allowed_merge_methods:["merge","squash","rebase"],
        dismiss_stale_reviews_on_push:true,
        require_code_owner_review:true,
        require_extra_approval_for_unattributed_changes:true,
        require_last_push_approval:true,
        required_approving_review_count:1,
        required_review_thread_resolution:true,
        required_reviewers:[]
      },
      bypass_policy:"stable_authority_only_never_candidate_roles",
      bypass_actors:[{actor_id:284274547,actor_type:"User",bypass_mode:"always"}]
    },
    {
      ruleset_id:21811141,
      name:"governance-r0-tags",
      target:"tag",
      source_type:"Repository",
      source:"cindywheele97-art/AIyuehan-workbench",
      enforcement:"active",
      include_refs:["refs/tags/gov0-r0-proposal-v4","refs/tags/governance/r0"],
      exclude_refs:[],
      rules:["creation","update","deletion"],
      bypass_policy:"stable_authority_only_never_candidate_roles",
      bypass_actors:[{actor_id:284274547,actor_type:"User",bypass_mode:"always"}]
    }
  ] and
  (.required_future_probe | length) > 0 and
  .residual_blockers == [
    "signed stable-publisher ruleset-admin evidence is absent",
    "signed pull-only independent attestor precondition is absent",
    "real non-bypass denied-write probe is absent",
    "exact-digest approval and governing activation chain are absent"
  ]
' governance/r0/ref-protection-intent.json >/dev/null || fail "remote protection intent mismatch"
[[ "$(canonical_sha256 governance/r0/ref-protection-intent.json)" == "0e59a96bb96c1cbcb14d8a57b66db7c3773b55127a8de14c22bd3a4adcfb2d51" ]] || fail "remote protection intent semantic digest differs from the reviewed scope"

/usr/bin/grep -q '^FORMAL_APPROVAL = PENDING_EXACT_DIGEST$' governance/r0/STATUS.md || fail "formal approval status not pending"
/usr/bin/grep -q '^ROOT_TRUST_KEY = ABSENT / REQUIRED$' governance/r0/STATUS.md || fail "root trust key blocker missing"
/usr/bin/grep -q '^REMOTE_PROTECTION_ADMIN_READBACK = PRESENT / UNSIGNED / NOT_ATTESTATION$' governance/r0/STATUS.md || fail "admin-readback boundary missing"
/usr/bin/grep -q '^REMOTE_PROTECTION = ACTIVE_RULESETS / SIGNED_INDEPENDENT_EVIDENCE_PENDING$' governance/r0/STATUS.md || fail "signed independent protection evidence blocker missing"
/usr/bin/grep -q '^M-1 = NOT_STARTED / BLOCKED_PENDING_R0$' governance/r0/STATUS.md || fail "M-1 status is not prohibited"
/usr/bin/grep -q '^M0 = NOT_STARTED / BLOCKED_PENDING_R0_AND_M-1$' governance/r0/STATUS.md || fail "M0 status is not prohibited"

if find governance/r0 governance/authorizations -type f -print0 | /usr/bin/xargs -0 /usr/bin/grep -nE '(<TBD>|"choice"[[:space:]]*:[[:space:]]*"approve"|"status"[[:space:]]*:[[:space:]]*"ACTIVE")' >/dev/null; then
  fail "unresolved marker or premature activation exists in instantiated R0 records"
fi

/opt/homebrew/bin/node governance/tools/verify-activation.mjs --self-test >/dev/null || fail "activation cryptographic verifier self-test failed"

if [[ "$mode" == "pre-manifest" ]]; then
  [[ ! -e governance/r0/payload-manifest.json ]] || fail "pre-manifest mode requires manifest to be absent"
  echo "R0 PRE-MANIFEST VERIFY PASS"
  exit 0
fi

require_regular_file governance/r0/payload-manifest.json
validate_schema_instance urn:aiyuehan-workbench:schema:r0-payload-manifest:v1 governance/r0/payload-manifest.json
/usr/bin/jq '.repository.visibility = "private"' governance/r0/payload-manifest.json > "$temp_dir/manifest-private.json"
expect_schema_rejection urn:aiyuehan-workbench:schema:r0-payload-manifest:v1 "$temp_dir/manifest-private.json" "private payload manifest"
/usr/bin/jq '.manifest_id = "aiyuehan-workbench-gov0-r0-proposal-v3"' governance/r0/payload-manifest.json > "$temp_dir/manifest-v3.json"
expect_schema_rejection urn:aiyuehan-workbench:schema:r0-payload-manifest:v1 "$temp_dir/manifest-v3.json" "v3 payload manifest"
/usr/bin/jq -e '
  .schema_version == "aiyuehan-workbench.r0-payload-manifest/v1" and
  .status == "PENDING_FORMAL_APPROVAL" and .effective == false and
  .repository.owner == "cindywheele97-art" and
  .repository.name == "AIyuehan-workbench" and .repository.visibility == "public" and
  .manifest_id == "aiyuehan-workbench-gov0-r0-proposal-v4" and
  .repository.remote_state == "PUBLIC_PROTECTED_GOVERNANCE_PROPOSAL" and
  .repository.repository_numeric_id == 1350747678 and .repository.default_branch == "main" and
  .source_design.path == "AIyuehan-workbench-architecture-and-development-plan-v1.2.md" and
  .source_design.sha256 == "be60ffbd9573b00b26e186295064a55dc255eaec05b7ca7ebc6cf70001b65274" and
  .digest_profile == {entry_bytes:"exact_git_blob_bytes",record_canonicalization:"RFC8785 / aiyuehan-workbench-restricted-ijson-v1",algorithm:"sha256"} and
  .closed_world == true and .entries_order == "path_bytewise_ascending" and .self_excluded == true and
  .excluded_detached_records == [
    "governance/r0/payload-manifest.json",
    "active external trust policy",
    "active external risk policy",
    "active bootstrap envelope policy",
    "signed external actor bindings",
    "signed publisher precondition ruleset-admin evidence and raw API capture",
    "signed remote protection precondition and read-only raw API capture",
    "external approval target",
    "external approval record",
    "frozen governing gate content",
    "signed governing gate activation authorization",
    "git annotated proposal tag object",
    "git governing tag object",
    "signed publisher post-publication ruleset-admin evidence and raw API capture",
    "signed remote publication evidence and read-only raw API capture",
    "initial governing activation verifier result"
  ]
' governance/r0/payload-manifest.json >/dev/null || fail "payload manifest state mismatch"

printf '%s\n' "${required_files[@]}" | sort > "$temp_dir/manifest-expected-paths"
/usr/bin/jq -r '.entries[].path' governance/r0/payload-manifest.json > "$temp_dir/manifest-paths"
/usr/bin/sort "$temp_dir/manifest-paths" > "$temp_dir/manifest-paths-sorted"
cmp -s "$temp_dir/manifest-paths" "$temp_dir/manifest-paths-sorted" || fail "manifest entries are not path-sorted"
[[ "$(/usr/bin/wc -l < "$temp_dir/manifest-paths" | /usr/bin/tr -d ' ')" == "$(/usr/bin/sort -u "$temp_dir/manifest-paths" | /usr/bin/wc -l | /usr/bin/tr -d ' ')" ]] || fail "manifest contains duplicate paths"
cmp -s "$temp_dir/manifest-expected-paths" "$temp_dir/manifest-paths" || fail "manifest closed-world path set mismatch"

expected_media_role() {
  local file_path="$1"
  local media role
  case "$file_path" in
    *.json) media="application/json" ;;
    *.ndjson) media="application/x-ndjson" ;;
    *.md) media="text/markdown" ;;
    *.sh) media="text/x-shellscript" ;;
    *.mjs) media="text/javascript" ;;
    *) media="text/plain" ;;
  esac
  case "$file_path" in
    AIyuehan-workbench-architecture-and-development-plan-v1.2.md) role="architecture_baseline" ;;
    CONTEXT.md) role="domain_model" ;;
    docs/adr/*) role="architecture_decision" ;;
    governance/schemas/*) role="governance_schema" ;;
    governance/tools/*) role="governance_tool" ;;
    governance/evidence/*) role="governance_evidence" ;;
    governance/build/*) role="governance_log" ;;
    governance/r0/STATUS.md|governance/README.md) role="governance_status" ;;
    governance/authorizations/*|governance/r0/*.json) role="governance_policy" ;;
    *) role="repository_metadata" ;;
  esac
  printf '%s\t%s' "$media" "$role"
}

while IFS=$'\t' read -r file_path expected_bytes expected_digest media_type role; do
  safe_repo_path "$file_path"
  require_regular_file "$file_path"
  actual_bytes="$(/usr/bin/stat -f '%z' "./$file_path")"
  actual_digest="$(sha256_file "$file_path")"
  [[ "$actual_bytes" == "$expected_bytes" ]] || fail "manifest byte count mismatch: $file_path"
  [[ "$actual_digest" == "$expected_digest" ]] || fail "manifest digest mismatch: $file_path"
  [[ "$media_type"$'\t'"$role" == "$(expected_media_role "$file_path")" ]] || fail "manifest media type or role mismatch: $file_path"
done < <(/usr/bin/jq -r '.entries[] | [.path, (.bytes|tostring), .sha256, .media_type, .role] | @tsv' governance/r0/payload-manifest.json)

if [[ "$mode" == "sealed" ]]; then
  [[ -d .git && ! -L .git && ! -f .git ]] || fail "sealed mode requires a standalone in-tree .git directory"
  /usr/bin/git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "sealed mode requires Git"
  [[ "$(/usr/bin/git rev-parse --show-toplevel)" == "$repo_root" ]] || fail "Git worktree root differs from the verified repository root"
  git_dir="$(/usr/bin/git rev-parse --absolute-git-dir)" || fail "cannot resolve Git directory"
  git_common_dir="$(/usr/bin/git rev-parse --path-format=absolute --git-common-dir)" || fail "cannot resolve Git common directory"
  [[ "$(cd "$git_dir" && pwd -P)" == "$repo_root/.git" ]] || fail "Git directory is not the standalone in-tree .git directory"
  [[ "$(cd "$git_common_dir" && pwd -P)" == "$repo_root/.git" ]] || fail "Git common directory differs from the standalone in-tree .git directory"
  printf '%s\n' core.bare core.filemode core.ignorecase core.logallrefupdates core.precomposeunicode core.repositoryformatversion user.email user.name | /usr/bin/sort > "$temp_dir/expected-local-config-keys"
  /usr/bin/git config --local --name-only --list | /usr/bin/sort > "$temp_dir/actual-local-config-keys" || fail "cannot inspect local Git config"
  cmp -s "$temp_dir/expected-local-config-keys" "$temp_dir/actual-local-config-keys" || fail "local Git config contains missing duplicate or undeclared keys"
  [[ "$(/usr/bin/git config --local --get core.repositoryformatversion)" == "0" ]] || fail "local Git repository format config mismatch"
  [[ "$(/usr/bin/git config --local --get core.filemode)" == "true" ]] || fail "local Git fileMode must be true"
  [[ "$(/usr/bin/git config --local --get core.bare)" == "false" ]] || fail "local Git bare config mismatch"
  [[ "$(/usr/bin/git config --local --get core.ignorecase)" == "true" ]] || fail "local Git ignorecase config mismatch"
  [[ "$(/usr/bin/git config --local --get core.logallrefupdates)" == "true" ]] || fail "local Git reflog config mismatch"
  [[ "$(/usr/bin/git config --local --get core.precomposeunicode)" == "true" ]] || fail "local Git precomposeunicode config mismatch"
  [[ "$(/usr/bin/git config --local --get user.name)" == "cindywheele97-art" ]] || fail "local Git user name mismatch"
  [[ "$(/usr/bin/git config --local --get user.email)" == "284274547+cindywheele97-art@users.noreply.github.com" ]] || fail "local Git user email mismatch"
  [[ "$(/usr/bin/git symbolic-ref --short HEAD)" == "main" ]] || fail "HEAD must be main"
  [[ "$(/usr/bin/git rev-list --all --count)" == "1" ]] || fail "all refs must contain exactly one commit"
  /usr/bin/git cat-file commit HEAD > "$temp_dir/head-commit"
  ! /usr/bin/grep -q '^parent ' "$temp_dir/head-commit" || fail "HEAD is not a root commit"
  [[ ! -e "$(/usr/bin/git rev-parse --git-path shallow)" ]] || fail "shallow repository metadata is forbidden"
  [[ ! -e "$(/usr/bin/git rev-parse --git-path info/grafts)" ]] || fail "Git graft metadata is forbidden"
  [[ "$(/usr/bin/git show -s --format=%s HEAD)" == "chore(governance): prepare GOV-0 R0 proposal" ]] || fail "root commit message mismatch"
  /usr/bin/ruby -e 'raw = File.binread(ARGV.fetch(0)); message = raw.split("\n\n", 2).fetch(1, nil); exit(message == "chore(governance): prepare GOV-0 R0 proposal\n" ? 0 : 1)' "$temp_dir/head-commit" || fail "root commit message bytes are not exact"
  [[ "$(/usr/bin/git show -s --format=%an HEAD)" == "cindywheele97-art" ]] || fail "root commit author mismatch"
  [[ "$(/usr/bin/git show -s --format=%ae HEAD)" == "284274547+cindywheele97-art@users.noreply.github.com" ]] || fail "root commit email mismatch"
  [[ "$(/usr/bin/git show -s --format=%cn HEAD)" == "cindywheele97-art" ]] || fail "root commit committer mismatch"
  [[ "$(/usr/bin/git show -s --format=%ce HEAD)" == "284274547+cindywheele97-art@users.noreply.github.com" ]] || fail "root commit committer email mismatch"
  if ! git_status_output="$(/usr/bin/git status --porcelain=v1 -uall)"; then
    fail "Git status failed during sealed verification"
  fi
  [[ -z "$git_status_output" ]] || fail "sealed R0 worktree is dirty"
  if ! git_remote_output="$(/usr/bin/git remote)"; then
    fail "Git remote inspection failed during sealed verification"
  fi
  [[ -z "$git_remote_output" ]] || fail "formal sealed evidence repository must not contain a remote"
  git_alternates_path="$(/usr/bin/git rev-parse --git-path objects/info/alternates)" || fail "cannot resolve Git alternates path"
  git_http_alternates_path="$(/usr/bin/git rev-parse --git-path objects/info/http-alternates)" || fail "cannot resolve Git HTTP alternates path"
  [[ ! -e "$git_alternates_path" ]] || fail "Git object alternates are forbidden"
  [[ ! -e "$git_http_alternates_path" ]] || fail "Git HTTP object alternates are forbidden"
  for pseudoref in AUTO_MERGE BISECT_HEAD CHERRY_PICK_HEAD FETCH_HEAD MERGE_AUTOSTASH MERGE_HEAD ORIG_HEAD REBASE_HEAD REVERT_HEAD; do
    pseudoref_path="$(/usr/bin/git rev-parse --git-path "$pseudoref")" || fail "cannot resolve Git pseudoref path: $pseudoref"
    [[ ! -e "$pseudoref_path" ]] || fail "undeclared Git pseudoref is forbidden: $pseudoref"
  done
  if ! git_fsck_output="$(/usr/bin/git fsck --strict --no-reflogs --unreachable 2>&1)"; then
    fail "Git object verification failed: $git_fsck_output"
  fi
  [[ -z "$git_fsck_output" ]] || fail "unreachable dangling or unexpected Git objects exist: $git_fsck_output"

  printf '%s\n' refs/heads/governance/r0-proposal refs/heads/main refs/tags/gov0-r0-proposal-v4 | sort > "$temp_dir/expected-refs"
  /usr/bin/git for-each-ref --format='%(refname)' refs | sort > "$temp_dir/actual-refs"
  cmp -s "$temp_dir/expected-refs" "$temp_dir/actual-refs" || fail "local ref set mismatch"
  [[ "$(/usr/bin/git rev-parse refs/heads/governance/r0-proposal)" == "$(/usr/bin/git rev-parse HEAD)" ]] || fail "proposal branch does not resolve to HEAD"
  [[ "$(/usr/bin/git cat-file -t refs/tags/gov0-r0-proposal-v4)" == "tag" ]] || fail "annotated proposal tag missing"
  [[ "$(/usr/bin/git rev-list -n 1 gov0-r0-proposal-v4)" == "$(/usr/bin/git rev-parse HEAD)" ]] || fail "proposal tag does not peel to HEAD"
  [[ "$(/usr/bin/git cat-file -p refs/tags/gov0-r0-proposal-v4 | /usr/bin/sed -n '1p')" == "object $(/usr/bin/git rev-parse HEAD)" ]] || fail "proposal tag does not directly target HEAD"
  [[ "$(/usr/bin/git cat-file -p refs/tags/gov0-r0-proposal-v4 | /usr/bin/sed -n '2p')" == "type commit" ]] || fail "proposal tag directly targets a non-commit object"
  [[ "$(/usr/bin/git for-each-ref --format='%(taggername)' refs/tags/gov0-r0-proposal-v4)" == "cindywheele97-art" ]] || fail "proposal tagger mismatch"
  [[ "$(/usr/bin/git for-each-ref --format='%(taggeremail)' refs/tags/gov0-r0-proposal-v4)" == "<284274547+cindywheele97-art@users.noreply.github.com>" ]] || fail "proposal tagger email mismatch"

  manifest_digest="$(canonical_sha256 governance/r0/payload-manifest.json)"
  /usr/bin/git cat-file tag refs/tags/gov0-r0-proposal-v4 > "$temp_dir/proposal-tag-object" || fail "cannot read proposal tag object"
  /usr/bin/ruby -e '
    raw = File.binread(ARGV.fetch(0))
    headers, message = raw.split("\n\n", 2)
    expected = "AIyuehan-workbench-proposal-tag/v4\nstatus: PENDING_FORMAL_APPROVAL\nlineage-mode: EXTERNAL_DIGEST_BOUND_ROOT_RESEAL\npredecessor-proposal-commit-sha1: 3d0da0b3239688a2da89aeac993e12a341a894ec\npredecessor-proposal-tree-sha1: 8f1ba6ede31e4bdce07ab8cdb5f1db9b74bd8012\npredecessor-proposal-tag-object-sha1: 311acdd83e2f6c810bf412a178f802240c8c4600\npredecessor-archive-sha256: 0bcf06b2f839d4337963ffd9366f62dabd0fabdf36ee209e8a9d878f0e2e1625\nidentity-boundary-policy-canonical-sha256: #{ARGV.fetch(2)}\nr0-payload-manifest-canonical-sha256: #{ARGV.fetch(1)}\ngoverning: false\nsignature: absent\n"
    lines = headers&.split("\n") || []
    valid_headers = lines.count { |line| line.start_with?("object ") } == 1 &&
      lines.count { |line| line == "type commit" } == 1 &&
      lines.count { |line| line == "tag gov0-r0-proposal-v4" } == 1 &&
      lines.count { |line| line.match?(/\Atagger cindywheele97-art <284274547\+cindywheele97-art@users\.noreply\.github\.com> [0-9]+ [+-][0-9]{4}\z/) } == 1
    exit(valid_headers && message == expected ? 0 : 1)
  ' "$temp_dir/proposal-tag-object" "$manifest_digest" "$identity_boundary_digest" || fail "proposal tag object or message bytes are not exact"

  printf '%s\n' "${required_files[@]}" governance/r0/payload-manifest.json | sort > "$temp_dir/expected-tree-paths"
  /usr/bin/git ls-tree -r --name-only HEAD | sort > "$temp_dir/actual-tree-paths"
  cmp -s "$temp_dir/expected-tree-paths" "$temp_dir/actual-tree-paths" || fail "Git tree path set mismatch"
  while IFS=$'\t' read -r mode_and_type tree_path; do
    safe_repo_path "$tree_path"
    object_mode="${mode_and_type%% *}"
    case "$tree_path" in
      governance/tools/*.sh|governance/tools/*.mjs)
        [[ "$object_mode" == "100755" ]] || fail "governance tool is not executable in Git: $tree_path"
        ;;
      *)
        [[ "$object_mode" == "100644" ]] || fail "non-tool Git mode is forbidden: $object_mode $tree_path"
        ;;
    esac
  done < <(/usr/bin/git ls-tree -r HEAD | /usr/bin/sed -E 's/^([0-9]+) ([^ ]+) [^[:space:]]+[[:space:]]/\1 \2\t/')

  /usr/bin/git ls-files -v > "$temp_dir/index-flags" || fail "Git index flag inspection failed"
  if /usr/bin/grep -Ev '^H ' "$temp_dir/index-flags" >/dev/null; then
    fail "assume-unchanged skip-worktree or other non-default index flags are forbidden"
  fi
  while IFS= read -r tree_path; do
    safe_repo_path "$tree_path"
    [[ "$(/usr/bin/git hash-object -- "$tree_path")" == "$(/usr/bin/git rev-parse "HEAD:$tree_path")" ]] || fail "working file bytes differ from the sealed Git blob: $tree_path"
    worktree_mode="$(/usr/bin/stat -f '%Lp' "$tree_path")" || fail "cannot inspect worktree mode: $tree_path"
    case "$tree_path" in
      governance/tools/*.sh|governance/tools/*.mjs)
        [[ "$worktree_mode" == "755" ]] || fail "governance tool worktree mode is not 755: $tree_path"
        ;;
      *)
        [[ "$worktree_mode" == "644" ]] || fail "non-tool worktree mode is not 644: $tree_path"
        ;;
    esac
  done < "$temp_dir/actual-tree-paths"

  /opt/homebrew/bin/node governance/tools/verify-identity-boundary.mjs sealed >/dev/null || fail "sealed Git identity boundary verification failed"
fi

mode_label="$(printf '%s' "$mode" | /usr/bin/tr '[:lower:]' '[:upper:]')"
echo "R0 $mode_label VERIFY PASS"
