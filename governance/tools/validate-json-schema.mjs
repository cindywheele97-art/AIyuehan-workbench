#!/usr/bin/env node

import { lstatSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseStrictJsonBytes } from "./canonical-json.mjs";

const DRAFT = "https://json-schema.org/draft/2020-12/schema";
const SUPPORTED_KEYWORDS = new Set([
  "$schema", "$id", "$defs", "$ref",
  "type", "const", "enum",
  "allOf", "anyOf", "oneOf", "not", "if", "then", "else",
  "properties", "required", "additionalProperties",
  "items", "prefixItems", "contains", "minContains", "maxContains", "minItems", "maxItems", "uniqueItems",
  "minLength", "pattern", "minimum", "maximum", "format",
]);
const TYPES = new Set(["null", "boolean", "object", "array", "number", "integer", "string"]);
const FORMATS = new Set(["date", "date-time"]);

function fail(message) {
  throw new Error(message);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function jsonEqual(left, right) {
  if (left === right) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => jsonEqual(value, right[index]));
  }
  if (isObject(left) || isObject(right)) {
    if (!isObject(left) || !isObject(right)) return false;
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index] && jsonEqual(left[key], right[key]));
  }
  return false;
}

function pointerToken(token) {
  if (/~(?:[^01]|$)/.test(token)) fail(`invalid JSON Pointer escape in ${token}`);
  return token.replaceAll("~1", "/").replaceAll("~0", "~");
}

function resolvePointer(root, fragment, label) {
  if (fragment === "" || fragment === "#") return root;
  let decoded;
  try { decoded = `#${decodeURIComponent(fragment.slice(1))}`; } catch { fail(`${label}: invalid percent encoding in JSON Pointer ${fragment}`); }
  if (!decoded.startsWith("#/")) fail(`${label}: unsupported JSON Pointer fragment ${fragment}`);
  let value = root;
  for (const rawToken of decoded.slice(2).split("/")) {
    const token = pointerToken(rawToken);
    if (!isObject(value) && !Array.isArray(value)) fail(`${label}: unresolved JSON Pointer ${fragment}`);
    if (!Object.hasOwn(value, token)) fail(`${label}: unresolved JSON Pointer ${fragment}`);
    value = value[token];
  }
  return value;
}

function requireArray(value, label) {
  if (!Array.isArray(value)) fail(`${label}: must be an array`);
}

function requireNonnegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) fail(`${label}: must be a nonnegative safe integer`);
}

