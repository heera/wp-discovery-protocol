# 02 — The Discovery Model

The **Discovery Document** is the single, normalized JSON document that WP_Discovery serves at `/.well-known/discovery.json`. This section specifies its envelope, every key in it, and the rules by which the engine derives those keys from registered Resources.

## A note on versions (read this first)

The Discovery Document carries `spec_version: "1.0"` and a `$schema` URL under `.../discovery/1.0/`. The `1.0` here is the **frozen wire-format version of the Discovery Document**. It is **not** the same number as the specification document's status, which is **Draft, v0.1.0**. These two numbers are different on purpose: `v0.1.0` describes the maturity of *this written specification*, while `1.0` describes the *stable on-the-wire shape* a consumer parses. See [versioning.md](../versioning.md).

## Envelope: eleven core top-level keys

A conforming Discovery Document MUST contain these eleven **core** top-level keys:

```
$schema, spec_version, site, identity, documents, well_known, apis, agents, resources, capabilities, trust
```

A producer SHOULD serialize them in the order listed above — it is the **canonical** order used throughout this specification, and emitting it deterministically keeps documents readable and diff-friendly. A **consumer MUST NOT depend on key order**: it accesses members by name, JSON object member order is not significant, and JSON Schema cannot assert it. A document whose keys are reordered by a proxy, cache, or re-serializer is still conforming.

The canonical example used throughout this specification is [examples/discovery.json](../examples/discovery.json). All prose below is grounded in that example.

### Extension keys

A document MAY append **extension** keys after the core eleven. Every extension key MUST be `x-`-prefixed (e.g. `x-agentify-mcp`, `x-agentify-tools`) so it can never collide with a core key the specification adds later, and a consumer MUST ignore any top-level key it does not recognize — the *must-ignore-unknown* rule that keeps wire-format `1.0` forward-compatible. The unprefixed namespace is reserved for this specification.

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
"documents": { "sitemap": "https://example.com/wp-sitemap.xml", "robots": "https://example.com/robots.txt", "llms": "https://example.com/llms.txt", "llms_full": "https://example.com/llms-full.txt" }
```

Keys correspond to enabled generators: `sitemap`, `robots`, `llms` (llms.txt), `llms_full` (llms-full.txt), and `security` where present.

### `well_known` — array

Every well-known document the site serves, each `{name, url, source}`:

```json
"well_known": [
  { "name": "discovery.json", "url": "https://example.com/.well-known/discovery.json", "source": "generated" },
  { "name": "agent-card.json", "url": "https://example.com/.well-known/agent-card.json", "source": "generated" },
  { "name": "agent.json", "url": "https://example.com/.well-known/agent.json", "source": "generated" }
]
```

`source` is one of `file` (a real file on disk), `managed` (a plugin-registered document), or `generated` (minted by the engine).

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

- **`apis[]`** ← every Resource endpoint whose `type` ∈ `{rest, graphql, openapi, soap, rpc}`, emitted as `{id, type, base, schema, auth:{type, docs}}`. **Per-endpoint `auth` wins over resource-level `auth`**, so a public Store API and an authenticated admin API on the *same* Resource yield two distinct `apis[]` entries.
- **`agents[]`** ← every Resource with an `agent` fragment. The same set assembles the standalone `agent-card.json`.
- **`well_known[]`** ← the union of real files on disk (`source: "file"`), plugin-managed documents (`source: "managed"`), and generated documents (`source: "generated"`), each `{name, url, source}`.
- **`capabilities[]`** ← a deduplicated flatten of all Resources' `capabilities`.
- **`documents[]`** ← the set of enabled generators (`llms.txt`, `llms-full.txt`, `sitemap`, `robots`, `security`).
- **`trust`** ← minimal in `1.0` (`security_txt`, `policy`); reserved for future signed/attested fields.

All URLs in the output are **absolutized**: providers MAY register site-relative URLs (`/wp-json/...`) and the collector rewrites them to absolute URLs in the served document. See [04-registry-contract.md](04-registry-contract.md) for normalization details.
