# 00 — Introduction

## What WP_Discovery is

The **WP_Discovery Protocol** defines a machine-readable *discovery layer* for WordPress sites. It gives AI agents, integrations, and crawlers a single, predictable, normalized place to learn **what a site is**, **what it exposes**, and **how to interact with it** — without any prior knowledge of which plugins are installed.

The protocol rests on one principle, stated identically throughout this specification:

```
plugins declare capabilities  →  WP_Discovery aggregates / normalizes  →  consumers read only the discovery layer, never query plugins directly
```

## Problem statement

A modern WordPress site is a patchwork of independently-built features. Each feature advertises itself differently, and a consumer that wants to *understand the whole site* must today stitch together at least five disconnected sources:

- **The WordPress REST API root** (`/wp-json/`), which lists namespaces but says nothing about intent — a consumer cannot tell that `wc/v3` means "this site sells products."
- **Individual plugin APIs**, each with its own base path, auth scheme, and (sometimes) documentation, discoverable only if you already know the plugin is installed.
- **SEO meta tags**, which describe the site for search engines but not its machine-actionable capabilities.
- **`llms.txt`**, a content-orientation hint for language models, with no capability vocabulary.
- **`security.txt`** and other **custom or ad-hoc endpoints**, each a one-off.

There is **no unified registry**. A consumer cannot ask one question — "can this site sell me something, book me an appointment, or answer questions about its content, and how?" — and get one normalized answer. Every consumer reinvents the discovery logic, and every plugin that wants to be discoverable must lobby every consumer individually.

WP_Discovery removes this fragmentation by introducing exactly one aggregation point. Plugins declare **intent** through a registration hook; WP_Discovery validates, normalizes, de-duplicates, and merges those declarations; and consumers read the result from a single well-known URL.

## The pipeline

```
Plugin → Capability Declaration → WP_Discovery Registry → Normalized Discovery Model → /.well-known/discovery.json → AI / Agents / Systems
```

1. **Plugin** — any provider on the site.
2. **Capability Declaration** — the provider declares Resources (intent, in dot-notation) via the `wp_discovery_register` hook.
3. **WP_Discovery Registry** — validates each declaration synchronously and collects accepted entries.
4. **Normalized Discovery Model** — the collector coerces shorthand, absolutizes URLs, auto-attributes the provider plugin, de-duplicates capabilities, and merges everything.
5. **`/.well-known/discovery.json`** — the single document served to consumers.
6. **AI / Agents / Systems** — consumers read only this layer.

## Goals

- **One normalized document.** Provide a single Discovery Document with a fixed, frozen envelope so consumers parse one shape.
- **Intent over implementation.** Let plugins declare *what they can do* (`commerce.products.read`) decoupled from *which endpoint does it* (`/wp-json/wc/v3`).
- **Zero coupling for providers.** A provider that registers depends on nothing; if WP_Discovery is absent, the hook never fires and nothing breaks.
- **Predictable retrieval.** Serve the document at a well-known URL and advertise it with a `Link` header on every front-end response.
- **Agent-friendliness.** Surface A2A-style agent cards minted from declared Resources.

## Non-goals

WP_Discovery is a **discovery layer**, not a replacement for the things it points at:

- It **does not replace the WordPress REST API** or any plugin API. It describes and links to them; it does not proxy or supersede them.
- It **does not define authentication systems.** It *describes* the auth a Resource or endpoint expects (`apikey`, `oauth2`, `oidc`, …), but it neither issues nor validates credentials.
- It **does not define runtime or execution semantics.** It tells a consumer that `commerce.cart.write` exists and where; it does not specify how a cart write is performed beyond pointing to the endpoint and its own documentation.
- It **does not invent data.** It exposes metadata that providers declare and the site already makes public.

See [01-scope.md](01-scope.md) for the precise scope, and [02-discovery-model.md](02-discovery-model.md) for the Discovery Document itself.