function inspectSchema(schema, label, rootId, isRoot = false) {
  if (typeof schema === "boolean") return;
  if (!isObject(schema)) fail(`${label}: schema must be an object or boolean`);
  for (const keyword of Object.keys(schema)) {
    if (!SUPPORTED_KEYWORDS.has(keyword)) fail(`${label}: unsupported schema keyword ${keyword}`);
  }
  if (Object.hasOwn(schema, "$schema") && schema.$schema !== DRAFT) fail(`${label}: unsupported $schema ${schema.$schema}`);
  if (Object.hasOwn(schema, "$id") && (typeof schema.$id !== "string" || schema.$id.length === 0)) fail(`${label}: $id must be a non-empty string`);
  if (!isRoot && (Object.hasOwn(schema, "$schema") || Object.hasOwn(schema, "$id"))) fail(`${label}: nested $schema or $id is outside the supported profile`);
  if (Object.hasOwn(schema, "$ref") && typeof schema.$ref !== "string") fail(`${label}: $ref must be a string`);
  if (Object.hasOwn(schema, "type")) {
    const declared = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (declared.length === 0 || declared.some((type) => !TYPES.has(type)) || new Set(declared).size !== declared.length) fail(`${label}: unsupported type declaration`);
  }
  if (Object.hasOwn(schema, "enum") && (!Array.isArray(schema.enum) || schema.enum.length === 0)) fail(`${label}: enum must be a non-empty array`);
  if (schema.enum?.some((value, index) => schema.enum.slice(0, index).some((prior) => jsonEqual(value, prior)))) fail(`${label}: enum values must be unique`);
  for (const keyword of ["allOf", "anyOf", "oneOf"]) {
    if (!Object.hasOwn(schema, keyword)) continue;
    requireArray(schema[keyword], `${label}/${keyword}`);
    if (schema[keyword].length === 0) fail(`${label}/${keyword}: must not be empty`);
    schema[keyword].forEach((child, index) => inspectSchema(child, `${label}/${keyword}/${index}`, rootId));
  }
  for (const keyword of ["not", "if", "then", "else", "items", "contains", "additionalProperties"]) {
    if (Object.hasOwn(schema, keyword)) inspectSchema(schema[keyword], `${label}/${keyword}`, rootId);
  }
  if (Object.hasOwn(schema, "properties")) {
    if (!isObject(schema.properties)) fail(`${label}/properties: must be an object`);
    for (const [name, child] of Object.entries(schema.properties)) inspectSchema(child, `${label}/properties/${name}`, rootId);
  }
  if (Object.hasOwn(schema, "$defs")) {
    if (!isObject(schema.$defs)) fail(`${label}/$defs: must be an object`);
    for (const [name, child] of Object.entries(schema.$defs)) inspectSchema(child, `${label}/$defs/${name}`, rootId);
  }
  if (Object.hasOwn(schema, "required")) {
    requireArray(schema.required, `${label}/required`);
    if (schema.required.some((name) => typeof name !== "string") || new Set(schema.required).size !== schema.required.length) fail(`${label}/required: entries must be unique strings`);
  }
  if (Object.hasOwn(schema, "prefixItems")) {
    requireArray(schema.prefixItems, `${label}/prefixItems`);
    schema.prefixItems.forEach((child, index) => inspectSchema(child, `${label}/prefixItems/${index}`, rootId));
  }
  for (const keyword of ["minItems", "maxItems", "minContains", "maxContains", "minLength"]) {
    if (Object.hasOwn(schema, keyword)) requireNonnegativeInteger(schema[keyword], `${label}/${keyword}`);
  }
  for (const keyword of ["minimum", "maximum"]) {
    if (Object.hasOwn(schema, keyword) && (typeof schema[keyword] !== "number" || !Number.isFinite(schema[keyword]))) fail(`${label}/${keyword}: must be a finite number`);
  }
  if (Object.hasOwn(schema, "uniqueItems") && typeof schema.uniqueItems !== "boolean") fail(`${label}/uniqueItems: must be boolean`);
  if ((Object.hasOwn(schema, "minContains") || Object.hasOwn(schema, "maxContains")) && !Object.hasOwn(schema, "contains")) fail(`${label}: minContains/maxContains require contains in the Workbench profile`);
  if (schema.minContains !== undefined && schema.maxContains !== undefined && schema.minContains > schema.maxContains) fail(`${label}: minContains exceeds maxContains`);
  if (Object.hasOwn(schema, "pattern")) {
    if (typeof schema.pattern !== "string") fail(`${label}/pattern: must be a string`);
    try { new RegExp(schema.pattern, "u"); } catch { fail(`${label}/pattern: invalid ECMAScript regular expression`); }
  }
  if (Object.hasOwn(schema, "format") && !FORMATS.has(schema.format)) fail(`${label}/format: unsupported format ${schema.format}`);
}

export function loadSchemaRegistry(schemaDirectory) {
  const directory = resolve(schemaDirectory);
  const registry = new Map();
  for (const name of readdirSync(directory).filter((entry) => entry.endsWith(".json")).sort()) {
    const path = resolve(directory, name);
    const fileStat = lstatSync(path);
    if (!fileStat.isFile() || fileStat.isSymbolicLink()) fail(`${path}: schema must be a regular non-symlink file`);
    const schema = parseStrictJsonBytes(readFileSync(path));
    if (!isObject(schema) || schema.$schema !== DRAFT || typeof schema.$id !== "string") fail(`${path}: root schema must declare Draft 2020-12 and an $id`);
    if (!schema.$id.startsWith("urn:aiyuehan-workbench:schema:")) fail(`${path}: schema $id is outside the local URN registry`);
    if (registry.has(schema.$id)) fail(`${path}: duplicate schema $id ${schema.$id}`);
    inspectSchema(schema, path, schema.$id, true);
    registry.set(schema.$id, { schema, path });
  }
  if (registry.size === 0) fail(`${directory}: no schema files found`);
  for (const { schema, path } of registry.values()) checkRefs(schema, schema, registry, path);
  return registry;
}

function checkRefs(schema, root, registry, label) {
  if (typeof schema === "boolean") return;
  if (Object.hasOwn(schema, "$ref")) resolveReference(schema.$ref, root, registry, label);
  for (const keyword of ["allOf", "anyOf", "oneOf", "prefixItems"]) {
    for (const child of schema[keyword] ?? []) checkRefs(child, root, registry, label);
  }
  for (const keyword of ["not", "if", "then", "else", "items", "contains", "additionalProperties"]) {
    if (Object.hasOwn(schema, keyword)) checkRefs(schema[keyword], root, registry, label);
  }
  for (const child of Object.values(schema.properties ?? {})) checkRefs(child, root, registry, label);
  for (const child of Object.values(schema.$defs ?? {})) checkRefs(child, root, registry, label);
}

