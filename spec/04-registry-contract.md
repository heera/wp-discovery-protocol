# 04 — The Registry Contract

This section specifies how providers declare Resources, the full Resource schema (frozen at wire-format `1.0`), the sub-objects, validation behavior, provider auto-attribution, and the aggregation rules that turn declarations into the Discovery Model.

```
Plugin → Capability Declaration → WP_Discovery Registry → Normalized Discovery Model → /.well-known/discovery.json → AI / Agents / Systems
```

## Registration: the `wpdiscovery_register` hook

A provider registers by hooking the canonical `wpdiscovery_register` action; the Registry object is passed in. This creates **zero hard dependency**: if no WP_Discovery engine is active, the action simply never fires, and the provider needs no guard. The hook name is **vendor-neutral** — any conforming engine fires it, not just the reference implementation. An engine MAY *additionally* fire its own product-branded alias for back-compat (the reference implementation, Agentomatic, also fires `agentomatic_register`), but a provider SHOULD hook only the canonical `wpdiscovery_register`.

```php
add_action( 'wpdiscovery_register', function ( $registry ) {
    $registry->register([
        'id'           => 'acme-bookings',
        'title'        => 'Acme Bookings',
        'type'         => 'scheduling',
        'capabilities' => [ 'scheduling.availability.read', 'scheduling.booking.create' ],
        'endpoints'    => [ [ 'url' => '/wp-json/acme/v1', 'type' => 'rest', 'auth' => 'apikey' ] ],
    ]);
} );
```

### Global facade (implementation-provided)

An engine MAY also expose an equivalent **global facade** for direct calls. Because a direct call would fatal when no engine is present, it MUST be guarded with `class_exists`. The facade's class name is **implementation-specific** — the reference implementation provides `Agentomatic_Discovery` (deliberately *not* `WP_Discovery`, to avoid the reserved `WP_` class prefix):

```php
if ( class_exists('Agentomatic_Discovery') ) {
    Agentomatic_Discovery::register([
        'id'    => 'acme-bookings',
        'title' => 'Acme Bookings',
        'type'  => 'scheduling',
        // …
    ]);
}
```

### `register()` vs `add()`

`register()` is the **canonical** method. `add()` is a **retained alias** with identical behavior. New code SHOULD use `register()`.

## The Resource schema (frozen at wire-format 1.0)

One registered thing = one **Resource**. The schema is frozen at wire-format `1.0`; renaming or removing any field below is a breaking change (see [versioning.md](../versioning.md)).

| Field | Type | Req | Rules |
|---|---|---|---|
| `id` | string | **REQUIRED** | Unique slug. MUST match regex `^[a-z0-9](-?[a-z0-9]+)*$`. |
| `title` | string | **REQUIRED** | Human-readable label. |
| `type` | string | **REQUIRED** | Controlled vocabulary (below) **or** an `x-<vendor>-<name>` extension token. |
| `description` | string | optional | One sentence. |
| `version` | string | optional | Provider/resource version (e.g. `"9.4.1"`). |
| `capabilities` | string[] | optional | Dot-notation intent verbs, e.g. `commerce.products.read`. See [03-capability-model.md](03-capability-model.md). |
| `abilities` | string[] | optional | Names of **WordPress Abilities API** units (`wp_get_abilities()`) that *execute* the intent in `capabilities` — the executable bridge, not the intent itself. See [03-capability-model.md](03-capability-model.md). |
| `tools` | Tool[] | optional | MCP-shaped tool definitions, typically *projected* from the Abilities registry rather than hand-authored. |
| `endpoints` | Endpoint[] | optional | A bare string shorthand coerces to `{url, type:"rest"}`. |
| `schemas` | string[] | optional | URLs to OpenAPI / JSON-Schema / GraphQL SDL documents. |
| `auth` | Auth | optional | Defaults to `{type:"none"}`. |
| `well_known` | WellKnown[] | optional | Well-known documents this Resource references. |
| `agent` | AgentCard | optional | A2A-style fragment; its presence lists the Resource under the envelope's `agents[]`. |
| `docs` | string (URL) | optional | Human documentation URL. |
| `provider` | object | **AUTO** | Filled by the collector via backtrace as `{plugin}`. Author-supplied values are **overwritten**. |

