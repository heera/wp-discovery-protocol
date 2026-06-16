# wpd-inspect

A reference **consumer** for the WP_Discovery protocol — the other half of the
loop. Producers emit `/.well-known/discovery.json`; `wpd-inspect` reads it the way
an AI agent or integration would: it fetches the document, **checks it against the
protocol's MUST requirements**, prints a human summary, and resolves an intent
(capability) to the endpoint(s) that serve it.

Zero dependencies — Node 18+ (uses the built-in `fetch`).

## Use

```bash
# Inspect a live site (follows the rel="discovery" Link header if present)
node wpd-inspect.mjs https://example.com

# Resolve an intent to its endpoint(s) + auth
node wpd-inspect.mjs https://example.com --capability commerce.products.read

# Check a local document (offline, deterministic — used in CI)
node wpd-inspect.mjs ../../examples/discovery.json

# Machine-readable output (and a non-zero exit if any MUST fails)
node wpd-inspect.mjs ../../examples/discovery.json --json
```

Or, once published, `npx wpd-inspect <target>`.

## What it checks

A consumer-side subset of [spec/07-conformance.md](../../spec/07-conformance.md):
the eleven core keys with `x-`-only extensions (M2), `spec_version` / `$schema`
(M3), intent-only capabilities (M7/M8), and well-formed `apis[]` / `resources[]`.
Strict full-schema validation lives in CI (against
[the JSON Schema](../../schemas/discovery/1.0/discovery.schema.json)); this tool
shows the checks a *client* actually cares about.

Exit codes: `0` conforms · `1` a MUST check failed · `2` could not load/parse.
