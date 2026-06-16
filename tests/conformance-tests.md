# Conformance Tests

This is a checklist of concrete, testable assertions a WP_Discovery implementation must satisfy. Each maps to one or more requirements in [spec/07-conformance.md](../spec/07-conformance.md). Run these against a live site (or a test fixture) to verify compliance.

## Discovery Document

- [ ] **T1 — Reachable & valid JSON.** `GET /.well-known/discovery.json` returns HTTP 200 with `Content-Type: application/json`, and the body parses as JSON. *(M1)*
- [ ] **T2 — Core keys present.** The parsed object contains the eleven core top-level keys (`$schema, spec_version, site, identity, documents, well_known, apis, agents, resources, capabilities, trust`); any other top-level key is `x-`-prefixed. Key order is *not* asserted. *(M2)*
- [ ] **T3 — Version markers.** `spec_version === "1.0"` and `$schema` ends with `/discovery/1.0/discovery.schema.json`. *(M3)*

## Capabilities

- [ ] **T4 — Deduplicated dot-notation.** `capabilities` is an array of lowercase dot-notation tokens with no duplicates, and equals the union of every Resource's `capabilities`. *(M7)*
- [ ] **T5 — Intent only.** No entry in `capabilities` contains `/`, `wp-json`, an HTTP method, or a query string; concrete paths appear only in `resources[].endpoints[].url`. *(M8)*

## APIs derivation

- [ ] **T6 — Per-endpoint auth honored.** A Resource with a public endpoint (`auth: "none"`) and an authenticated endpoint (`auth: "apikey"`) yields **two** `apis[]` entries under the same `id`, one with `auth.type: "none"` and one with `auth.type: "apikey"`. *(M11)* — verified by the WooCommerce example: `wc/store/v1` (none) and `wc/v3` (apikey).
- [ ] **T7 — Type filter.** Every `apis[]` entry has a `type` in `{rest, graphql, openapi, soap, rpc}`; endpoints of type `mcp` or `a2a` do not appear in `apis[]`.

## Agents & agent card

- [ ] **T8 — Agents derived.** Every Resource carrying an `agent` fragment appears in `agents[]` with an added `id` and `card` (fragment URL into agent-card.json).
- [ ] **T9 — Agent card generated.** `GET /.well-known/agent-card.json` returns valid JSON, and `GET /.well-known/agent.json` returns the same document (alias). *(S2)*

## Well-known front controller

- [ ] **T10 — Unknown flat name → 404.** `GET /.well-known/<random-unknown-name>` returns a clean HTTP 404, **not** the homepage HTML. *(M10)*
- [ ] **T11 — Nested paths untouched.** `GET /.well-known/acme-challenge/<token>` is not intercepted/rewritten by the controller. *(M10)*
- [ ] **T12 — Real file wins.** When a real file exists on disk for a `/.well-known/` path (e.g. a hand-placed `security.txt`), the controller serves that file rather than any generated/managed document of the same name; it appears in `well_known[]` with `source: "file"`. *(M9)*
- [ ] **T13 — Sources labeled.** Each `well_known[]` entry's `source` is one of `file`, `managed`, `generated`, consistent with how it is served.

## Link header

- [ ] **T14 — Link header present.** Every front-end response includes `Link: <…/.well-known/discovery.json>; rel="discovery"; type="application/json"`. *(S1)*

## REST routes

- [ ] **T15 — Live envelope route.** `GET /wp-json/agentify/v1/discovery` returns the same model as `/.well-known/discovery.json`. *(S3)*
- [ ] **T16 — Validate route is admin-gated.** `GET /wp-json/agentify/v1/validate` returns 401/403 for anonymous/non-admin requests and validation notices for an authenticated admin. *(M12)*

## Registration & validation

- [ ] **T17 — Hook fires with Registry.** The `wpdiscovery_register` action fires and passes a Registry object exposing `register()` (and the `add()` alias). *(M4)*
- [ ] **T18 — Synchronous rejection.** Registering an invalid Resource (e.g. an `id` violating `^[a-z0-9](-?[a-z0-9]+)*$`, or a missing `title`) is rejected with a reason visible on the admin Validation screen / `validate` route. *(M5)*
- [ ] **T19 — Provider auto-attribution.** A registered Resource's `provider.plugin` is set by the engine via backtrace, and an author-supplied `provider` value is overwritten. *(M6)*
- [ ] **T20 — Unknown keys dropped.** A Resource submitted with an unrecognized top-level key is accepted with that key dropped and a warning recorded (not rejected).

## Security

- [ ] **T21 — No secrets exposed.** The Discovery Document contains no credentials, API keys, tokens, nonces, internal paths, or private plugin internals; declaring an authenticated capability (e.g. `commerce.orders.write` behind `apikey`) is permitted as metadata. *(M13)*
