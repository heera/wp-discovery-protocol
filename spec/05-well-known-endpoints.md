# 05 — Well-Known Endpoints

WP_Discovery serves its documents through a `/.well-known/` **front controller**. This section specifies the required and generated endpoints, the precedence rules, the 404 behavior, the `add_well_known()` mechanism, the advertised Link header, and the REST routes.

## Required: `/.well-known/discovery.json`

A conforming site **MUST** expose the canonical index at:

```
/.well-known/discovery.json
```

This is the Discovery Document specified in [02-discovery-model.md](02-discovery-model.md). It is served as `application/json`.

## Generated: agent card + alias

The engine **ALSO** generates an A2A-style agent card, minted from every Resource carrying an `agent` fragment (see [04-registry-contract.md](04-registry-contract.md)):

```
/.well-known/agent-card.json      (canonical agent card)
/.well-known/agent.json           (alias of agent-card.json)
```

Both appear in the Discovery Document's `well_known[]` with `source: "generated"`.

## Precedence: a real file always wins

The front controller **MUST NOT shadow real files.** If a request for a `/.well-known/` path reaches PHP and a real file exists on disk for it, the controller streams that file and does nothing else. A real disk file **outranks** every generated or plugin-managed document of the same name. This guarantees that, for example, an operator who drops a hand-written `/.well-known/security.txt` on disk always wins over any plugin that would otherwise serve one.

## 404 behavior

- An **unknown flat name** under `/.well-known/` (one the controller does not recognize and for which no file exists) MUST return a clean **404** — **not** the site homepage. Consumers rely on this to probe cleanly.
- **Nested paths** (those containing a `/` below `/.well-known/`, e.g. ACME challenge paths like `/.well-known/acme-challenge/<token>`) are **left untouched** by the controller, so existing tooling continues to work.

## Registering a well-known document: `add_well_known()`

A provider MAY register a document to be served under `/.well-known/` via the Registry:

```php
$registry->add_well_known([
    'name'         => 'security.txt',
    'content_type' => 'text/plain',
    'callback'     => fn() => "Contact: mailto:security@example.com\n",
]);
```

A registration supplies the served content via one of:

- `callback` — a callable returning the body;
- `redirect` — a URL to redirect to; or
- `file` — a path whose contents are streamed.

Precedence rules for served well-known documents:

- **First claimant wins** among plugin-managed documents — if two providers register the same `name`, the first to register holds it.
- **A real file on disk outranks all** plugin-managed documents (see precedence above).

Plugin-managed documents appear in the Discovery Document's `well_known[]` with `source: "managed"`; real disk files appear with `source: "file"`; generated documents with `source: "generated"`.

## Advertised Link header

On **every front-end response**, the site MUST advertise the Discovery Document with a Link header. It SHOULD use the registered `service-desc` relation ([RFC 8631](https://www.rfc-editor.org/rfc/rfc8631) — "a machine-readable description of the service") so standards-aware clients recognize it, and MAY additionally emit the protocol's own `discovery` relation:

```
Link: <https://example.com/.well-known/discovery.json>; rel="service-desc"; type="application/json"
Link: <https://example.com/.well-known/discovery.json>; rel="discovery"; type="application/json"
```

This lets a consumer discover the document from any page without first guessing the well-known path.

## REST routes

The engine also exposes the Discovery Model over the WordPress REST API:

| Route | Access | Purpose |
|---|---|---|
| `GET /wp-json/agentimus/v1/discovery` | public | The live Discovery Document envelope (same model as `/.well-known/discovery.json`). |
| `GET /wp-json/agentimus/v1/validate` | **admin-only** | Validation notices for CI — surfaces the same rejection reasons as the admin Validation screen. |

The `validate` route **MUST** be admin-gated; it is intended for continuous integration and operators, not anonymous consumers.

The REST **namespace** (`agentimus/v1`) is **implementation-specific** — `agentimus` is the reference implementation's vendor prefix, not part of the protocol. A consumer SHOULD reach these routes via URLs the Discovery Document provides rather than hard-coding the namespace; the canonical, implementation-neutral entry point is always `/.well-known/discovery.json` (see [Document identity](02-discovery-model.md)).

## Optional documents

A site MAY additionally expose conventional documents that the protocol references but does not define:

- `/.well-known/security.txt` — surfaced in the envelope's `trust.security_txt` when present.
- `/llms.txt` and `/llms-full.txt` — surfaced in the envelope's `documents`.
- Standard **auth-metadata** documents — OAuth 2.0 Authorization Server Metadata ([RFC 8414](https://www.rfc-editor.org/rfc/rfc8414)) at `/.well-known/oauth-authorization-server`, OpenID Connect Discovery at `/.well-known/openid-configuration`, and OAuth 2.0 Protected Resource Metadata ([RFC 9728](https://www.rfc-editor.org/rfc/rfc9728)) at `/.well-known/oauth-protected-resource` — are **referenced, not served** by the engine. When the site publishes one, it is linked from the relevant `apis[].auth.docs` and, for a live MCP server, from the experimental MCP descriptor. The protocol points at these settled standards rather than defining its own auth-discovery handshake.

See [02-discovery-model.md](02-discovery-model.md) for how these flow into the envelope, and [06-security-model.md](06-security-model.md) for what may safely be exposed.
