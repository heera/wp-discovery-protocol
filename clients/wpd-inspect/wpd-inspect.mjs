#!/usr/bin/env node
/**
 * wpd-inspect — a reference *consumer* for the WP_Discovery protocol.
 *
 * Producers (e.g. the Agentimus plugin) emit /.well-known/discovery.json; this is
 * the other half — a client that reads it, the way an AI agent or integration
 * would. It:
 *   1. resolves & fetches a site's discovery document (or reads a local file),
 *   2. checks it against the protocol's MUST requirements (a conformance check),
 *   3. prints a human summary, and
 *   4. resolves an intent (capability) to the resource/endpoint(s) that serve it.
 *
 * Zero dependencies — Node 18+ (global fetch). Exit code is non-zero if any MUST
 * check fails, so it is usable in CI and scripts.
 *
 * Usage:
 *   wpd-inspect <site-url | discovery.json url | local file>
 *   wpd-inspect https://example.com --capability commerce.products.read
 *   wpd-inspect ./examples/discovery.json --json
 */

import { readFile } from 'node:fs/promises';

const CORE_KEYS = [
  '$schema', 'spec_version', 'site', 'identity', 'documents',
  'well_known', 'apis', 'agents', 'resources', 'capabilities', 'trust',
];
const API_TYPES = ['rest', 'graphql', 'openapi', 'soap', 'rpc'];
const CAP_RE = /^[a-z0-9-]+(\.[a-z0-9_-]+)+$/;
const SLUG_RE = /^[a-z0-9](-?[a-z0-9]+)*$/;

const HELP = `wpd-inspect — read & check a WP_Discovery document (reference consumer)

USAGE
  wpd-inspect <target> [options]

  <target>   A site URL (https://example.com), a direct discovery.json URL,
             or a local file path.

OPTIONS
  -c, --capability <token>   Resolve an intent to the resource/endpoint(s) that serve it.
      --json                 Emit machine-readable JSON instead of a summary.
  -h, --help                 Show this help.

EXAMPLES
  wpd-inspect https://example.com
  wpd-inspect https://example.com -c commerce.products.read
  wpd-inspect ./examples/discovery.json --json
`;

function parseArgs(argv) {
  const args = { target: null, capability: null, json: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') args.help = true;
    else if (a === '--json') args.json = true;
    else if (a === '-c' || a === '--capability') args.capability = argv[++i] ?? null;
    else if (!a.startsWith('-')) args.target ??= a;
  }
  return args;
}

