# FAQ — Relationship to other standards

This document answers the question people ask first: *"Why does this need to exist
alongside `llms.txt` / `/wp-json` / OpenAPI / MCP / the Abilities API?"* The deep
rationale (problem statement, goals, non-goals) lives in
[spec/00-introduction.md](spec/00-introduction.md); this page is the short,
quotable version — and a deliberate place to be honest about what WP_Discovery is
*not*.

The short version: **WP_Discovery does not compete with those technologies. It is
the index that points at them.** It answers one question none of them answers on
its own — *"what does this site expose, and where do I find it?"* — and answers it
**deterministically**, at **one fixed URL**, in a **shared vocabulary**, so a
consumer needs no per-plugin knowledge and no language model just to find its way
around.

## Where it sits

```
Discovery            →   Capability / API surface        →   Authorization
(what & where)           (how to call it)                    (am I allowed?)
WP_Discovery             MCP · Abilities API · REST/OpenAPI   OAuth · WP roles/caps
```

Three different questions, three different layers. WP_Discovery is only the first
one, and it *links to* the other two rather than duplicating them.

## At a glance

| Technology | Answers | Form | WP_Discovery's relationship |
|---|---|---|---|
| **`llms.txt`** | "How should an LLM read this site's content?" | Markdown **prose**, for a model to read | **Complementary.** Discovery *links to* `llms.txt`. Prose needs inference to act on; the Discovery Document is parsed deterministically. |
| **`/wp-json/` (REST root)** | "What namespaces exist?" | JSON list of routes | **Complementary.** The root lists `wc/v3`; it never says that means *"this site sells products."* Discovery adds the intent and points at the route. |
| **OpenAPI** | "What's the exact shape of this one API?" | Per-API contract | **Complementary.** Discovery references an OpenAPI doc as the *how-to-call* detail behind a capability. |
| **MCP** | "How do I call this tool?" | Tool/transport protocol | **Complementary.** Discovery advertises *that* an MCP server exists and *where*; MCP defines the call. The reference plugin even projects its MCP tools from declared capabilities. |
| **WP Abilities API** | "What executable abilities does a plugin define?" | PHP ability registry | **Builds on it.** If a plugin declares abilities, Discovery can advertise them. Define → discover. |
| **schema.org / SEO meta** | "What is this page/entity, for search?" | Human/search metadata | **Complementary.** Describes content for indexing, not machine-actionable capabilities. |
| **WP roles & capabilities** (`edit_posts`…) | "Is *this user* allowed to do X?" | Authorization | **Different layer.** Discovery's capability *tokens* describe what the **site** offers; they grant nothing and never participate in authz. |

## Questions

### Isn't this just `llms.txt`?

No — different job, different consumer. `llms.txt` is **prose written for a language
model to read**; acting on it means an LLM *inferring* structure from text on every
visit (non-deterministic, token-costly, and easy to get wrong). The Discovery
Document is **structured data parsed without any model at all**: a consumer can
fetch it, validate it against a JSON Schema, cache it, and diff it between visits.
And Discovery *points at* `llms.txt` — it's one of the documents the envelope links
to, not a replacement for it.

### Then why not just extend `llms.txt` to carry this?

Because that means embedding a machine vocabulary inside a markdown file — i.e.
reinventing a schema, badly, in prose. Right tool for each job: **prose stays prose
(`llms.txt`); structured capability data stays JSON (`discovery.json`).** If you
pushed `llms.txt` far enough to be reliably machine-parseable, you'd have rebuilt
the Discovery Document with worse ergonomics.

### Isn't `/wp-json/` already discovery?

It's *endpoint* discovery, not *capability* discovery. The REST root tells a
consumer that the namespace `wc/v3` exists; it does **not** tell it that `wc/v3`
means "products" — that requires WooCommerce-specific knowledge baked into the
consumer. WP_Discovery normalizes that to `commerce.products.read` and points at
the route, so any consumer understands it with **zero per-plugin knowledge**.

### Isn't this the (WordPress) Abilities API / a "capabilities API"?

They're complementary and live on different layers. The **Abilities API** *defines
executable abilities*; **WP_Discovery** *advertises* them and everything else a
site exposes, at one well-known URL. If the Abilities API becomes widely adopted,
Discovery references it **more**, not less — the reference plugin already projects
its advertised MCP tools from declared capabilities rather than competing with
them. Define → discover → (authorize).

### Isn't this WordPress' roles & capabilities (`edit_posts`, `manage_options`)?

No. Those answer *"is this user allowed to do X?"* — authorization. WP_Discovery's
capability **tokens** (`commerce.products.read`, `scheduling.booking.create`)
describe *what the site offers*; they grant no permissions and take no part in
access control. A site MUST still enforce real auth at the endpoint
([06-security-model.md](spec/06-security-model.md)).

### Why not just use MCP for all of this?

MCP answers *"how do I call this tool?"*; Discovery answers *"what does this site
expose, and where do I find it — including any MCP server?"* They stack: the
Discovery Document is the index a client reads **first** to learn an MCP endpoint
(or an OpenAPI doc, or `llms.txt`) even exists. It's the entry point, not a rival
transport.

### Why introduce a whole new standard? (cue the XKCD comic 😄)

Fair challenge — and the honest answer is that WP_Discovery invents as **little** as
possible. It reuses established patterns wherever they exist: the `/.well-known/`
convention ([RFC 8615](https://www.rfc-editor.org/rfc/rfc8615)), the spirit of
`security.txt` ([RFC 9116](https://www.rfc-editor.org/rfc/rfc9116)) and `robots.txt`,
OpenAPI for API shape, and A2A-style agent cards. The only genuinely new pieces are
(1) a thin **aggregation/normalization layer** so a consumer reads *one* document
instead of stitching five sources together, and (2) a small **intent vocabulary**
(dot-notation capabilities) — which is meant to be **community-defined**, not
unilaterally minted. Everything else, it points at.

### Who actually consumes this today?

Honestly: the consumer side is **early**, and that's the most important thing to
validate. What exists now is a reference consumer + conformance checker
([clients/wpd-inspect/](clients/wpd-inspect/)) and the reference plugin's own
"verify live" self-check. Crucially, publishing a Discovery Document has **near-zero
cost and degrades gracefully** — if no consumer reads it, nothing breaks; if the
plugin is absent, the registration hook simply never fires. So the proposal is
explicitly *seeking demand-side feedback before investing further* — see
[ROADMAP.md](ROADMAP.md). If it turns out a documented `llms.txt` convention is
sufficient in practice, that's a finding worth discovering now.

### Does this replace the REST API, or my plugin's API?

No. It's a **discovery layer**, not a proxy or a runtime. It *describes and links
to* your APIs; it never supersedes, wraps, or executes them. See the full Non-goals
in [spec/00-introduction.md](spec/00-introduction.md#non-goals).

---

*Found a comparison this page gets wrong, or an objection it doesn't answer? That's
exactly the feedback the project wants — open an issue or PR
([CONTRIBUTING.md](CONTRIBUTING.md)).*
