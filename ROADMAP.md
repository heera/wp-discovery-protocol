# Roadmap

What is deferred beyond wire-format **1.0**, how each item is classified
(**1.x-additive** vs a breaking **2.0**), and the decision about *when* a 2.0 is
warranted. Complements the trust roadmap in
[spec/06-security-model.md](spec/06-security-model.md) and the change rules in
[versioning.md](versioning.md).

## Decision: do not manufacture a 2.0

The wire-format is built to **grow without a major bump** — the JSON Schema
tolerates unknown fields on nested objects and consumers must-ignore-unknown
(M2). Combined with the rule that `trust` extends *additively where possible*
(spec/06), almost everything on the horizon lands in **1.x**. A **2.0** is
reserved for an *unavoidable* break, and must never be *driven* by a feature
that could ship additively.

## What forces a 2.0 (the cut-line)

Per [versioning.md](versioning.md), a change is breaking — and therefore 2.0 —
only if it:

- renames or removes one of the eleven core envelope keys or a frozen Resource field,
- renames the canonical hook (`wpdiscovery_register`) or `register()`, or
- tightens a type/rule so a valid 1.0 document becomes invalid.

Everything else is a 1.x minor (or a patch).

## Triage

| Item | Breaking? | Lands in | Notes |
|---|---|---|---|
| Document signing — `trust.signed`, `jwks_uri`, `issued_at`, `expires` (JWS) | No | **1.x** | New optional `trust` fields. Sign via a *detached* JWS / signature field — never by wrapping the JSON. spec/06 Stage 1. |
| HTTP Message Signatures (RFC 9421) | No | **anytime** | Response header; does not touch the wire-format. |
| Provider attestation | No | **1.x** | New optional `provider`/Resource fields. spec/06 Stage 2. |
| Portable identity / DID | No | **1.x** | New optional `trust` field. spec/06 Stage 3. |
| Scoped discovery | No | **1.x** | A serving policy (which document an authed consumer receives), not a schema change. spec/06. |
| MCP graduation (`mcp.json` → first-class) | No | **1.x** | A new `well_known` entry / `x-` key; the core eleven stay untouched. |
| Cross-CMS bindings (Drupal, Ghost, …) | No | **n/a** | Implementation portability, not a wire change. spec/01. |
| **`identity` → schema.org JSON-LD node** | **Yes** | **2.0** | Renames fields inside a core key (`role`→`jobTitle`, `contacts`→`contactPoint`, adds `@context`/`@type`). The only genuinely breaking item on the horizon. |

## The one 2.0 item: `identity` → JSON-LD

- **1.0:** `{ type, name, role, about, url, same_as, contacts:[{type,value}] }` — already a near-1:1 reskin of schema.org `Person`/`Organization`.
- **2.0 target:** a real JSON-LD node (`@context`, `@type`, `jobTitle`, `description`, `sameAs`, `contactPoint`) — drop-in for generic linked-data tooling.
- **Additive alternative (preferred near-term):** embed the JSON-LD representation as an optional `identity.jsonld` (or a top-level `x-jsonld`) *alongside* the 1.0 fields. That delivers the interop in 1.x; the 2.0 reshape then becomes a *cleanup* (dropping the duplication), not a capability gain.

## Signing is demand-gated (key management is the crux)

Document signing is the headline post-1.0 security item, but it is **gated on
real demand**, not scheduled — for two concrete reasons:

1. **No consumer requires it yet.** Until an agent takes a consequential,
   irreversible action on the document (the scenario spec/06 names), signing's
   marginal value over TLS + domain control is low, and the payload is public
   metadata with no secrets (T7).
2. **WordPress key management is hard and risky.** Signing needs a private key.
   On typical WordPress hosting (no HSM/KMS) it lives in the DB or filesystem,
   inside the same trust boundary as the code; a compromised key produces
   *false* assurance — worse than honest unsigned. Solve key storage/rotation
   before shipping signing, or it is a net negative.

When signing does ship, it ships **optional** (a consumer opts into
verification), which keeps it 1.x.

## When a 2.0 does happen — migration

- New immutable `$schema` at `…/discovery/2.0/`; `spec_version: "2.0"`.
- **Dual-serve** 1.0 and 2.0 through a transition window; consumers select on `spec_version`.
- The reference implementation bumps `SPEC_VERSION` and repoints `$schema` (or uses the `agentimus_schema_url` filter for the transition).
- Deprecate 1.0 on a published date; do not delete it abruptly.
- Bundle the `identity` reshape — and any other accumulated breaks — into that single cut.

## Sequence

1. **Adoption before surface.** Ship the reference implementation on a real site and validate the live document with a real consumer. Real usage — not more spec — sets the next priority.
2. **1.x security roadmap, additively, when demanded:** optional signing (spec/06 Stage 1) → provider attestation (Stage 2) → DID (Stage 3).
3. **2.0 only when forced**, with the `identity` cleanup riding along.
