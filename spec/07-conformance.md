# 07 — Conformance

This section defines what it means to be **WP_Discovery-compliant** and provides a numbered checklist of MUST / SHOULD / MAY requirements. An implementation that satisfies every **MUST** below is compliant; the **SHOULD** and **MAY** items describe recommended and optional behavior.

The corresponding executable assertions are in [tests/conformance-tests.md](../tests/conformance-tests.md).

## Definition

A site (or the engine powering it) is **WP_Discovery-compliant** when it:

1. exposes a valid `/.well-known/discovery.json` carrying the required envelope keys;
2. implements the Registry and the `agentify_discovery_register` hook so any provider may declare capabilities; and
3. advertises the document with a `Link: …; rel="discovery"` header.

## MUST (required for compliance)

- **M1.** The site MUST expose `/.well-known/discovery.json` as valid JSON.
- **M2.** The document MUST contain the eleven **core** top-level keys — `$schema, spec_version, site, identity, documents, well_known, apis, agents, resources, capabilities, trust` — in that order. It MAY append additional **extension** keys after them, each `x-`-prefixed (e.g. `x-agentify-mcp`); the unprefixed namespace is reserved for the core. A consumer MUST ignore any top-level key it does not recognize, which is what lets the wire-format grow without a version bump.
- **M3.** `spec_version` MUST be `"1.0"` and `$schema` MUST point at the matching wire-format schema URL.
- **M4.** The engine MUST implement the Registry and fire the `agentify_discovery_register` action, passing the Registry object so providers can call `register()`.
- **M5.** The engine MUST validate registrations synchronously and reject invalid entries with a reason (surfaced to the admin Validation screen / `validate` route).
- **M6.** The engine MUST auto-attribute each Resource's `provider` via backtrace, overwriting any author-supplied value.
- **M7.** `capabilities` MUST be the deduplicated union of all Resources' capabilities, in dot-notation, free of URLs or implementation detail.
- **M8.** Capabilities MUST express intent only; concrete endpoint paths MUST appear only in `endpoints`, never in `capabilities`.
- **M9.** The `/.well-known/` front controller MUST NOT shadow a real file on disk; if a real file exists it MUST be served.
- **M10.** An unknown flat `/.well-known/` name MUST return a clean 404 (not the homepage); nested paths MUST be left untouched.
- **M11.** The `apis[]` derivation MUST honor per-endpoint `auth` over resource-level `auth`, emitting one entry per qualifying endpoint.
- **M12.** The `GET /wp-json/agentify/v1/validate` route MUST be admin-gated.
- **M13.** The document MUST NOT expose secrets, credentials, or private plugin internals (see [06-security-model.md](06-security-model.md)).

## SHOULD (recommended)

- **S1.** The site SHOULD advertise `Link: <…/.well-known/discovery.json>; rel="discovery"; type="application/json"` on every front-end response.
- **S2.** The engine SHOULD generate `/.well-known/agent-card.json` and the `/.well-known/agent.json` alias from Resources carrying an `agent` fragment.
- **S3.** The engine SHOULD expose the live envelope at `GET /wp-json/agentify/v1/discovery`.
- **S4.** Resources SHOULD use a `type` from the controlled vocabulary, falling back to `x-<vendor>-<name>` only when none fits.
- **S5.** Capabilities SHOULD use a suggested namespace (`content.*`, `commerce.*`, …) where one applies.
- **S6.** The site SHOULD populate `documents` with whatever generators are enabled (`sitemap`, `robots`, `llms`, `llms_full`).

## MAY (optional)

- **A1.** Providers MAY register additional well-known documents via `add_well_known()` (callback, redirect, or file).
- **A2.** Providers MAY supply endpoints as bare-string shorthand; the engine coerces them to `{url, type:"rest"}`.
- **A3.** A Resource MAY declare an `agent` fragment to be surfaced under `agents[]`.
- **A4.** The site MAY expose optional `security.txt`, `llms.txt`, and `llms-full.txt` documents.
- **A5.** A future implementation MAY support scoped discovery and verifiable trust (signed documents, `jwks_uri`, DID, attestation) — none of which are part of wire-format `1.0`.

## The "WP_Discovery compliant" badge

An implementation that satisfies all **MUST** items above MAY describe itself as **WP_Discovery compliant** and display a corresponding badge. The badge asserts only the **MUST** set; it makes no claim about the SHOULD/MAY items. Because this is an RFC-*style* specification and not an IETF standard, the badge is a community signal of conformance, not a certification.
