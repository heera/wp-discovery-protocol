# 07 — The Consumer Contract

The [Registry Contract](04-registry-contract.md) governs the *producing* side: how a provider declares a Resource, and how the site owner decides what is published. This section governs the *consuming* side — what a well-behaved AI agent, integration, or crawler does with the Discovery Document once it has it.

The protocol's guiding sentence has two halves, and together they form a contract in **both** directions:

```
the site declares and publishes a scope  ⇄  the consumer reads only that scope, and verifies it at the endpoint
```

A Discovery Document is at once a **map** and a **boundary**. As a map it advertises what the site can do and where. As a boundary it marks the surface the site has *deliberately chosen to expose* to automated readers — its **declared scope**. A cooperative consumer treats that declared scope as the site's invitation: it reads what was offered, and does not go fishing for surface the site never advertised.

## Courtesy, not enforcement

This boundary is a **cooperative norm, not an access-control mechanism** — the exact mirror of the owner-side rule that suppression is *advertisement, not access* ([04-registry-contract.md](04-registry-contract.md), "Advertisement, not access").

- Absence from the Discovery Document means **"not advertised,"** not **"cryptographically forbidden."** An undeclared endpoint may well remain reachable; the document is a published map, not a firewall.
- A site **MUST NOT** rely on a consumer's good behavior for security. Anything that must not be reached MUST be protected at the endpoint, by authentication and authorization, exactly as if no Discovery Document existed (see [06-security-model.md](06-security-model.md)).
- A cooperative consumer **SHOULD** nonetheless honor the declared scope as the site's stated intent — the same way a polite crawler honors `robots.txt`. `robots.txt` cannot *stop* a crawler; it tells a *considerate* one where it is welcome. The Consumer Contract is the capability-layer counterpart.

Put plainly: the map is not a gate — but a considerate agent keeps to the roads on the map.

## Consumer requirements

A consumer of a Discovery Document:

- **C1 — Read the layer, not the plugins.** A consumer **SHOULD** obtain a site's capabilities from the Discovery Document — reached via `/.well-known/discovery.json` or the advertised `rel="service-desc"` / `rel="discovery"` Link header — rather than probing individual plugins or guessing endpoints. Reading only the layer is the whole point of the layer.
- **C2 — Confirm document identity.** A consumer **MUST** confirm it is reading a WP_Discovery document by inspecting `$schema` (and select its parser on `spec_version`); it **MUST NOT** assume that arbitrary JSON served at the well-known path is one. See [02-discovery-model.md](02-discovery-model.md), "Document identity."
- **C3 — Treat capabilities as claims, never authorization.** A capability is *advertised intent*, not a grant. A consumer **MUST** authenticate at the declared endpoint and handle errors; it **MUST NOT** treat the presence of a capability as permission to perform it. See [06-security-model.md](06-security-model.md), threats **T3** and **T6**.
- **C4 — Stay within the declared scope.** A cooperative consumer **SHOULD** confine automated interaction to the endpoints, capabilities, and well-known documents the Discovery Document declares. It **SHOULD NOT** treat the document as a lead to enumerate, fuzz, or probe for undeclared surface. Surface the site did not advertise was, by omission, not offered for automated use.
- **C5 — Respect the auth a Resource declares.** Where an endpoint or Resource declares an `auth` scheme, a consumer **SHOULD** obtain and present proper credentials through that scheme rather than attempt the capability unauthenticated. A declared `auth.type` other than `none` is the site saying a door is locked; the courteous response is to knock with a key, not to test the handle.
- **C6 — Ignore what you do not understand.** A consumer **MUST** ignore any top-level or extension key it does not recognize (e.g. `x-`-prefixed keys). Unknown keys are how the wire-format grows without a version bump; ignoring them is required for forward-compatibility, not optional politeness. See [08-conformance.md](08-conformance.md), **M2**.
- **C7 — Trust only what transport justifies.** A consumer **SHOULD** fetch the document over HTTPS and treat a document retrieved over plain HTTP — or from a domain it cannot verify — as untrusted. See [06-security-model.md](06-security-model.md), **T1**/**T2**. Until the post-1.0 signing work ships, authenticity is "you reached the real domain over TLS," no more.
- **C8 — Identify yourself, and read at the rate the site invites.** A consumer **SHOULD** identify itself honestly — a descriptive User-Agent today; verifiable agent identity (e.g. Web Bot Auth) as it matures (see [06-security-model.md](06-security-model.md), roadmap) — and **SHOULD** honor the site's stated crawl and rate expectations, including `robots.txt`. Discovery makes a site easier to use automatically; it is not licence to use it harder than the site invites.

## Why this is mostly a SHOULD, not a badge

Conformance and the **WP_Discovery compliant** badge ([08-conformance.md](08-conformance.md)) describe the *engine* a site runs — the producing side, which an operator controls and can certify. A consumer is a third party the protocol can neither certify nor compel. The expectations above are therefore stated as a **contract of good citizenship**: the behavior a site is entitled to expect from an agent that claims to "support WP_Discovery," and the behavior an agent author should be able to point to and say they honor.

**C2**, **C3**, and **C6** are hard **MUST**s because ignoring them yields an *incorrect* consumer, not merely an impolite one. The remainder are the etiquette that makes the discovery layer worth publishing — and the reason a site owner can expose a deliberate scope without fearing that doing so is read as an invitation to probe everything else.

See [08-conformance.md](08-conformance.md) for the consumer-side checklist (C1–C8) alongside the engine's MUST/SHOULD/MAY items, and [04-registry-contract.md](04-registry-contract.md) for the owner-side boundary this section mirrors.
