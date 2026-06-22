# Reference Implementation — the "~~Agentomatic~~ Agentimus" WordPress plugin

The canonical reference implementation of the WP_Discovery Protocol is the **Agentimus** WordPress plugin. This specification describes the **real, shipped behavior** of that plugin — not an idealized version. Where the prose and the plugin disagree, the disagreement is a bug in one of them and should be filed (see [../../CONTRIBUTING.md](../../CONTRIBUTING.md)).

## Where it lives

The Agentimus plugin is maintained as a **separate project** at **[github.com/heera/agentimus](https://github.com/heera/agentimus)** — the *implementation* — distinct from this *specification* repository (the standard). Keeping the standard and its reference implementation in separate repositories lets the spec stay vendor-neutral while the plugin evolves on its own release cadence. Where the prose and the plugin disagree, that is a bug to be filed against one of them.

## How the spec maps to the plugin

| Specification concept | Plugin component |
|---|---|
| **Registry** ([04](../../spec/04-registry-contract.md)) | the **collector** — receives `wpdiscovery_register` (and the `agentimus_register` alias), exposes `register()` / `add()` and `add_well_known()`, validates synchronously, auto-attributes `provider` via backtrace |
| **Discovery Document / envelope** ([02](../../spec/02-discovery-model.md)) | the **document generator** — normalizes Resources, derives `apis[]` / `agents[]` / `well_known[]` / `capabilities[]`, emits the eleven-key envelope |
| **Well-Known endpoints** ([05](../../spec/05-well-known-endpoints.md)) | the **front controller** — serves `/.well-known/discovery.json`, mints `agent-card.json` + `agent.json`, enforces real-file-wins and clean 404s, adds the `rel="discovery"` Link header |
| **Providers / adapters** ([04](../../spec/04-registry-contract.md)) | the **built-in providers** — bundled adapters that register Resources for popular plugins, e.g. **WooCommerce** (the `commerce` Resource in the example envelope) |

## What you get out of the box

- `/.well-known/discovery.json`, `/.well-known/agent-card.json`, and the `/.well-known/agent.json` alias.
- The canonical `wpdiscovery_register` action (plus the `agentimus_register` back-compat alias) and the `Agentimus_Discovery` facade.
- An **admin Validation screen** showing rejected registrations and their reasons.
- REST routes: `GET /wp-json/agentimus/v1/discovery` (public) and `GET /wp-json/agentimus/v1/validate` (admin-only).
- A `rel="discovery"` Link header on every front-end response.
- Document generators surfaced under the envelope's `documents` (sitemap, robots, `llms.txt`, `llms-full.txt`).

## Registering your own Resource

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

No dependency guard is needed for the hook form: if no WP_Discovery engine is active, `wpdiscovery_register` never fires. For the direct facade form, guard with `class_exists('Agentimus_Discovery')`. See [04-registry-contract.md](../../spec/04-registry-contract.md).

## Conformance

The plugin targets every **MUST** in [08-conformance.md](../../spec/08-conformance.md). The executable checks live in [tests/conformance-tests.md](../../tests/conformance-tests.md).
