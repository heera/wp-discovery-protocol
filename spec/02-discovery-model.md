# 02 — The Discovery Model

The **Discovery Document** is the single, normalized JSON document that WP_Discovery serves at `/.well-known/discovery.json`. This section specifies its envelope, every key in it, and the rules by which the engine derives those keys from registered Resources.

## A note on versions (read this first)

The Discovery Document carries `spec_version: "1.0"` and a `$schema` URL under `.../discovery/1.0/`. The `1.0` here is the **frozen wire-format version of the Discovery Document**. It is **not** the same number as the specification document's status, which is **Draft, v0.1.0**. These two numbers are different on purpose: `v0.1.0` describes the maturity of *this written specification*, while `1.0` describes the *stable on-the-wire shape* a consumer parses. See [versioning.md](../versioning.md).

## Document identity: the `$schema` is canonical, the path is not

A Discovery Document is identified by its **`$schema`** and **`spec_version`** — not by the URL it was retrieved from. The well-known path `/.well-known/discovery.json` is the conventional, RECOMMENDED location, and a conforming *site* MUST expose the document there (see [05-well-known-endpoints.md](05-well-known-endpoints.md)) — but the path is **not** the document's identity.

- A consumer **MUST** confirm it is reading a WP_Discovery document by inspecting `$schema` (and select its parser on `spec_version`); it **MUST NOT** assume that arbitrary JSON served at `/.well-known/discovery.json` is one. A document that is mirrored, proxied, cached, or embedded elsewhere is still a Discovery Document if its `$schema` says so.
- A producer **MAY** serve the same document at additional locations — a REST mirror, a CDN copy, an embedded fragment — each carrying the same `$schema`/`spec_version` and equally valid.

