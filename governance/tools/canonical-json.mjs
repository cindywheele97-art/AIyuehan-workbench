#!/usr/bin/env node

import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

function invalid(message) {
  throw new Error(message);
}

function assertUnicodeScalarString(value, location) {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        invalid(`lone high surrogate at ${location}`);
      }
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      invalid(`lone low surrogate at ${location}`);
    }
  }
}

class StrictJsonParser {
  constructor(source) {
    this.source = source;
    this.index = 0;
  }

  fail(message) {
    invalid(`${message} at byte-offset ${Buffer.byteLength(this.source.slice(0, this.index), "utf8")}`);
  }

  skipWhitespace() {
    while (/[\u0009\u000a\u000d\u0020]/.test(this.source[this.index] ?? "")) {
      this.index += 1;
    }
  }

  expect(character) {
    if (this.source[this.index] !== character) {
      this.fail(`expected ${JSON.stringify(character)}`);
    }
    this.index += 1;
  }

  parseString(location) {
    const start = this.index;
    this.expect('"');
    while (this.index < this.source.length) {
      const character = this.source[this.index];
      const codeUnit = this.source.charCodeAt(this.index);
      if (character === '"') {
        this.index += 1;
        let value;
        try {
          value = JSON.parse(this.source.slice(start, this.index));
        } catch (error) {
          this.fail(error instanceof Error ? error.message : String(error));
        }
        assertUnicodeScalarString(value, location);
        return value;
      }
      if (codeUnit < 0x20) {
        this.fail("unescaped control character in string");
      }
      if (character === "\\") {
        this.index += 1;
        const escape = this.source[this.index];
        if (escape === "u") {
          const hex = this.source.slice(this.index + 1, this.index + 5);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
            this.fail("invalid Unicode escape");
          }
          this.index += 5;
          continue;
        }
        if (!['"', "\\", "/", "b", "f", "n", "r", "t"].includes(escape)) {
          this.fail("invalid string escape");
        }
      }
      this.index += 1;
    }
    this.fail("unterminated string");
  }

  parseNumber() {
    const match = this.source.slice(this.index).match(/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/);
    if (!match) {
      this.fail("invalid number");
    }
    this.index += match[0].length;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) {
      this.fail("non-finite number");
    }
    if (Number.isInteger(value) && !Number.isSafeInteger(value)) {
      this.fail("integer outside the I-JSON safe range");
    }
    return value;
  }

  parseArray(location) {
    const result = [];
    this.expect("[");
    this.skipWhitespace();
    if (this.source[this.index] === "]") {
      this.index += 1;
      return result;
    }
    while (true) {
      result.push(this.parseValue(`${location}[${result.length}]`));
      this.skipWhitespace();
      if (this.source[this.index] === "]") {
        this.index += 1;
        return result;
      }
      this.expect(",");
      this.skipWhitespace();
    }
  }

  parseObject(location) {
    const result = Object.create(null);
    const keys = new Set();
    this.expect("{");
    this.skipWhitespace();
    if (this.source[this.index] === "}") {
      this.index += 1;
      return result;
    }
    while (true) {
      if (this.source[this.index] !== '"') {
        this.fail("object key must be a string");
      }
      const key = this.parseString(`${location} key`);
      if (keys.has(key)) {
        this.fail(`duplicate object key ${JSON.stringify(key)}`);
      }
      keys.add(key);
      this.skipWhitespace();
      this.expect(":");
      this.skipWhitespace();
      Object.defineProperty(result, key, {
        configurable: true,
        enumerable: true,
        value: this.parseValue(`${location}.${key}`),
        writable: true
      });
      this.skipWhitespace();
      if (this.source[this.index] === "}") {
        this.index += 1;
        return result;
      }
      this.expect(",");
      this.skipWhitespace();
    }
  }

  parseValue(location) {
    this.skipWhitespace();
    const character = this.source[this.index];
    if (character === '"') return this.parseString(location);
    if (character === "{") return this.parseObject(location);
    if (character === "[") return this.parseArray(location);
    if (character === "-" || /[0-9]/.test(character ?? "")) return this.parseNumber();
    for (const [token, value] of [["true", true], ["false", false], ["null", null]]) {
      if (this.source.startsWith(token, this.index)) {
        this.index += token.length;
        return value;
      }
    }
    this.fail("invalid JSON value");
  }

  parse() {
    const value = this.parseValue("$");
    this.skipWhitespace();
    if (this.index !== this.source.length) {
      this.fail("trailing data");
    }
    return value;
  }
}

export function parseStrictJsonBytes(bytes) {
  let source;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    invalid(`invalid UTF-8: ${error instanceof Error ? error.message : String(error)}`);
  }
  return new StrictJsonParser(source).parse();
}

export function canonicalize(value, location = "$") {
  if (value === null || typeof value === "boolean") {
    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`non-finite number at ${location}`);
    }
    if (Number.isInteger(value) && !Number.isSafeInteger(value)) {
      invalid(`integer-valued number outside the Workbench safe range at ${location}`);
    }
    return Object.is(value, -0) ? "0" : JSON.stringify(value);
  }

  if (typeof value === "string") {
    assertUnicodeScalarString(value, location);
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item, index) => canonicalize(item, `${location}[${index}]`)).join(",")}]`;
  }

  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys
      .map((key) => {
        assertUnicodeScalarString(key, `${location} key`);
        return `${JSON.stringify(key)}:${canonicalize(value[key], `${location}.${key}`)}`;
      })
      .join(",")}}`;
  }

  invalid(`unsupported value at ${location}`);
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
  try {
    if (process.argv.length !== 3) {
      invalid("usage: canonical-json.mjs <json-file>");
    }
    process.stdout.write(canonicalize(parseStrictJsonBytes(readFileSync(process.argv[2]))));
  } catch (error) {
    process.stderr.write(`canonical-json: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}
