# 01 — Scope

## WordPress-native today, general by design

The WP_Discovery Protocol is **WordPress-native today.** Its registration contract is a WordPress action hook (`wp_discovery_register`), its well-known routing is a WordPress front controller, and its reference implementation is a WordPress plugin. The protocol meets WordPress where it is.

At the same time, the protocol is **structurally general enough to become a broader CMS / web discovery standard later.** Nothing about the Discovery Document envelope, the Resource schema, the capability model, or the well-known endpoints is intrinsically tied to WordPress:

- The **Discovery Document** is plain JSON at a well-known URL — readable by any consumer, servable by any platform.
- The **Resource schema** describes generic concepts (a thing, its type, its capabilities, its endpoints, its auth) with no WordPress-specific fields, except the auto-attributed `provider.plugin`, which is the only WordPress-flavored value and is optional metadata.
- The **capability model** is a platform-agnostic dot-notation vocabulary of intent.

WordPress is the first host, not the only conceivable one. The protocol is written so that a future Drupal, Ghost, or bespoke-CMS binding could implement the same wire-format by swapping only the registration mechanism and the front controller.

## Audience

This specification is written for three audiences:

- **Provider authors** — plugin and theme developers who want their features to be discoverable. They care chiefly about [04-registry-contract.md](04-registry-contract.md) and [03-capability-model.md](03-capability-model.md).
- **Consumer authors** — builders of AI agents, integrations, and crawlers who read the Discovery Document. They care chiefly about [02-discovery-model.md](02-discovery-model.md) and [05-well-known-endpoints.md](05-well-known-endpoints.md).
- **Implementers** — those building or auditing a WP_Discovery engine. They care about the whole specification and [07-conformance.md](07-conformance.md).

## In scope

- The **registration contract**: the `wp_discovery_register` hook, an optional implementation-provided direct-call facade, the `register()` / `add()` methods, and synchronous validation.
- The **Resource schema** (frozen at wire-format `1.0`) and its sub-objects: Endpoint, Auth, AgentCard, WellKnown.
- The **aggregation rules**: collection, normalization, URL absolutization, provider auto-attribution, capability de-duplication, and merging.
- The **Discovery Document envelope**: its eleven core top-level keys, their canonical serialization order, and the derivation rules that populate them.
- The **well-known endpoints**: `/.well-known/discovery.json`, the generated `agent-card.json` and `agent.json` alias, the `add_well_known()` mechanism, real-file precedence, 404 behavior, the `rel="discovery"` Link header, and the REST `discovery` and `validate` routes.
- The **capability model**: dot-notation, intent-not-implementation, suggested namespaces, and `x-` extension tokens.
- The **security model** for what may and may not be exposed.
- **Conformance** requirements and the "WP_Discovery compliant" concept.

## Out of scope

- **Authentication and authorization systems.** The protocol *describes* the auth a Resource or endpoint expects; it does not issue, store, or validate credentials, and it defines no token formats or flows.
- **Runtime / execution semantics.** The protocol points a consumer at an endpoint; it does not specify request bodies, response shapes, rate limits, or transactional behavior of those endpoints.
- **Replacing the REST API or plugin APIs.** WP_Discovery is additive metadata that links to existing APIs; it neither proxies nor supersedes them.
- **Content modeling.** The protocol does not define how a site's posts, products, or events are structured internally; it only advertises that such capabilities exist and where to find them.
- **Transport or hosting concerns** beyond serving a JSON document and a Link header.

See [00-introduction.md](00-introduction.md) for the problem statement and the non-goals it shares with this scope.
