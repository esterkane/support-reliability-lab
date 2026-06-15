# Security Policy

## Scope
This is a demonstration "incident lab." It ships **no real secrets** — the mock upstream,
tenant store, and fault toggles are all local/in-memory, and `.env.local` is gitignored.
Real credentials (e.g. `VERCEL_TOKEN` for `scripts/add-domain.ts`) come from the
environment and must never be committed.

## Reporting a vulnerability
Please report security issues privately rather than opening a public issue:

- Use GitHub's **Report a vulnerability** (Security → Advisories) on this repository, or
- open a minimal private channel with the maintainer.

Include reproduction steps and the affected file/route. You'll get an acknowledgement and,
once confirmed, a fix or mitigation.

## Hardening already in place
- `npm audit` / Dependabot watch dependencies; known-CVE updates are prioritized.
- CodeQL static analysis runs on pushes and PRs (`.github/workflows/codeql.yml`).
- User-supplied values that reach a shell (e.g. domains in `scripts/dns-check.sh`) are
  validated before use.
- Internal service ports are not exposed in production configurations.
