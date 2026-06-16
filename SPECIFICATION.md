# WP_Discovery Protocol Specification

## Abstract

The **WP_Discovery Protocol** defines a machine-readable discovery layer for WordPress sites. It specifies (a) a server-side **registry** through which any plugin may declare its capabilities, (b) a normalized **Discovery Document** that aggregates those declarations, and (c) a set of **well-known endpoints** through which consumers — AI agents, integrations, and crawlers — retrieve that document. The protocol's guiding principle is that **plugins declare capabilities, WP_Discovery aggregates and normalizes them, and consumers read only the discovery layer** rather than querying plugins directly.

## Status of this document

This is an **RFC-*style*** design document, in the tradition of React RFCs, Rust RFCs, and Kubernetes design proposals. It is **not** an IETF RFC and makes **no** claim to internet-standard status.

This specification was **initiated by Sheikh Heera**, who currently serves as its editor; its canonical **reference implementation** is the [Agentify](implementations/wordpress-plugin/README.md) WordPress plugin. Authorship is recorded to establish provenance, not exclusivity — the protocol is openly licensed ([CC BY 4.0](LICENSE)) and contributions are welcome (see [CONTRIBUTING.md](CONTRIBUTING.md)). Should adoption warrant it, the project is expected to move to a neutral organization with shared governance.

Two version numbers appear throughout this document and are **deliberately different**:

- **Specification document status: Experimental, v0.1.** The prose, structure, and requirements of this document may change.
- **Discovery Document wire-format: 1.0.** The on-the-wire shape of the Discovery Document is frozen at `1.0`. This is why the envelope carries `spec_version: "1.0"` and a `$schema` URL ending in `.../discovery/1.0.json`, even though the specification document itself is only at `v0.1`.

See [versioning.md](versioning.md) for the full rationale.

## Purpose

WordPress capability information is fragmented across the REST API root, individual plugin APIs, SEO meta, `llms.txt`, `security.txt`, and bespoke endpoints. A consumer that wants to know "can this site sell me a product, book me an appointment, or answer questions about its content?" has no single place to look and no normalized vocabulary to read.

WP_Discovery solves this by introducing one aggregation point. Plugins register **intent** (`commerce.products.read`) rather than implementation (`/wp-json/wc/v3/products`); WP_Discovery normalizes those declarations and serves them as a single document at a predictable URL.

```
Plugin → Capability Declaration → WP_Discovery Registry → Normalized Discovery Model → /.well-known/discovery.json → AI / Agents / Systems
```

## Requirements language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119). They are defined for this project in [terminology.md](terminology.md).

## Table of contents

| Section | Document |
|---|---|
| Terminology & RFC 2119 keywords | [terminology.md](terminology.md) |
| Versioning policy | [versioning.md](versioning.md) |
| 00 — Introduction & problem statement | [spec/00-introduction.md](spec/00-introduction.md) |
| 01 — Scope | [spec/01-scope.md](spec/01-scope.md) |
| 02 — The Discovery Model | [spec/02-discovery-model.md](spec/02-discovery-model.md) |
| 03 — The Capability Model | [spec/03-capability-model.md](spec/03-capability-model.md) |
| 04 — The Registry Contract | [spec/04-registry-contract.md](spec/04-registry-contract.md) |
| 05 — Well-Known Endpoints | [spec/05-well-known-endpoints.md](spec/05-well-known-endpoints.md) |
| 06 — Security Model | [spec/06-security-model.md](spec/06-security-model.md) |
| 07 — Conformance | [spec/07-conformance.md](spec/07-conformance.md) |
| Reference implementation | [implementations/wordpress-plugin/README.md](implementations/wordpress-plugin/README.md) |
| Conformance tests | [tests/conformance-tests.md](tests/conformance-tests.md) |
| Example Discovery Document | [examples/discovery.json](examples/discovery.json) |
| Example agent card | [examples/agent-card.json](examples/agent-card.json) |
| Example llms.txt | [examples/llms.txt](examples/llms.txt) |

## Contributing

Proposals follow the **problem → proposal → conformance impact** format described in [CONTRIBUTING.md](CONTRIBUTING.md).
