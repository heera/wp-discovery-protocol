# Contributing to the WP_Discovery Protocol

This specification evolves through an **RFC-style** process modeled on the React, Rust, and Kubernetes design-document workflows. Changes are proposed, discussed in the open, and accepted by consensus. This is **not** an IETF process and confers no internet-standard status.

## Before you propose

- Read [SPECIFICATION.md](SPECIFICATION.md), [terminology.md](terminology.md), and [versioning.md](versioning.md).
- Check whether your idea is **additive** (new optional field, new `type` term, new generator) or **breaking** (renaming/removing a frozen field, the hook, or an envelope key). Breaking changes face a much higher bar — see [versioning.md](versioning.md).
- Confirm the change is consistent with the reference implementation (the Agentify plugin). The specification describes **real, shipped behavior**, not aspiration.

## Proposal format

Open a pull request whose description follows three sections, in order:

### 1. Problem

State the concrete problem in terms of a consumer or provider that cannot do something today. Avoid solutions in this section. Example: "A booking plugin cannot signal that an endpoint requires OAuth2 with specific scopes, because the Auth object only carries a flat `type`."

### 2. Proposal

Describe the change precisely. Specify exact field names, types, and rules. Include at least one concrete JSON snippet showing a Resource or envelope before and after. Use [RFC 2119](terminology.md) keywords correctly (MUST / SHOULD / MAY).

### 3. Conformance impact

State explicitly:

- Whether the change is **breaking** (major), **additive** (minor), or **editorial** (patch), per [versioning.md](versioning.md).
- Which [conformance](spec/07-conformance.md) items are added, changed, or removed.
- Which [conformance tests](tests/conformance-tests.md) must be added or updated.
- Whether the reference implementation already supports the behavior, or must change first.

## Review and acceptance

- Maintainers and the community discuss the PR in the open.
- A proposal that changes the wire-format MUST update `spec_version`, the `$schema` URL, [spec/02-discovery-model.md](spec/02-discovery-model.md), and the examples in lockstep.
- Editorial PRs (typos, clarifications, better examples) are merged quickly and need only the **Problem** section.
- Every accepted normative change MUST keep the specification internally consistent: field names, type values, and endpoint keys must match across all `spec/*.md` files, the examples, and the reference implementation.

## Style

- RFC-style, precise, and terse. Prefer tables for field definitions.
- Cross-link related documents with relative Markdown links.
- Show real values from the example envelope rather than inventing placeholders.

## License of contributions

By contributing you agree that your contributions are licensed under [CC BY 4.0](LICENSE), the same license as the specification.