### Controlled `type` vocabulary

```
content, commerce, scheduling, courses, forms, crm, auth,
search, media, messaging, analytics, payments, directory, agent
```

Or an `x-<vendor>-<name>` extension token (e.g. `x-acme-loyalty`) for domains the vocabulary does not yet cover.

## Sub-objects

### Endpoint

```
{ url (REQUIRED), type: rest|graphql|mcp|openapi|a2a|soap|rpc, methods: string[], auth: string (scheme name), description }
```

A bare string is coerced to `{ url: "<string>", type: "rest" }`. The `auth` here is a **scheme name** (e.g. `"none"`, `"apikey"`), and **per-endpoint `auth` wins over the Resource-level `auth`** when deriving `apis[]`.

### Auth

```
{ type: none|apikey|basic|oauth2|oidc|custom, oidc: url, scopes: string[], docs: url }
```

Defaults to `{ type: "none" }`. The `oidc` field carries an OIDC discovery URL where relevant.

### AgentCard

```
{ name, description, skills: [ { id, description } ], endpoint, auth }
```

A Resource carrying an `agent` fragment is surfaced under the envelope's `agents[]` and contributes to the standalone `agent-card.json`. The example's Store Agent declares three skills: `search_products`, `get_product`, `add_to_cart`.

### Tool

```
{ name (REQUIRED; "name" or "namespace/name"), title, description, inputSchema (JSON Schema), outputSchema (JSON Schema), annotations: { readOnlyHint, destructiveHint, idempotentHint, … : bool }, auth (scheme name) }
```

Mirrors the MCP `tools/list` shape. Tools belong to the *executable* layer beneath the intent expressed in `capabilities` (see [03-capability-model.md](03-capability-model.md)); the reference implementation projects them from the WordPress Abilities API rather than expecting authors to hand-write them.

### WellKnown (referenced)

A Resource MAY list well-known documents it references; these contribute to the envelope's `well_known[]`. To *serve* a well-known document, a provider uses `add_well_known()` — see [05-well-known-endpoints.md](05-well-known-endpoints.md).

## URL handling

All URLs — in `endpoints`, `schemas`, `docs`, `auth.docs`, `auth.oidc`, and the agent `endpoint` — MAY be **site-relative** (`/wp-json/...`). The collector **absolutizes** them in the served output. In the example, the Resource declares `"endpoint": "/wp-json/wc/store/v1"` inside its `agent` fragment, while the derived `agents[]` entry shows the absolutized `https://example.com/wp-json/wc/store/v1`.

## Validation behavior

Registration is validated **synchronously**. An invalid entry is **rejected** with a reason, which is surfaced to an **admin Validation screen** (and to the REST `validate` route — see [05-well-known-endpoints.md](05-well-known-endpoints.md)). Validation enforces, at minimum:

- `id`, `title`, and `type` are present.
- `id` matches `^[a-z0-9](-?[a-z0-9]+)*$`.
- `type` is in the controlled vocabulary or is a well-formed `x-<vendor>-<name>` token.
- Each Endpoint has a `url` and a recognized `type`.
- **Unknown top-level keys are dropped with a warning** (they do not reject the Resource).

## Provider auto-attribution

The collector fills `provider` automatically by inspecting the call stack (backtrace) to determine the originating plugin file, e.g. `{ "plugin": "woocommerce/woocommerce.php" }`. **Any author-supplied `provider` value is overwritten** — attribution is the engine's responsibility, not the provider's.

## Aggregation rules (collect / normalize / dedup / merge)

After collecting accepted Resources, the engine:

