# Versioning

The WP_Discovery Protocol uses **semantic versioning** ([SemVer 2.0.0](https://semver.org/)) for both the specification document and the Discovery Document wire-format. These two version streams are tracked **separately and deliberately carry different numbers**.

## Two version numbers, on purpose

### Specification document status — Draft, **v0.1.0**

The `v0.1.0` number describes the **maturity of this written specification**: its prose, its structure, and the requirements it states. It is a **Draft**. The document MAY change in backward-incompatible ways while it remains below `v1.0.0`. The `v0.1.0` number is a property of *the document you are reading*, not of any data on the wire.

### Discovery Document wire-format — **1.0**

The `1.0` number describes the **frozen on-the-wire shape of the Discovery Document**: its envelope keys, the Resource schema, and the sub-object shapes (Endpoint, Auth, AgentCard). This wire-format is stable at `1.0`. It is the version a consumer parses against.

This is why a live envelope produced by a `v0.1.0` specification still declares:

```json
{
  "$schema": "https://heera.github.io/wp-discovery-protocol/schemas/discovery/1.0/discovery.schema.json",
  "spec_version": "1.0"
}
```

The document maturity (`v0.1.0`) and the wire-format (`1.0`) are intentionally different numbers. Do not "reconcile" them; conflating them is a specification error. This same distinction is restated where it matters most, in [spec/02-discovery-model.md](spec/02-discovery-model.md).

## What counts as a breaking (major) change

A change is **breaking** — and therefore requires a **major** wire-format bump (e.g. `1.0 → 2.0`) — if it would invalidate a consumer that correctly parses the current format. Concretely, a breaking change is any of:

- **Renaming or removing a frozen Resource field** (`id`, `title`, `type`, `capabilities`, `endpoints`, `auth`, …).
- **Renaming the registration hook** (`agentify_discovery_register`) or the Registry's canonical method (`register()`).
- **Renaming or removing one of the eleven envelope keys**, or changing their fixed order.
- Tightening a type or rule such that previously valid documents become invalid.

A major bump changes the `spec_version` and the `$schema` URL (`.../discovery/2.0.json`).

## What counts as an additive (minor) change

A change is **additive** — and therefore a **minor** bump (e.g. `1.0 → 1.1`) — if existing consumers continue to work unchanged. Additive changes include:

- **Adding a new `type` vocabulary term** (e.g. a new controlled-vocab value beyond `content`, `commerce`, …).
- **Adding a new optional field** to a Resource or sub-object.
- **Adding a new document generator** (e.g. a new entry under `documents`).
- **Adding a new well-known source** or a new optional capability namespace.

Consumers MUST ignore unknown optional fields so that minor additions never break them.

## Patch changes

Editorial fixes, clarified prose, corrected examples, and non-normative typo fixes are **patch** changes and do not alter the wire-format.

## Extension tokens are not version changes

Vendors MAY introduce `x-<vendor>-<name>` `type` tokens and `x-`-prefixed capability namespaces at any time without a version bump. Extension tokens are forward-compatible by construction; see [spec/03-capability-model.md](spec/03-capability-model.md).
