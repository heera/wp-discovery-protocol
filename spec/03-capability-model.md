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

## Rules summary

- A capability MUST be a lowercase, dot-separated intent token.
- A capability MUST NOT contain a URL, HTTP method, query string, or plugin slug.
- A capability SHOULD use a suggested namespace where one fits.
- A vendor-specific capability SHOULD use the `x-<vendor>-` prefix.
- The envelope's top-level `capabilities` MUST be the **deduplicated** union of all Resources' capabilities.