function resolveReference(reference, currentRoot, registry, label) {
  if (reference.startsWith("#")) return { schema: resolvePointer(currentRoot, reference, label), root: currentRoot };
  const hash = reference.indexOf("#");
  const id = hash === -1 ? reference : reference.slice(0, hash);
  const fragment = hash === -1 ? "" : reference.slice(hash);
  const registered = registry.get(id);
  if (!registered) fail(`${label}: unresolved or non-local $ref ${reference}`);
  return { schema: resolvePointer(registered.schema, fragment, label), root: registered.schema };
}

function matchesType(instance, type) {
  switch (type) {
    case "null": return instance === null;
    case "boolean": return typeof instance === "boolean";
    case "object": return isObject(instance);
    case "array": return Array.isArray(instance);
    case "number": return typeof instance === "number" && Number.isFinite(instance);
    case "integer": return typeof instance === "number" && Number.isSafeInteger(instance);
    case "string": return typeof instance === "string";
    default: return false;
  }
}

function validDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= days[month - 1];
}

function validDateTime(value) {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!match) return false;
  const hour = Number(match[2]);
  const minute = Number(match[3]);
  const second = Number(match[4]);
  const offsetHour = match[8] === undefined ? 0 : Number(match[8]);
  const offsetMinute = match[9] === undefined ? 0 : Number(match[9]);
  if (!validDate(match[1]) || hour > 23 || minute > 59 || second > 60 || offsetHour > 23 || offsetMinute > 59) return false;
  const parseable = second === 60 ? value.replace(/:60(?=\.|Z|[+-])/, ":59") : value;
  return Number.isFinite(Date.parse(parseable));
}

function appendPath(path, token) {
  return `${path}/${String(token).replaceAll("~", "~0").replaceAll("/", "~1")}`;
}

function validateNode(instance, schema, root, registry, path, depth = 0) {
  if (depth > 256) return [`${path}: schema evaluation depth exceeded`];
  if (schema === true) return [];
  if (schema === false) return [`${path}: rejected by false schema`];
  const errors = [];
  const apply = (child, childRoot = root) => validateNode(instance, child, childRoot, registry, path, depth + 1);

  if (Object.hasOwn(schema, "$ref")) {
    const resolved = resolveReference(schema.$ref, root, registry, path);
    errors.push(...validateNode(instance, resolved.schema, resolved.root, registry, path, depth + 1));
  }
  if (Object.hasOwn(schema, "type")) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type) => matchesType(instance, type))) errors.push(`${path}: expected type ${types.join("|")}`);
  }
  if (Object.hasOwn(schema, "const") && !jsonEqual(instance, schema.const)) errors.push(`${path}: value does not equal const`);
  if (Object.hasOwn(schema, "enum") && !schema.enum.some((value) => jsonEqual(instance, value))) errors.push(`${path}: value is not in enum`);

  for (const child of schema.allOf ?? []) errors.push(...apply(child));
  if (schema.anyOf && !schema.anyOf.some((child) => apply(child).length === 0)) errors.push(`${path}: no anyOf branch matched`);
  if (schema.oneOf) {
    const count = schema.oneOf.filter((child) => apply(child).length === 0).length;
    if (count !== 1) errors.push(`${path}: expected exactly one oneOf branch, found ${count}`);
  }
  if (Object.hasOwn(schema, "not") && apply(schema.not).length === 0) errors.push(`${path}: matched forbidden not schema`);
  if (Object.hasOwn(schema, "if")) {
    const branch = apply(schema.if).length === 0 ? schema.then : schema.else;
    if (branch !== undefined) errors.push(...apply(branch));
  }

  if (isObject(instance)) {
    for (const name of schema.required ?? []) if (!Object.hasOwn(instance, name)) errors.push(`${appendPath(path, name)}: required property missing`);
    for (const [name, child] of Object.entries(schema.properties ?? {})) {
      if (Object.hasOwn(instance, name)) errors.push(...validateNode(instance[name], child, root, registry, appendPath(path, name), depth + 1));
    }
    if (Object.hasOwn(schema, "additionalProperties")) {
      const known = new Set(Object.keys(schema.properties ?? {}));
      for (const [name, value] of Object.entries(instance)) {
        if (!known.has(name)) errors.push(...validateNode(value, schema.additionalProperties, root, registry, appendPath(path, name), depth + 1));
      }
    }
  }

  if (Array.isArray(instance)) {
    if (schema.minItems !== undefined && instance.length < schema.minItems) errors.push(`${path}: fewer than minItems ${schema.minItems}`);
    if (schema.maxItems !== undefined && instance.length > schema.maxItems) errors.push(`${path}: more than maxItems ${schema.maxItems}`);
    if (schema.uniqueItems) {
      outer: for (let i = 0; i < instance.length; i += 1) for (let j = 0; j < i; j += 1) {
        if (jsonEqual(instance[i], instance[j])) { errors.push(`${path}: duplicate array items at ${j} and ${i}`); break outer; }
      }
    }
    const prefix = schema.prefixItems ?? [];
    for (let index = 0; index < Math.min(prefix.length, instance.length); index += 1) {
      errors.push(...validateNode(instance[index], prefix[index], root, registry, appendPath(path, index), depth + 1));
    }
    if (Object.hasOwn(schema, "items")) {
      for (let index = prefix.length; index < instance.length; index += 1) errors.push(...validateNode(instance[index], schema.items, root, registry, appendPath(path, index), depth + 1));
    }
    if (Object.hasOwn(schema, "contains")) {
      const matchCount = instance.filter((value, index) => validateNode(value, schema.contains, root, registry, appendPath(path, index), depth + 1).length === 0).length;
      const minimum = schema.minContains ?? 1;
      const maximum = schema.maxContains ?? Number.POSITIVE_INFINITY;
      if (matchCount < minimum || matchCount > maximum) errors.push(`${path}: contains matched ${matchCount} items, expected ${minimum}..${maximum}`);
    }
  }

  if (typeof instance === "string") {
    if (schema.minLength !== undefined && [...instance].length < schema.minLength) errors.push(`${path}: shorter than minLength ${schema.minLength}`);
    if (schema.pattern !== undefined && !new RegExp(schema.pattern, "u").test(instance)) errors.push(`${path}: does not match pattern ${schema.pattern}`);
    if (schema.format === "date" && !validDate(instance)) errors.push(`${path}: invalid date`);
    if (schema.format === "date-time" && !validDateTime(instance)) errors.push(`${path}: invalid date-time`);
  }
  if (typeof instance === "number" && Number.isFinite(instance)) {
    if (schema.minimum !== undefined && instance < schema.minimum) errors.push(`${path}: less than minimum ${schema.minimum}`);
    if (schema.maximum !== undefined && instance > schema.maximum) errors.push(`${path}: greater than maximum ${schema.maximum}`);
  }
  return errors;
}

