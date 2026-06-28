# WP_Discovery Protocol Specification

**📖 Website &amp; docs: [heera.github.io/wp-discovery-protocol](https://heera.github.io/wp-discovery-protocol/)**

[![ci](https://github.com/heera/wp-discovery-protocol/actions/workflows/ci.yml/badge.svg)](https://github.com/heera/wp-discovery-protocol/actions/workflows/ci.yml)
[![JSON Schema – wire-format 1.0](https://img.shields.io/badge/JSON_Schema-wire--format_1.0-1f7a63?logo=json&logoColor=white)](https://heera.github.io/wp-discovery-protocol/schemas/discovery/1.0/discovery.schema.json)
[![Conformance – MUST/SHOULD/MAY](https://img.shields.io/badge/conformance-MUST%2FSHOULD%2FMAY-1f7a63)](spec/08-conformance.md)

> **Status:** Draft · Specification document **v0.1.0** · Discovery Document wire-format **1.0**
> **Type:** RFC-*style* design document (in the sense of React RFCs, Rust RFCs, and Kubernetes design docs) — **not** an IETF RFC and **not** an internet standard.
> **Initiated by:** Sheikh Heera · **Reference implementation:** ~~Agentomatic~~ [Agentimus](https://github.com/heera/agentimus) (WordPress plugin)
> **License:** [CC BY 4.0](LICENSE)

The **WP_Discovery Protocol** defines a machine-readable *discovery layer* for WordPress sites so that AI agents, integrations, and crawlers can understand **what a site is**, **what it exposes**, and **how to interact with it** — without any prior knowledge of which plugins are installed.

Today, a WordPress site's capabilities are scattered across the REST API root, individual plugin APIs, SEO meta tags, `llms.txt`, `security.txt`, and assorted custom endpoints. There is no single, normalized place a consumer can look. WP_Discovery is that place.

## Core principle

```
plugins declare capabilities  →  WP_Discovery aggregates / normalizes  →  consumers read only the discovery layer, never query plugins directly
```

Plugins declare their **capabilities** (intent, in dot-notation such as `commerce.products.read`) through a registration hook. WP_Discovery collects, validates, normalizes, de-duplicates, and merges those declarations into a single Discovery Document. Consumers read **only** that document; they never need to probe individual plugins.

This cuts both ways. The same document that *advertises* what a site can do also marks the **boundary** of what the site has deliberately chosen to expose to automated readers — its **declared scope**. A well-behaved consumer treats that published surface as exactly that: it reads what was offered and verifies each capability at the endpoint, rather than fishing for surface the site never advertised. The producing side of this contract is the [Registry Contract](spec/04-registry-contract.md); the consuming side is the [Consumer Contract](spec/07-consumer-contract.md). Like `robots.txt`, the boundary is a cooperative norm, not a lock — actual access control stays at the endpoint (see the [Security Model](spec/06-security-model.md)).

## Pipeline

```
Plugin → Capability Declaration → WP_Discovery Registry → Normalized Discovery Model → /.well-known/discovery.json → AI / Agents / Systems
```

## What "WP_Discovery compliant" means

A site (or the plugin that powers it) is **WP_Discovery compliant** when it:

1. Exposes a valid `/.well-known/discovery.json` containing the required envelope keys (see [conformance](spec/08-conformance.md));
2. Implements the registry and the `wpdiscovery_register` hook so any plugin can declare capabilities; and
3. Advertises the document with a `Link: …; rel="discovery"` header.

See [spec/08-conformance.md](spec/08-conformance.md) for the full MUST/SHOULD/MAY checklist and the **WP_Discovery compliant** badge concept.

## Quick links

- [SPECIFICATION.md](SPECIFICATION.md) — master document and table of contents
- [FAQ.md](FAQ.md) — relationship to `llms.txt`, `/wp-json`, OpenAPI, MCP & the Abilities API (why this isn't a duplicate)
- [terminology.md](terminology.md) — RFC 2119 keywords + glossary
- [versioning.md](versioning.md) — semantic versioning and the v0.1-doc vs 1.0-wire distinction
- [spec/00-introduction.md](spec/00-introduction.md) — problem statement, goals, non-goals
- [spec/02-discovery-model.md](spec/02-discovery-model.md) — the Discovery Document, field by field
- [spec/03-capability-model.md](spec/03-capability-model.md) — capability naming convention
- [spec/04-registry-contract.md](spec/04-registry-contract.md) — the registration contract
- [spec/05-well-known-endpoints.md](spec/05-well-known-endpoints.md) — `/.well-known` routing
- [spec/06-security-model.md](spec/06-security-model.md) — what may safely be exposed; the threat model
- [spec/07-consumer-contract.md](spec/07-consumer-contract.md) — what a cooperative agent does with the document (read only the declared scope)
- [spec/08-conformance.md](spec/08-conformance.md) — conformance requirements
- [examples/discovery.json](examples/discovery.json) — a complete valid Discovery Document
- [schemas/README.md](schemas/README.md) — the Discovery Document JSON Schema, field by field
- [clients/wpd-inspect/](clients/wpd-inspect/) — reference consumer + conformance-checker CLI
- [implementations/wordpress-plugin/README.md](implementations/wordpress-plugin/README.md) — the reference implementation

## How to participate

This is a living, RFC-style specification. Proposals are welcome as pull requests that follow the **problem → proposal → conformance impact** format described in [CONTRIBUTING.md](CONTRIBUTING.md). Substantive changes to the frozen wire-format (renaming or removing a resource field, the hook name, or an envelope key) are **breaking** and require a major version bump — see [versioning.md](versioning.md).

The canonical reference implementation is the **Agentimus** WordPress plugin, which lives in the parent directory of this specification repository. See [implementations/wordpress-plugin/README.md](implementations/wordpress-plugin/README.md).
