# 03 — The Capability Model

A **capability** is the unit of intent in WP_Discovery. It tells a consumer *what a site can do*, in a normalized vocabulary, independent of *how* it does it.

## Naming convention: dot-notation intent verbs

A capability is a lowercase, dot-separated token of the form:

```
<namespace>.<noun>.<verb>
```

For example:

```
commerce.products.read
scheduling.booking.create
content.posts.read
auth.session.create
```

The leading segment is a **namespace** (a domain), the middle segment(s) name the **thing** being acted on, and the final segment is the **verb** (typically `read`, `write`, `create`, `update`, `delete`, or a domain-specific action such as `availability.read`).

Capabilities live in two places in the Discovery Document:

- On each Resource, in its `capabilities` array.
- At the envelope's top level, in `capabilities`, as a deduplicated flatten of all Resources (see [02-discovery-model.md](02-discovery-model.md)).

## Core principle: intent, not implementation

> **A capability describes INTENT. It MUST NOT encode a concrete endpoint path, HTTP method, plugin name, or implementation detail.**

Concrete endpoint paths live **only** in a Resource's `endpoints` field — never in capabilities. This separation is what lets a consumer reason about a site's abilities without caring which plugin provides them or what the URL happens to be.

| | |
|---|---|
| ❌ **Wrong** (implementation) | `/wp-json/wc/v3/products` |
| ❌ **Wrong** (implementation) | `GET /wp-json/wc/store/v1/products` |
| ❌ **Wrong** (plugin-coupled) | `woocommerce.wc_v3.products` |
| ✅ **Right** (intent) | `commerce.products.read` |

The URL `/wp-json/wc/v3/products` belongs in `endpoints[].url`; the intent `commerce.products.read` belongs in `capabilities`. A consumer matches on the capability and *then* looks up the endpoint(s) that realize it.

## Not WordPress capabilities, and not the Abilities API

A WP_Discovery **capability** is a *site-level intent token for external consumers*. The term is chosen deliberately: in the ecosystem that reads this document — A2A Agent Cards, MCP, OAuth/OIDC discovery, LSP — **capabilities** is the established word for "what a system can do." It sits at a different layer from two WordPress concepts it is easily confused with, and is **not** a replacement for either:

- **WordPress role/user capabilities** (`edit_posts`, `manage_options`, …) are a *runtime authorization* model — "may *this user* do X?", checked with `current_user_can()`. A WP_Discovery capability answers "what can *this site* do?", carries no user or role binding, and grants nothing — it is descriptive, never enforced. The two cannot even collide as values: a WP_Discovery capability MUST contain a dot, so a flat cap like `edit_posts` is not a valid token.
- **The WordPress Abilities API** (`wp_get_abilities()`) registers concrete, *executable units*. WP_Discovery does not compete with it — it **consumes** it. A Resource's separate `abilities` field (see [04-registry-contract.md](04-registry-contract.md)) names the Abilities-API units that *execute* the intent its `capabilities` describe, and an implementation MAY project those units into MCP `tools`.

The layering, top to bottom:

| Layer | Field / API | Answers |
|---|---|---|
| Intent (this document) | `capabilities` | what the site can do |
| Executable unit | `abilities` (WP Abilities API) | what core can run |
| Callable tool | `tools` (MCP) | how an agent invokes it |
| Authorization | WordPress role caps | whether a given user may |

`capabilities`, `abilities`, and `tools` are three distinct fields on a Resource, not synonyms — conflating them is a modelling error.

## Suggested namespaces

The following namespaces are RECOMMENDED for common domains. They mirror the controlled `type` vocabulary of the Resource schema (see [04-registry-contract.md](04-registry-contract.md)) but are not exhaustive:

| Namespace | Domain | Example capabilities |
|---|---|---|
| `content.*` | Posts, pages, taxonomies | `content.posts.read`, `content.categories.read` |
| `commerce.*` | Products, cart, checkout, orders | `commerce.products.read`, `commerce.cart.write`, `commerce.checkout.write`, `commerce.orders.read` |
| `scheduling.*` | Availability, bookings | `scheduling.availability.read`, `scheduling.booking.create` |
| `auth.*` | Sessions, accounts | `auth.session.create`, `auth.account.read` |
| `media.*` | Images, files | `media.files.read`, `media.files.write` |
| `forms.*` | Form submissions | `forms.submission.create` |
| `crm.*` | Contacts | `crm.contacts.read` |
| `search.*` | Site search | `search.query.read` |

The eight capabilities in the canonical example all fall under `commerce.*`:

```
commerce.products.read, commerce.categories.read, commerce.cart.write,
commerce.checkout.write, commerce.orders.read, commerce.orders.write,
commerce.customers.read, commerce.coupons.read
```

## Extension tokens (`x-`)

A vendor MAY introduce a capability in a namespace that no suggested namespace covers. Such tokens SHOULD be prefixed `x-<vendor>-` to avoid collisions, mirroring the `x-<vendor>-<name>` extension form used for the Resource `type` field:

```
x-acme-loyalty.points.read
x-acme-loyalty.points.write
```

Consumers MUST NOT reject a Resource solely because it declares an `x-`-prefixed capability they do not recognize. Extension tokens are forward-compatible by construction and require no version bump (see [versioning.md](../versioning.md)).

## Multiple resources, one capability

The envelope's top-level `capabilities` is a **provider-agnostic union**: it answers "can this site do X?", not "who does X?". When more than one Resource declares the same token — e.g. both a store plugin and a subscriptions plugin expose `commerce.products.read` — the token appears **once** at the top level, while each Resource keeps its own entry under `resources[]`.

This is intentional, and it is not a conflict the document resolves. The protocol **describes**; it does not **arbitrate**. A client that has settled on an intent treats the matching Resources as **alternatives** and disambiguates using their metadata — `provider`, `type`, `endpoints`, `auth`, `version`, `description` — or by asking a human. The specification deliberately does **not** designate a single "primary" handler for a capability: two Resources offering the same token may expose genuinely different data, and collapsing them would hide a real capability. A site that wishes to express a preference MAY do so with an `x-`-prefixed extension; the core stays descriptive.

## Rules summary

- A capability MUST be a lowercase, dot-separated intent token.
- A capability MUST NOT contain a URL, HTTP method, query string, or plugin slug.
- A capability SHOULD use a suggested namespace where one fits.
- A vendor-specific capability SHOULD use the `x-<vendor>-` prefix.
- The envelope's top-level `capabilities` MUST be the **deduplicated** union of all Resources' capabilities.
- The top-level `capabilities` union is **provider-agnostic**; when multiple Resources declare the same token they are treated as alternatives, disambiguated by Resource metadata — the document does not name a primary handler.
