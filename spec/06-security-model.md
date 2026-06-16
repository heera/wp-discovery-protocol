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

## Threat model

A consumer of a Discovery Document faces a small, well-defined set of risks. The table states each threat, whether wire-format `1.0` addresses it, and how.

| # | Threat | Addressed in 1.0? | By what |
|---|---|---|---|
| **T1** | **Forged document** — an attacker serves a fake `discovery.json` for a domain they do not control | Yes | TLS + domain control: a consumer trusts the document exactly as far as it trusts that it reached the real origin over HTTPS — the same anchor `robots.txt` / `security.txt` / `llms.txt` rely on. |
| **T2** | **In-transit tampering** (man-in-the-middle) | Yes | HTTPS. A document fetched over plain HTTP carries no integrity guarantee and SHOULD be treated as untrusted. |
| **T3** | **Lying / over-claimed capabilities** — a real site advertises a capability it does not honor | No (by design) | A capability is *advertised intent*, not a guarantee or an authorization. A consumer MUST still authenticate at the endpoint and handle errors; a declaration is a hint, not a contract of behavior. |
| **T4** | **Provider spoofing** — a plugin mislabels a Resource as belonging to another plugin | Partially | The engine auto-attributes `provider` by backtrace (M6), overwriting author-supplied values, so a plugin cannot *cosmetically* claim another's identity. This holds within the site's own code boundary — a plugin already executing on the site is inside the trust boundary. |
| **T5** | **Stale / replayed document** | No | `1.0` documents are unsigned and carry no issued-at / expiry. Consumers rely on HTTP `Cache-Control`; there is no cryptographic freshness guarantee. |
| **T6** | **Capability mistaken for authorization** | Yes | The document grants nothing; `auth` describes what an endpoint *requires* and the endpoint enforces it. See *Metadata is not data*, above. |
| **T7** | **Secret / data leakage via the document** | Yes | The disclosure rules above — metadata only, never secrets or private internals. |

## What 1.0 relies on for authenticity

Wire-format `1.0` is **deliberately unsigned**. Its trust anchors are:

1. **Transport + domain control (HTTPS).** Authenticity is "you reached the real domain over TLS." This is the same well-understood model every other well-known document uses (`robots.txt`, `security.txt`, `llms.txt`, `sitemap.xml`) — none of which is signed — and it is an adequate baseline for a *discovery* layer whose payload is public metadata.
2. **Engine-side provider attribution.** `provider` is stamped by the engine via backtrace (M6), not trusted from the registrant, so the origin plugin of each Resource is as trustworthy as the site's own code.
3. **No-secrets disclosure.** Because the document never contains secrets or private internals, a leaked or cached copy discloses nothing a consumer could not already read from the public site.

A consumer SHOULD fetch the document over HTTPS and MUST treat capabilities as *claims to be verified at the endpoint*, never as authorization. Higher-assurance scenarios — autonomous agents taking consequential actions — are the motivation for the signing roadmap below.

## Scoped discovery (future)

The protocol **MAY** support **scoped discovery** in a future version — serving a fuller or different Discovery Document to an authenticated or trusted consumer than to an anonymous one. This is not part of wire-format `1.0`; the `1.0` document is the public view.

## The `trust` key today

In wire-format `1.0`, the envelope's `trust` key is **minimal**: it carries only `security_txt` (a link to the site's `security.txt`) and `policy` (a link to the site's privacy or usage policy). See [02-discovery-model.md](02-discovery-model.md).

## Roadmap: verifiable trust (post-1.0)

The `trust` key is **reserved for verifiable trust**. None of the following is part of `1.0`; each stage is ordered by the threats it closes and will extend `trust` **additively where possible** (a minor bump), breaking the wire-format only where unavoidable (a major bump — see [versioning.md](../versioning.md)).

### Stage 1 — Document signing (closes/strengthens T1, T2, T5)

Optionally sign the Discovery Document with **JWS** ([RFC 7515](https://www.rfc-editor.org/rfc/rfc7515)), advertise the verification keys via a **`jwks_uri`** in `trust`, and include `issued-at` / `expires` claims so a consumer can verify **origin, integrity, and freshness** independently of TLS. A companion/alternative is **HTTP Message Signatures** ([RFC 9421](https://www.rfc-editor.org/rfc/rfc9421)) over the response itself. The reverse direction — a *consumer* (agent/bot) proving its own identity — aligns with emerging agent-authentication efforts (e.g. Web Bot Auth).

### Stage 2 — Provider attestation (closes T4 across sites)

Let a provider cryptographically attest that a declared Resource genuinely originates from the named plugin/vendor, and let the engine verify it — extending backtrace attribution from "trustworthy within this site" to "verifiable across sites." A related notion is **verified providers**, whose declarations have been vouched for by an authority.

### Stage 3 — Portable site identity (strengthens T1)

Bind site identity to a verifiable, portable identifier via **DID** (Decentralized Identifiers) and/or **trust chains** to an external authority, so a site's discovery claims are verifiable without relying solely on current DNS/TLS control.

Until these ship, `1.0` is honest about its assurance level: a discovery layer secured by **TLS and domain control**, not an attestation system. That is sufficient for reading public capability metadata; it is explicitly *not* sufficient for an agent to treat a declaration as a trusted authorization — which is why capabilities are claims verified at the endpoint, and why signing is the headline post-1.0 work.
