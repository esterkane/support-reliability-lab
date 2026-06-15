---
name: runbook-writer
description: Write customer-facing troubleshooting docs, internal runbooks, and postmortems for the Support Reliability Lab in a support-engineer voice. Use after an incident is reproduced and fixed, or when the user asks to write/improve a runbook, a "what to collect before opening a ticket" guide, a postmortem, or customer-facing troubleshooting docs.
---

# Runbook & customer-doc writer

The job values clear solutions and durable docs. Write so a customer or an escalation
engineer can act without you in the room. Lead with the fix, then the why.

## Document types

### 1. Incident playbook — `docs/incidents/<key>.md`
Sections, in order:
- **Symptom** — what the customer sees, in their words.
- **Reproduce** — the exact toggle + command; must be deterministic.
- **Where to look first** — the single best signal (from the `trace-debug` evidence path).
- **Root cause** — one sentence, tied to evidence.
- **Fix / mitigation** — the change, plus the correct mental model and any plan-specific
  caveats (Hobby vs Pro/Enterprise).
- **Verify** — how you confirmed it's fixed (test + observed signal).
- **Prevent** — the regression test and any guardrail added.

### 2. Customer-facing troubleshooting — `docs/troubleshooting/*`
Plain language, no internal jargon. Always include a **"What to collect before opening a
ticket"** list: URL, timestamp + timezone, request/trace ID, deployment URL, `x-vercel-cache`
header, and a screenshot or `curl -i` output. Collecting this up front is half the resolution.

### 3. Postmortem — `docs/postmortems/*`
Blameless. Timeline, impact, root cause, what made detection slow/fast, action items with
owners. Keep it short enough that people actually read it.

## Voice rules
- Imperative and specific: "Run `dig ns example.com`" beats "you may wish to check DNS."
- Show the evidence, not just the verdict — paste the `curl -i` line or the header.
- Distinguish *root cause* from *mitigation* explicitly. Customers conflate them.
- State what's out of scope / plan-gated honestly rather than implying everything works.
- No fabricated metrics. If you cite a before/after number, it came from a real k6 /
  Speed Insights run; otherwise say "measure this."

## Done checklist
- A reader who has never seen the repo can reproduce and fix from the doc alone.
- The "what to collect" list is present for any customer-facing guide.
- Links to the relevant `lib/incidents.ts` entry and regression test.
