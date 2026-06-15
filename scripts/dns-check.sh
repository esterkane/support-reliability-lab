#!/usr/bin/env bash
# DNS triage helper for Vercel custom-domain tickets.
# Usage: bash scripts/dns-check.sh example.com
set -euo pipefail

DOMAIN="${1:-}"
if [[ -z "$DOMAIN" ]]; then
  echo "usage: $0 <domain>" >&2
  exit 1
fi

# Basic sanitization: allow only hostname characters.
if [[ ! "$DOMAIN" =~ ^[A-Za-z0-9.-]+$ ]]; then
  echo "error: invalid domain '$DOMAIN'" >&2
  exit 1
fi

echo "== Nameservers (are Vercel NS in use? required for wildcard SSL) =="
dig +short ns "$DOMAIN"

echo
echo "== Apex A record =="
dig +short a "$DOMAIN"

echo
echo "== www CNAME =="
dig +short cname "www.$DOMAIN"

echo
echo "== Vercel ownership TXT (_vercel) =="
dig +short txt "_vercel.$DOMAIN"

echo
echo "== TLS certificate (issuer / subject / validity) =="
if command -v openssl >/dev/null 2>&1; then
  echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null \
    | openssl x509 -noout -issuer -subject -dates 2>/dev/null \
    || echo "  (no certificate served yet — expected if SSL hasn't issued)"
else
  echo "  openssl not found; skipping cert inspection"
fi

echo
echo "Next: classify with the dns-triage skill (.claude/skills/dns-triage)."
