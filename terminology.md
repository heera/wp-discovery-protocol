# Terminology

## Requirements keywords (RFC 2119)

The key words below are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119). They are normative wherever they appear in this specification.

| Keyword | Meaning |
|---|---|
| **MUST** / **REQUIRED** / **SHALL** | An absolute requirement of the specification. A conforming implementation has no discretion here. |
| **MUST NOT** / **SHALL NOT** | An absolute prohibition of the specification. |
| **SHOULD** / **RECOMMENDED** | There may exist valid reasons in particular circumstances to ignore this item, but the full implications must be understood and carefully weighed before choosing a different course. |
| **SHOULD NOT** / **NOT RECOMMENDED** | There may exist valid reasons in particular circumstances when the behavior is acceptable or even useful, but the full implications should be understood and weighed first. |
| **MAY** / **OPTIONAL** | An item is truly discretionary. An implementation that omits it MUST be prepared to interoperate with one that includes it, and vice-versa. |

## Glossary

**Registry**
: The server-side object provided by WP_Discovery to which providers submit their declarations. Providers obtain it through the `wpdiscovery_register` action hook (or an optional implementation-provided direct-call facade). Its canonical registration method is `register()`; `add()` is a retained alias. The Registry validates each submission synchronously and collects accepted entries for aggregation.

**Resource**
: One registered "thing" — a self-contained unit describing a feature a site exposes (a store, a booking system, a course catalog, etc.). The Resource schema is the central data structure of the protocol and is frozen at wire-format `1.0`. See [spec/04-registry-contract.md](spec/04-registry-contract.md).

**Capability**
: A dot-notation token expressing **intent**, for example `commerce.products.read` or `scheduling.booking.create`. A capability describes *what can be done*, never *which endpoint does it*. Concrete URLs live only in a Resource's `endpoints` field. See [spec/03-capability-model.md](spec/03-capability-model.md).

**Provider**
: A plugin (or theme, or custom code) that declares one or more Resources to the Registry. Providers depend on nothing: if no WP_Discovery engine is active, the `wpdiscovery_register` hook simply never fires and registration is silently skipped.

**Consumer**
: Any external party — AI agent, integration, crawler, or system — that reads the Discovery Document. Consumers **read only the discovery layer**; they do not query plugins to learn what a site can do.

**Discovery Document**
: The single, normalized JSON document that WP_Discovery aggregates from all registered Resources. It is served as `/.well-known/discovery.json` and carries `spec_version: "1.0"`. Its envelope has eleven core top-level keys, serialized in a canonical (recommended, non-significant) order. See [spec/02-discovery-model.md](spec/02-discovery-model.md).

**Well-Known Endpoint**
: A URL under `/.well-known/` that the protocol serves through a front controller — chiefly `/.well-known/discovery.json`, plus the generated `/.well-known/agent-card.json` and its `/.well-known/agent.json` alias. Providers may register additional well-known documents (e.g. `security.txt`). A real file on disk always takes precedence. See [spec/05-well-known-endpoints.md](spec/05-well-known-endpoints.md).

**Agent Card**
: An A2A-style descriptor of an autonomous agent a site exposes. It is minted from any Resource carrying an `agent` fragment and surfaced both inside the Discovery Document's `agents[]` array and as the standalone `/.well-known/agent-card.json` document.

**Collector / Aggregation**
: The process by which WP_Discovery gathers accepted Resources, normalizes them (coercing shorthand, absolutizing URLs, auto-attributing the provider plugin), de-duplicates capabilities, and merges everything into the Discovery Model that backs the Discovery Document.