1. **Collects** every Resource accepted during the `wpdiscovery_register` pass.
2. **Normalizes** each Resource: coerces string-shorthand endpoints to `{url, type:"rest"}`, absolutizes all URLs, applies `auth` defaults (`{type:"none"}`), and stamps `provider` via backtrace.
3. **De-duplicates** capabilities into the envelope's flat `capabilities` union.
4. **Merges** everything into the Discovery Model, then derives `apis[]`, `agents[]`, and `well_known[]` per the rules in [02-discovery-model.md](02-discovery-model.md) — including emitting one `apis[]` entry per qualifying endpoint so that a public and an authenticated endpoint on the same Resource appear separately.

## Owner authority and the publication boundary

Registration is a **proposal, not a guarantee of publication.** The **site owner** — not the provider — is the final authority over what an implementation advertises about their site. This boundary is what keeps a third-party plugin from publishing claims about a site the owner never consented to.

An implementation:

- **MUST** give the site owner a means to **suppress** any provider-registered Resource from *all* served output — the `/.well-known/discovery.json` envelope, any REST mirror of it, and any derived document (e.g. `llms.txt`). A suppressed Resource is absent everywhere, consistently.
- **MUST NOT** let a provider prevent, detect, or override the owner's suppression. A provider's only contract is that a *valid* registration is *eligible* for publication.
- **MUST NOT** require the owner to edit a provider's Resource *definition* (`capabilities`, `endpoints`, `auth`, …) in order to control publication. Owner control is **inclusion** (publish / suppress); the provider owns the **definition**. Suppression SHOULD therefore be stored as an opt-out keyed by Resource `id`, so it survives the provider later changing that Resource.
- **SHOULD** surface each Resource's `provider` attribution in the owner-facing UI, so the publish/suppress decision is informed.

### Default visibility

Default publication state distinguishes **declared** surface from **inferred** surface:

- A Resource **declared** through `wpdiscovery_register` (an explicit, intentional act by the provider) **SHOULD default to published.** Defaulting it off would silently nullify every integration until the owner discovers a control they have no reason to look for.
- Where an implementation additionally **infers** surface it was never asked to register (e.g. auto-detecting REST namespaces and surfacing them without any `wpdiscovery_register` call), that inferred surface **SHOULD default to suppressed** (opt-in), because nothing declared intent and the inferred set is typically noisy.

This asymmetry — *declared defaults visible, inferred defaults hidden* — is the recommended baseline.

### Higher-risk resources

An implementation **MAY** further default a *declared* Resource to **suppressed** when it advertises **state-changing or authenticated agent action** rather than read-only access — i.e. its `capabilities`, `abilities`, or `tools` describe mutation (creation, modification, deletion, payment) or any tool not marked `readOnlyHint`. Advertising an actionable, state-changing surface to autonomous agents is a consent decision an owner SHOULD make deliberately rather than inherit. Read-only Resources SHOULD retain the default-published baseline.

### Advertisement, not access

Suppression governs **advertisement, not access.** Removing a Resource from discovery hides it from the published map; it does **not** close the underlying endpoint, which remains exactly as reachable as the host platform already makes it. Owners and implementations MUST NOT treat the publication boundary as an access-control or privacy mechanism — that is the host platform's responsibility (see [06-security-model.md](06-security-model.md)).

### Precedence

The resulting authority order, combining this section with the aggregation rules above, is:

```
Owner curation         (publish / suppress)              — final; overrides everything below
   ▲ overrides
Provider declaration   (a registered Resource)           — overrides inferred surface for the same target
   ▲ overrides
Inferred surface       (implementation auto-discovery)   — fallback only; stands down when declared
```

Where an implementation both accepts registrations and infers surface, a provider's declared Resource for a given target (e.g. a REST namespace) **SHOULD** take precedence over the implementation's inferred surface for that same target — the inference stands down rather than producing a duplicate.