This is what makes the chosen filename a non-issue. The protocol does **not** depend on owning the generic `discovery.json` name in any registry: two unrelated documents could occupy the same path and a consumer still tells them apart by `$schema`. Implementations and consumers SHOULD therefore treat `$schema` as the stable contract and the path as a convenience. (The same principle applies one layer down: the REST mirror's namespace is implementation-specific and is *discovered through the document*, never hard-coded — see [05-well-known-endpoints.md](05-well-known-endpoints.md).)

## Envelope: eleven core top-level keys

A conforming Discovery Document MUST contain these eleven **core** top-level keys:

```
$schema, spec_version, site, identity, documents, well_known, apis, agents, resources, capabilities, trust
```

A producer SHOULD serialize them in the order listed above — it is the **canonical** order used throughout this specification, and emitting it deterministically keeps documents readable and diff-friendly. A **consumer MUST NOT depend on key order**: it accesses members by name, JSON object member order is not significant, and JSON Schema cannot assert it. A document whose keys are reordered by a proxy, cache, or re-serializer is still conforming.

The canonical example used throughout this specification is [examples/discovery.json](../examples/discovery.json). All prose below is grounded in that example.

### Extension keys

A document MAY append **extension** keys after the core eleven. Every extension key MUST be `x-`-prefixed (e.g. `x-agentomatic-mcp`, `x-agentomatic-tools`) so it can never collide with a core key the specification adds later, and a consumer MUST ignore any top-level key it does not recognize — the *must-ignore-unknown* rule that keeps wire-format `1.0` forward-compatible. The unprefixed namespace is reserved for this specification.

Experimental or fast-moving surfaces SHOULD be served as their own well-known document rather than inlined here, so they can evolve without touching the frozen core. The reference implementation keeps its MCP descriptor and tool list at [/.well-known/mcp.json](05-well-known-endpoints.md) for exactly this reason, and emits only the core eleven keys in `discovery.json`.

### `$schema` — string (URL)

The JSON-Schema URL for the wire-format. For wire-format `1.0` this is `https://heera.github.io/wp-discovery-protocol/schemas/discovery/1.0/discovery.schema.json`.

### `spec_version` — string

The frozen wire-format version, `"1.0"`. A consumer MUST use this to select its parser.

### `site` — object

Identity of the site as a whole:

```json
"site": { "name": "Example Site", "url": "https://example.com/", "description": "A WordPress site.", "lang": "en-US", "logo": "" }
```

Fields: `name`, `url`, `description`, `lang`, `logo` (any MAY be empty strings if unknown).

### `identity` — object

The person or organization behind the site:

```json
"identity": { "type": "person", "name": "Jane Dev", "role": "Software Developer", "about": "", "url": "https://example.com/", "same_as": [], "contacts": [ { "type": "email", "value": "mailto:jane@example.com" } ] }
```

`type` is `person` or `organization`; `same_as` is an array of profile URLs; `contacts[]` are `{type, value}` pairs.

### `documents` — object

Links to enabled document generators:

```json
"documents": { "sitemap": "https://example.com/wp-sitemap.xml", "robots": "https://example.com/robots.txt", "feed": "https://example.com/feed/", "llms": "https://example.com/llms.txt", "llms_full": "https://example.com/llms-full.txt" }
```

Keys are document names → URLs. The engine emits `sitemap`, `robots`, and `feed` (the site's RSS feed) unconditionally; the `llms` (llms.txt) and `llms_full` (llms-full.txt) pair when those generators are enabled; and `humans` (humans.txt) / `security` (security.txt) where present. The set is **open**: an implementation MAY add further standard documents (e.g. `openapi`, a web-app `manifest`), so a consumer MUST treat `documents` as an extensible name→URL map, not a fixed set. Empty values are omitted.

### `well_known` — array

Every well-known document the site serves, each `{name, url, source}`:

```json
"well_known": [
  { "name": "discovery.json", "url": "https://example.com/.well-known/discovery.json", "source": "generated", "spec": "WP Discovery" },
  { "name": "agent-card.json", "url": "https://example.com/.well-known/agent-card.json", "source": "generated", "spec": "A2A" },
  { "name": "agent.json", "url": "https://example.com/.well-known/agent.json", "source": "generated", "spec": "A2A (legacy)" }
]
```

`source` is one of `file` (a real file on disk), `managed` (a plugin-registered document), or `generated` (minted by the engine). The OPTIONAL `spec` field labels the standard that governs the named document (e.g. `RFC 9116` for `security.txt`, `OpenID Connect Discovery` for `openid-configuration`, `A2A` for `agent-card.json`); it is present only for names the engine recognizes and is **absent — never fabricated** — for the rest. A consumer MUST treat `spec` as advisory.

### `apis` — array

The machine-callable APIs, derived from Resource endpoints (see derivation rules below):

```json
"apis": [
  { "id": "woocommerce", "type": "rest", "base": "https://example.com/wp-json/wc/store/v1", "schema": "", "auth": { "type": "none", "docs": "https://woocommerce.github.io/woocommerce-rest-api-docs/" } },
  { "id": "woocommerce", "type": "rest", "base": "https://example.com/wp-json/wc/v3", "schema": "", "auth": { "type": "apikey", "docs": "https://woocommerce.github.io/woocommerce-rest-api-docs/" } }
]
```

Each entry is `{id, type, base, schema, auth:{type, docs}}`. Note that the public Store API (`auth.type: "none"`) and the authenticated admin API (`auth.type: "apikey"`) appear as **two separate entries under the same `id`**, because per-endpoint auth wins over resource-level auth.

### `agents` — array

A2A-style agent descriptors, derived from Resources carrying an `agent` fragment:

```json
"agents": [
  { "name": "Store Agent", "description": "Browse the catalogue and build a cart via the WooCommerce Store API.", "skills": [ … ], "endpoint": "https://example.com/wp-json/wc/store/v1", "auth": "none", "id": "woocommerce", "card": "https://example.com/.well-known/agent-card.json#woocommerce" }
]
```

Each entry adds `id` (the source Resource id) and `card` (a fragment URL into the standalone agent-card.json) to the declared agent fragment.

### `resources` — array

The full, normalized Resources — the source of truth from which `apis`, `agents`, `well_known`, and `capabilities` are derived. See [04-registry-contract.md](04-registry-contract.md) for the complete Resource schema. In the example, the single `woocommerce` Resource carries two endpoints (public Store API + authenticated admin API), eight capabilities, an `agent` fragment, and an auto-attributed `provider.plugin` of `woocommerce/woocommerce.php`.

### `capabilities` — array

A deduplicated, flattened union of every Resource's capabilities:

```json
"capabilities": [ "commerce.products.read", "commerce.categories.read", "commerce.cart.write", "commerce.checkout.write", "commerce.orders.read", "commerce.orders.write", "commerce.customers.read", "commerce.coupons.read" ]
```

### `trust` — object

Minimal in wire-format `1.0`:

```json
"trust": { "security_txt": "https://example.com/.well-known/security.txt", "policy": "https://example.com/privacy-policy/" }
```

In `1.0`, `trust` carries only `security_txt` and `policy`. The key is **reserved for future expansion**: `jwks_uri`, signed documents (JWS), DID, and plugin attestation are anticipated but **not** part of `1.0`. See [06-security-model.md](06-security-model.md).

## Derivation rules

The engine MUST derive the document from the registered Resources as follows:

- **`apis[]`** ← every Resource endpoint whose `type` ∈ `{rest, graphql, openapi, soap, rpc}`, emitted as `{id, type, base, schema, auth:{type, docs}}`. **Per-endpoint `auth` wins over resource-level `auth`**, so a public Store API and an authenticated admin API on the *same* Resource yield two distinct `apis[]` entries. When a Resource declares no explicit `auth.docs`, an implementation SHOULD fall back to the standard auth-metadata document for the scheme — OAuth 2.0 Authorization Server Metadata ([RFC 8414](https://www.rfc-editor.org/rfc/rfc8414)) or OpenID Connect Discovery — but only when the site actually serves one, so the link is never dead.
- **`agents[]`** ← every Resource with an `agent` fragment. The same set assembles the standalone `agent-card.json`.
- **`well_known[]`** ← the union of real files on disk (`source: "file"`), plugin-managed documents (`source: "managed"`), and generated documents (`source: "generated"`), each `{name, url, source}` plus an OPTIONAL `spec` label for recognized names.
- **`capabilities[]`** ← a deduplicated flatten of all Resources' `capabilities`.
- **`documents`** ← a name→URL map: `sitemap`, `robots`, and `feed` always; `llms` / `llms_full` when enabled; `humans` / `security` when present; extensible with further standard documents.
- **`trust`** ← minimal in `1.0` (`security_txt`, `policy`); reserved for future signed/attested fields.

All URLs in the output are **absolutized**: providers MAY register site-relative URLs (`/wp-json/...`) and the collector rewrites them to absolute URLs in the served document. See [04-registry-contract.md](04-registry-contract.md) for normalization details.