/** Work out the discovery.json URL for a site, honouring the rel="discovery" Link header. */
async function resolveDiscoveryUrl(target) {
  if (/\.json(\?|$)/i.test(target) || target.includes('/.well-known/')) {
    return { url: target, advertised: null };
  }
  const origin = new URL(target).origin;
  try {
    const res = await fetch(target, { redirect: 'follow' });
    const link = res.headers.get('link');
    if (link) {
      // Link: <https://site/.well-known/discovery.json>; rel="discovery"; type="application/json"
      const m = link.match(/<([^>]+)>\s*;[^,]*\brel=("?)discovery\2/i);
      if (m) return { url: new URL(m[1], origin).href, advertised: true };
    }
  } catch { /* fall through to the well-known default */ }
  return { url: `${origin}/.well-known/discovery.json`, advertised: false };
}

async function load(target) {
  if (/^https?:\/\//i.test(target)) {
    if (typeof fetch !== 'function') throw new Error('Fetching a URL requires Node 18+ (global fetch).');
    const { url, advertised } = await resolveDiscoveryUrl(target);
    const res = await fetch(url, { headers: { accept: 'application/json' }, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    return { source: url, advertised, body: await res.text() };
  }
  return { source: target, advertised: null, body: await readFile(target, 'utf8') };
}

/** Consumer-side conformance checks, mapped to the spec's MUST ids. */
function checkConformance(doc) {
  const out = [];
  const ok = (id, msg) => out.push({ level: 'pass', id, msg });
  const bad = (id, msg) => out.push({ level: 'fail', id, msg });
  const warn = (id, msg) => out.push({ level: 'warn', id, msg });

  const keys = Object.keys(doc);
  const missing = CORE_KEYS.filter((k) => !(k in doc));
  const extras = keys.filter((k) => !CORE_KEYS.includes(k) && !k.startsWith('x-'));
  if (missing.length) bad('M2', `missing core keys: ${missing.join(', ')}`);
  else ok('M2', 'all 11 core keys present');
  if (extras.length) bad('M2', `top-level keys that are neither core nor x-: ${extras.join(', ')}`);

  if (doc.spec_version === '1.0') ok('M3', 'spec_version is "1.0"');
  else bad('M3', `spec_version is ${JSON.stringify(doc.spec_version)} (expected "1.0")`);
  if (typeof doc.$schema === 'string' && doc.$schema) ok('M3', '$schema present');
  else bad('M3', '$schema is missing or not a string');

  const caps = Array.isArray(doc.capabilities) ? doc.capabilities : [];
  const badCaps = caps.filter((c) => typeof c !== 'string' || !CAP_RE.test(c) || c.includes('/'));
  if (!caps.length) warn('M7', 'no capabilities declared');
  else if (badCaps.length) bad('M8', `capabilities that are not intent-only: ${badCaps.join(', ')}`);
  else ok('M7/M8', `${caps.length} dot-notation intent capabilities`);

  const apis = Array.isArray(doc.apis) ? doc.apis : [];
  const badApis = apis.filter(
    (a) => !a || !a.id || !API_TYPES.includes(a.type) || typeof a.base !== 'string' || !a.auth || typeof a.auth.type !== 'string'
  );
  if (badApis.length) bad('apis', `${badApis.length} of ${apis.length} api entries are malformed`);
  else ok('apis', `${apis.length} api entries well-formed`);

  const resources = Array.isArray(doc.resources) ? doc.resources : [];
  const badRes = resources.filter((r) => !r || !SLUG_RE.test(r.id || '') || !r.title || !r.type);
  if (badRes.length) bad('resources', `${badRes.length} of ${resources.length} resources missing id/title/type`);
  else ok('resources', `${resources.length} resources well-formed`);

  return out;
}

/** Resolve an intent token to the resources + endpoints that fulfil it. */
function resolveCapability(doc, token) {
  const matches = [];
  for (const r of doc.resources || []) {
    if ((r.capabilities || []).includes(token)) {
      matches.push({
        resource: r.id,
        provider: r.provider?.plugin || '(unknown)',
        endpoints: (r.endpoints || []).map((e) => ({
          url: e.url, type: e.type, auth: e.auth || r.auth?.type || 'none',
        })),
      });
    }
  }
  return matches;
}

function summarize(doc, meta) {
  const L = [];
  const n = (a) => (Array.isArray(a) ? a.length : 0);
  L.push(`source        ${meta.source}${meta.advertised === true ? '  (via rel="discovery" Link header)' : ''}`);
  L.push(`spec_version  ${doc.spec_version}`);
  if (doc.site) L.push(`site          ${doc.site.name || '(unnamed)'} — ${doc.site.url || ''}${doc.site.lang ? `  [${doc.site.lang}]` : ''}`);
  if (doc.identity) L.push(`identity      ${doc.identity.type} · ${doc.identity.name || ''}${doc.identity.role ? ` (${doc.identity.role})` : ''}`);

  L.push('');
  L.push(`capabilities  (${n(doc.capabilities)})`);
  for (const c of doc.capabilities || []) L.push(`  • ${c}`);

  L.push('');
  L.push(`apis          (${n(doc.apis)})`);
  for (const a of doc.apis || []) L.push(`  • [${a.type}] ${a.base}  — auth: ${a.auth?.type || 'none'}  (${a.id})`);

  if (n(doc.agents)) {
    L.push('');
    L.push(`agents        (${n(doc.agents)})`);
    for (const a of doc.agents) L.push(`  • ${a.name}  — ${n(a.skills)} skill(s)  ${a.endpoint || ''}`);
  }

  const tools = (doc.resources || []).flatMap((r) => r.tools || []);
  if (tools.length) {
    L.push('');
    L.push(`tools         (${tools.length})`);
    for (const t of tools) L.push(`  • ${t.name}${t.description ? ` — ${t.description}` : ''}`);
  }

  const docs = doc.documents ? Object.keys(doc.documents) : [];
  if (docs.length) { L.push(''); L.push(`documents     ${docs.join(', ')}`); }
  const wk = (doc.well_known || []).map((w) => w.name);
  if (wk.length) L.push(`well_known    ${wk.join(', ')}`);

  return L.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.target) { console.log(HELP); process.exit(args.help ? 0 : 1); }

  let meta, doc;
  try {
    meta = await load(args.target);
    doc = JSON.parse(meta.body);
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exit(2);
  }

  const checks = checkConformance(doc);
  const failed = checks.filter((c) => c.level === 'fail');
  const resolution = args.capability ? resolveCapability(doc, args.capability) : null;

  if (args.json) {
    console.log(JSON.stringify({
      source: meta.source, ok: failed.length === 0, checks,
      capability: args.capability || undefined, resolution: resolution || undefined,
    }, null, 2));
    process.exit(failed.length ? 1 : 0);
  }

  console.log(summarize(doc, meta));
  console.log('\nconformance');
  for (const c of checks) {
    const mark = c.level === 'pass' ? '✓' : c.level === 'warn' ? '!' : '✗';
    console.log(`  ${mark} ${c.id.padEnd(10)} ${c.msg}`);
  }

  if (args.capability) {
    console.log(`\nresolve "${args.capability}"`);
    if (!resolution.length) {
      console.log('  (not offered by this site)');
      const caps = doc.capabilities || [];
      if (caps.length) console.log(`  available: ${caps.join(', ')}`);
    } else {
      for (const m of resolution) {
        console.log(`  ${m.resource}  (${m.provider})`);
        for (const e of m.endpoints) console.log(`    → [${e.type}] ${e.url}  — auth: ${e.auth}`);
      }
    }
  }

  console.log(failed.length ? `\nFAIL — ${failed.length} MUST check(s) failed.` : '\nOK — conforms to the checked MUST requirements.');
  process.exit(failed.length ? 1 : 0);
}

main();
