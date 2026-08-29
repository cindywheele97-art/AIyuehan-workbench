#!/usr/bin/env node

import { createHash } from "node:crypto";
import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const mode = process.argv[2] ?? "workspace";
if (!new Set(["workspace", "sealed"]).has(mode)) {
  process.stderr.write("usage: verify-identity-boundary.mjs [workspace|sealed]\n");
  process.exit(2);
}

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const prohibitedToken = Buffer.from("6d756c74696361", "hex");
const expectedFingerprint = "79d51394bd7e8dbfbd0aa15445c9c78970739ea24c295c2642b97050ced20f06";
const prohibitedCredentialMarkers = Object.freeze([
  Buffer.from("6769746875625f7061745f", "hex"),
  Buffer.from("6768705f", "hex"),
  Buffer.from("67686f5f", "hex"),
  Buffer.from("6768755f", "hex"),
  Buffer.from("6768735f", "hex"),
  Buffer.from("6768725f", "hex"),
  Buffer.from("782d6163636573732d746f6b656e3a", "hex")
]);

function fail(message) {
  process.stderr.write(`IDENTITY BOUNDARY FAIL: ${message}\n`);
  process.exit(1);
}

if (prohibitedToken.length !== 7 || createHash("sha256").update(prohibitedToken).digest("hex") !== expectedFingerprint) {
  fail("prohibited namespace fingerprint configuration is invalid");
}

function asciiFold(bytes) {
  const folded = Buffer.from(bytes);
  for (let index = 0; index < folded.length; index += 1) {
    if (folded[index] >= 0x41 && folded[index] <= 0x5a) folded[index] += 0x20;
  }
  return folded;
}

function containsProhibitedToken(bytes) {
  if (asciiFold(bytes).includes(prohibitedToken)) return true;
  const normalized = Buffer.from(bytes).toString("utf8").normalize("NFKC").toLowerCase();
  return normalized.includes(prohibitedToken.toString("utf8"));
}

function assertClean(label, bytes) {
  if (containsProhibitedToken(bytes)) fail(`prohibited namespace appears in ${label}`);
  const folded = asciiFold(bytes);
  if (prohibitedCredentialMarkers.some((marker) => folded.includes(marker))) {
    fail(`credential material marker appears in ${label}`);
  }
}

function scanTree(root, { skipGitObjects = false, skipGitDirectory = false } = {}) {
  const visit = (absolutePath) => {
    const stat = lstatSync(absolutePath);
    const repoRelative = relative(repositoryRoot, absolutePath).replaceAll("\\", "/") || ".";
    assertClean(`path ${repoRelative}`, Buffer.from(repoRelative, "utf8"));
    if (stat.isSymbolicLink()) fail(`symbolic link is not allowed: ${repoRelative}`);
    if (stat.isDirectory()) {
      if (skipGitDirectory && repoRelative === ".git") return;
      if (skipGitObjects && repoRelative === ".git/objects") return;
      for (const entry of readdirSync(absolutePath).sort()) visit(resolve(absolutePath, entry));
      return;
    }
    if (!stat.isFile()) fail(`non-regular entry is not allowed: ${repoRelative}`);
    assertClean(`file bytes ${repoRelative}`, readFileSync(absolutePath));
  };
  visit(root);
}

function runGit(args, encoding = "utf8") {
  const result = spawnSync("/usr/bin/git", args, {
    cwd: repositoryRoot,
    encoding,
    maxBuffer: 128 * 1024 * 1024,
    env: {
      PATH: "/usr/bin:/bin:/usr/sbin:/sbin",
      LC_ALL: "C",
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_CONFIG_SYSTEM: "/dev/null",
      GIT_NO_REPLACE_OBJECTS: "1",
      GIT_OPTIONAL_LOCKS: "0"
    }
  });
  if (result.status !== 0) fail(`Git inspection failed for ${args[0]}`);
  return result.stdout;
}

scanTree(repositoryRoot, { skipGitDirectory: true });

if (mode === "sealed") {
  const gitDirectory = resolve(repositoryRoot, ".git");
  const gitStat = lstatSync(gitDirectory);
  if (!gitStat.isDirectory() || gitStat.isSymbolicLink()) fail("sealed mode requires a standalone Git directory");

  scanTree(gitDirectory, { skipGitObjects: true });

  const objectLines = runGit(["cat-file", "--batch-all-objects", "--batch-check=%(objectname) %(objecttype)"])
    .trim()
    .split("\n")
    .filter(Boolean);
  if (objectLines.length === 0) fail("sealed repository contains no Git objects");

  for (const line of objectLines) {
    const match = /^([0-9a-f]{40}) (blob|tree|commit|tag)$/.exec(line);
    if (!match) fail("Git object inventory contains an unexpected record");
    const [, objectId, objectType] = match;
    const payload = runGit(["cat-file", objectType, objectId], null);
    assertClean(`Git ${objectType} object ${objectId}`, payload);
  }
}

process.stdout.write("IDENTITY BOUNDARY PASS\n");
