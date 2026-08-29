#!/usr/bin/env bash

set -euo pipefail

cat >&2 <<'MESSAGE'
M-1 STATIC VERIFY BLOCKED

This R0 payload contains only the proposed M-1 scope and fail-closed fences.
It deliberately does not contain an activatable M-1 output validator, formal
activation bundle, Gate Run Manifest, role bindings, or Bootstrap Development
Envelope. The current user authorization explicitly excludes starting M-1.

Before M-1 can run, a later governance Candidate must add strict schemas and a
qualified static-output validator, then obtain exact-digest approval under the
protected governing process. File existence or Candidate-local proposal data
can never unlock this command.
MESSAGE

exit 78
