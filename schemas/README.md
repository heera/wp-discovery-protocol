# WP_Discovery Document — JSON Schema (wire-format 1.0)

This directory holds the machine-readable contract for a WordPress site's discovery document.

| | |
|---|---|
| **Schema file** | [`discovery/1.0/discovery.schema.json`](discovery/1.0/discovery.schema.json) |
| **Canonical URL** | `https://heera.github.io/wp-discovery-protocol/schemas/discovery/1.0/discovery.schema.json` |
| **Dialect** | JSON Schema **Draft 2020-12** |
| **Validates** | a site's `/.well-known/discovery.json` |

A site publishes its own **data** at `/.well-known/discovery.json`; this schema is the **rulebook** that says what a valid document looks like. The `$schema`/`$id` URL doubles as a version marker (a consumer reads `spec_version` / `$schema` to pick its parser) and as a fetchable target a validator can check against.

> This page is a human-readable mirror of the schema. If a tool (or an AI assistant) can't fetch the JSON, paste **this file** — it reflects the same structure.

## How to validate a document

```bash
# Node (ajv-cli)
npx ajv-cli validate \
  -s schemas/discovery/1.0/discovery.schema.json \
  -d examples/discovery.json --spec=draft2020

# Python (jsonschema)
python -c "import json,jsonschema; \
jsonschema.Draft202012Validator(json.load(open('schemas/discovery/1.0/discovery.schema.json'))) \
.validate(json.load(open('examples/discovery.json')))" && echo OK
```

## The envelope — 11 core keys (all required)

Shown in the canonical serialization order; consumers key by name, so member order isn't significant. Extra top-level keys are allowed **only** if `x-`-prefixed; anything else is rejected (`additionalProperties: false`).

| Key | Type | Meaning |
|---|---|---|
| `$schema` | string (uri) | Points back to this schema. |
| `spec_version` | `"1.0"` (const) | Frozen wire-format version a consumer keys its parser on. Major.minor, **not** semver. |
| `site` | object | Identity of the site as a whole. |
| `identity` | object | The person/organization behind the site. |
| `documents` | object | Links to enabled generators (sitemap, robots, llms, …). |
| `well_known` | array | Every `/.well-known/*` document the site serves. |
| `apis` | array | Machine-callable endpoints, derived from resources. |
| `agents` | array | A2A-style agent descriptors. |
| `resources` | array | The full, normalized resources — the source of truth everything else is derived from. |
| `capabilities` | array of strings | Deduplicated union of all resources' capabilities (intent tokens). |
| `trust` | object | `security_txt`, `policy` (reserved for future signed/attested fields). |

## The three vocabularies (don't conflate them)

A resource can carry **three** distinct, complementary lists:

| Field | What it is | Example | Layer |
|---|---|---|---|
| `capabilities` | **Intent** strings — what the site can do | `commerce.products.read` | contract |
| `abilities` | Names of **WordPress Abilities API** units that execute that intent | `woocommerce/get-product` | executable |
| `tools` | **MCP-shaped** tool definitions (with `inputSchema`, etc.) | `{ "name": "search_products", … }` | callable |

These are **not** synonyms and **not** WordPress role capabilities (`edit_posts`). A WP_Discovery `capability` grants nothing — it's descriptive — and must contain a dot, so a flat WP cap isn't even a valid token. See [`../spec/03-capability-model.md`](../spec/03-capability-model.md).

## Sub-objects (`$defs`)

**`site`** — *required:* `name`, `url` (uri), `description`, `lang`, `logo`. Any may be an empty string if unknown.

**`identity`** — *required:* `type` (`person` | `organization`), `name`, `role`, `about`, `url` (uri), `same_as` (string[]), `contacts` (array of `{type, value}`).

**`documents`** — *optional:* `sitemap`, `robots`, `llms`, `llms_full`, `security` (each a URL string; present only when the generator is enabled).

**`well_known` entry** — *required:* `name`, `url` (uri), `source` (`file` = real file on disk · `managed` = plugin-registered · `generated` = minted by the engine).

**`apis` entry** — *required:* `id`, `type` (`rest` | `graphql` | `openapi` | `soap` | `rpc`), `base` (uri), `schema` (string), `auth` (`{type, docs}`). A public and an authenticated endpoint on the same resource appear as **two** entries under the same `id` (per-endpoint auth wins).

**`agents` entry** — *required:* `name`, `endpoint`, `id`, `card` (uri). *Optional:* `description`, `skills` (array of `{id, description}`), `auth`.

**`resource`** — *required:* `id` (lowercase slug, `^[a-z0-9](-?[a-z0-9]+)*$`), `title`, `type`. *Optional:* `description`, `version`, `capabilities`, `abilities`, `tools`, `endpoints`, `schemas`, `auth`, `well_known`, `agent`, `docs`, `provider` (`{plugin}` — auto-attributed via backtrace, author values overwritten).

**`endpoint`** — *required:* `url`, `type` (`rest` | `graphql` | `mcp` | `openapi` | `a2a` | `soap` | `rpc`). *Optional:* `methods` (string[]), `auth` (scheme name; wins over resource-level auth when deriving `apis`), `description`.

**`auth`** — *required:* `type` (see schemes below). *Optional:* `oidc` (discovery URL), `scopes` (string[]), `docs`. Defaults to `{type: "none"}`.

**`agentCard`** (a resource's `agent` fragment) — *required:* `name`. *Optional:* `description`, `skills`, `endpoint`, `auth`.

**`skill`** — *required:* `id`. *Optional:* `description`.

**`tool`** (MCP-shaped) — *required:* `name` (`"name"` or `"namespace/name"`). *Optional:* `title`, `description`, `inputSchema` (object), `outputSchema` (object), `annotations` (map of booleans — `readOnlyHint`, `destructiveHint`, …), `auth`.

**`trust`** — *optional:* `security_txt`, `policy`.

### Controlled vocabularies

- **`authScheme`** — `none` · `apikey` · `basic` · `oauth2` · `oidc` · `custom`
- **`resourceType`** — `content` · `commerce` · `scheduling` · `courses` · `forms` · `crm` · `auth` · `search` · `media` · `messaging` · `analytics` · `payments` · `directory` · `agent`, **or** an `x-<vendor>-<name>` extension token.
- **`capability`** — a lowercase dot-notation string (`^[a-z0-9-]+(\.[a-z0-9_-]+)+$`), e.g. `commerce.products.read`. Intent only — no URLs or endpoint paths.

## Forward compatibility

- **Top level is closed** to the 11 core keys; growth happens through `x-`-prefixed extension keys, which consumers MUST ignore if unrecognized (*must-ignore-unknown*).
- **Nested objects are tolerant** — they validate their known fields but accept unknown ones, so additive changes don't break validation.
- Renaming/removing a core key or tightening a rule is a **breaking** change → a new wire-format version (`…/discovery/2.0/…`). See [`../versioning.md`](../versioning.md).

For the normative text, see [`../spec/02-discovery-model.md`](../spec/02-discovery-model.md) (envelope) and [`../spec/04-registry-contract.md`](../spec/04-registry-contract.md) (resource contract).
