# 07 — Conformance

This section defines what it means to be **WP_Discovery-compliant** and provides a numbered checklist of MUST / SHOULD / MAY requirements. An implementation that satisfies every **MUST** below is compliant; the **SHOULD** and **MAY** items describe recommended and optional behavior.

The corresponding executable assertions are in [tests/conformance-tests.md](../tests/conformance-tests.md).

## Definition

A site (or the engine powering it) is **WP_Discovery-compliant** when it:

1. exposes a valid `/.well-known/discovery.json` carrying the required envelope keys;
2. implements the Registry and the `wpdiscovery_register` hook so any provider may declare capabilities; and
3. advertises the document with a `Link: …; rel="discovery"` header.

## MUST (required for compliance)

- **M1.** The site MUST expose `/.well-known/discovery.json` as valid JSON.
- **M2.** The document MUST contain the eleven **core** top-level keys — `$schema, spec_version, site, identity, documents, well_known, apis, agents, resources, capabilities, trust`. A producer SHOULD serialize them in that (canonical) order, but a consumer MUST NOT depend on key order — member order is not significant and is not enforced. The document MAY append additional **extension** keys, each `x-`-prefixed (e.g. `x-agentimus-mcp`); the unprefixed namespace is reserved for the core. A consumer MUST ignore any top-level key it does not recognize, which is what lets the wire-format grow without a version bump.
- **M3.** `spec_version` MUST be `"1.0"` and `$schema` MUST point at the matching wire-format schema URL.
- **M4.** The engine MUST implement the Registry and fire the canonical `wpdiscovery_register` action, passing the Registry object so providers can call `register()`. It MAY additionally fire a product-branded alias for back-compat.
- **M5.** The engine MUST validate registrations synchronously and reject invalid entries with a reason (surfaced to the admin Validation screen / `validate` route).
- **M6.** The engine MUST auto-attribute each Resource's `provider` via backtrace, overwriting any author-supplied value.
- **M7.** `capabilities` MUST be the deduplicated union of all Resources' capabilities, in dot-notation, free of URLs or implementation detail.
- **M8.** Capabilities MUST express intent only; concrete endpoint paths MUST appear only in `endpoints`, never in `capabilities`.
- **M9.** The `/.well-known/` front controller MUST NOT shadow a real file on disk; if a real file exists it MUST be served.
- **M10.** An unknown flat `/.well-known/` name MUST return a clean 404 (not the homepage); nested paths MUST be left untouched.
- **M11.** The `apis[]` derivation MUST honor per-endpoint `auth` over resource-level `auth`, emitting one entry per qualifying endpoint.
- **M12.** The `GET /wp-json/agentimus/v1/validate` route MUST be admin-gated.
- **M13.** The document MUST NOT expose secrets, credentials, or private plugin internals (see [06-security-model.md](06-security-model.md)).
- **M14.** The engine MUST give the site owner a means to suppress any provider-registered Resource from all served output (envelope, REST mirror, derived documents), and MUST NOT let a provider prevent or override that suppression. Owner control is inclusion, not definition — the owner MUST NOT be required to edit a Resource's fields to suppress it (see [04-registry-contract.md](04-registry-contract.md), "Owner authority").

## SHOULD (recommended)

- **S1.** The site SHOULD advertise `Link: <…/.well-known/discovery.json>; rel="discovery"; type="application/json"` on every front-end response.
- **S2.** The engine SHOULD generate `/.well-known/agent-card.json` and the `/.well-known/agent.json` alias from Resources carrying an `agent` fragment.
- **S3.** The engine SHOULD expose the live envelope at `GET /wp-json/agentimus/v1/discovery`.
- **S4.** Resources SHOULD use a `type` from the controlled vocabulary, falling back to `x-<vendor>-<name>` only when none fits.
- **S5.** Capabilities SHOULD use a suggested namespace (`content.*`, `commerce.*`, …) where one applies.
- **S6.** The site SHOULD populate `documents` with whatever generators are enabled (`sitemap`, `robots`, `llms`, `llms_full`).
- **S7.** A Resource declared through `wpdiscovery_register` SHOULD default to published; surface the implementation merely *infers* (e.g. auto-detected REST namespaces) SHOULD default to suppressed (opt-in).
- **S8.** Where an implementation both accepts registrations and infers surface, a provider's declared Resource for a given target SHOULD take precedence over the inferred surface for that same target (the inference stands down rather than duplicating).
- **S9.** The owner-facing UI SHOULD surface each Resource's `provider` attribution so the publish/suppress decision is informed.

## MAY (optional)

- **A1.** Providers MAY register additional well-known documents via `add_well_known()` (callback, redirect, or file).
- **A2.** Providers MAY supply endpoints as bare-string shorthand; the engine coerces them to `{url, type:"rest"}`.
- **A3.** A Resource MAY declare an `agent` fragment to be surfaced under `agents[]`.
- **A4.** The site MAY expose optional `security.txt`, `llms.txt`, and `llms-full.txt` documents.
- **A5.** A future implementation MAY support scoped discovery and verifiable trust (signed documents, `jwks_uri`, DID, attestation) — none of which are part of wire-format `1.0`.
- **A6.** An implementation MAY default a declared Resource to suppressed (opt-in) when it advertises state-changing or authenticated agent action (mutation, payment, or any tool not marked `readOnlyHint`) rather than read-only access.

## Consumer expectations (the Consumer Contract)

Everything above describes the **engine** a site runs. A **consumer** — an agent, integration, or crawler — is a third party the protocol can neither certify nor compel, but [07-consumer-contract.md](07-consumer-contract.md) defines the behavior a site is entitled to expect from one. In brief:

- **C1.** A consumer SHOULD read capabilities from the Discovery Document (via the well-known path or the advertised Link header) rather than probing plugins or guessing endpoints.
- **C2.** A consumer MUST confirm document identity via `$schema` before trusting the contents.
- **C3.** A consumer MUST treat capabilities as claims to verify at the endpoint, never as authorization.
- **C4.** A consumer SHOULD confine automated interaction to the declared scope, and SHOULD NOT fuzz or probe for undeclared surface.
- **C5.** A consumer SHOULD honor each Resource's declared `auth` scheme rather than attempt unauthenticated access.
- **C6.** A consumer MUST ignore unrecognized top-level / `x-` keys (forward-compatibility).
- **C7.** A consumer SHOULD fetch over HTTPS and treat non-HTTPS or unverifiable documents as untrusted.
- **C8.** A consumer SHOULD identify itself honestly and honor the site's stated crawl/rate expectations (including `robots.txt`).

These are **not** part of the engine's compliance badge; they are the cooperative norms that make the discovery layer worth publishing. See [07-consumer-contract.md](07-consumer-contract.md) for the full text and the rationale for why each is a MUST or a SHOULD.

## The "WP_Discovery compliant" badge

An implementation that satisfies all **MUST** items above MAY describe itself as **WP_Discovery compliant** and display a corresponding badge. The badge asserts only the **MUST** set; it makes no claim about the SHOULD/MAY items. Because this is an RFC-*style* specification and not an IETF standard, the badge is a community signal of conformance, not a certification.