export function validateInstance(instance, schemaOrId, registry, label = "instance") {
  let schema;
  let root;
  if (typeof schemaOrId === "string") {
    const resolved = resolveReference(schemaOrId, {}, registry, label);
    schema = resolved.schema;
    root = resolved.root;
  } else {
    schema = schemaOrId;
    root = schemaOrId;
  }
  const errors = validateNode(instance, schema, root, registry, "$");
  if (errors.length > 0) fail(`${label}: JSON Schema validation failed\n${errors.slice(0, 20).join("\n")}`);
  return true;
}

export function validateFileAgainstSchema(instancePath, schemaId, schemaDirectory, { ndjson = false } = {}) {
  const registry = loadSchemaRegistry(schemaDirectory);
  const bytes = readFileSync(instancePath);
  if (!ndjson) return validateInstance(parseStrictJsonBytes(bytes), schemaId, registry, instancePath);
  if (bytes.length === 0 || bytes[bytes.length - 1] !== 0x0a) fail(`${instancePath}: NDJSON must end with LF`);
  const lines = new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, -1)).split("\n");
  if (lines.some((line) => line.length === 0)) fail(`${instancePath}: NDJSON contains a blank line`);
  lines.forEach((line, index) => validateInstance(parseStrictJsonBytes(Buffer.from(line)), schemaId, registry, `${instancePath}:${index + 1}`));
  return true;
}

function usage() {
  return "usage: validate-json-schema.mjs --schemas DIR --schema URN --instance FILE [--ndjson]";
}

function main(argv) {
  let schemas;
  let schema;
  let instance;
  let ndjson = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--schemas") schemas = argv[++index];
    else if (argument === "--schema") schema = argv[++index];
    else if (argument === "--instance") instance = argv[++index];
    else if (argument === "--ndjson") ndjson = true;
    else fail(`unknown argument ${argument}`);
  }
  if (!schemas || !schema || !instance) fail(usage());
  validateFileAgainstSchema(resolve(instance), schema, resolve(schemas), { ndjson });
  process.stdout.write(`SCHEMA VALIDATION PASS: ${instance}\n`);
}

function isDirectExecution() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isDirectExecution()) {
  try { main(process.argv.slice(2)); } catch (error) {
    process.stderr.write(`SCHEMA VALIDATION FAIL: ${error.message}\n`);
    process.exitCode = 1;
  }
}
