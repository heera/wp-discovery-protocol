# 06 — Security Model

WP_Discovery publishes metadata about a site to anonymous consumers. Its security model therefore centers on **what may and may not be exposed**, and on a clear distinction between *describing* a capability and *exposing* the data behind it.

## Disclosure requirements

- A Discovery Document **MUST NOT** expose sensitive data — secrets, API keys, tokens, credentials, nonces, internal hostnames, database details, or any private plugin internals.
- A Discovery Document **MUST NOT** expose private plugin internals such as option names, table names, file paths, or capability checks that would aid an attacker.
- A site **SHOULD** expose only **public** capabilities — those a consumer could exercise (subject to its own auth) against a public or documented endpoint.

## Metadata is not data

A central nuance: **declaring an authenticated capability is metadata, not data exposure.**

It is acceptable — and useful — for a Resource to declare a capability such as `commerce.orders.write` with an endpoint whose `auth.type` is `apikey`. This tells a consumer that the ability *exists* and *requires credentials*; it does **not** expose any order, any key, or any data. The Discovery Document is advertising the shape of a door, not unlocking it. The example envelope does exactly this: its `wc/v3` endpoint declares `auth.type: "apikey"` alongside the public `wc/store/v1` endpoint, and no credential or private datum appears anywhere in the document.

Consumers MUST still authenticate to the underlying endpoint; the protocol issues and validates nothing (see the non-goals in [00-introduction.md](00-introduction.md)).

## Scoped discovery (future)

The protocol **MAY** support **scoped discovery** in a future version — serving a fuller or different Discovery Document to an authenticated or trusted consumer than to an anonymous one. This is not part of wire-format `1.0`; the `1.0` document is the public view.

## The `trust` key today

In wire-format `1.0`, the envelope's `trust` key is **minimal**: it carries only `security_txt` (a link to the site's `security.txt`) and `policy` (a link to the site's privacy or usage policy). See [02-discovery-model.md](02-discovery-model.md).

## Future: verifiable trust

The `trust` key is **reserved for future expansion** into verifiable trust. None of the following is part of `1.0`; they are explicitly anticipated directions:

- **Signed documents** — signing the Discovery Document with **JWT / JWS** so a consumer can verify it was produced by the claimed site and not tampered with in transit.
- **A `jwks_uri`** advertising the keys used to verify those signatures.
- **Trust chains** — linking a site's discovery claims to an external authority.
- **Plugin attestation** — providers attesting (and the engine verifying) that a declared Resource genuinely originates from the named plugin.
- **Verified providers** — a notion of providers whose declarations have been vouched for.
- **DID** (Decentralized Identifiers) — binding site identity to a verifiable, portable identifier.

When these arrive, they will extend `trust` additively where possible (a minor bump) and only break the wire-format where unavoidable (a major bump). See [versioning.md](../versioning.md).
