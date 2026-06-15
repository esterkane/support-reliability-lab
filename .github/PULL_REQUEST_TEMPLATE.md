<!-- Keep it focused. Describe the change and how you verified it. -->

## What & why


## Type of change
- [ ] Incident (new or changed) — see checklist below
- [ ] Bug fix
- [ ] Docs / runbook
- [ ] CI / tooling

## Verification
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run test:e2e` (if UI changed)

## Incident checklist (if applicable)
- [ ] Catalog entry in `lib/incidents.ts`
- [ ] Seed tenant in `lib/tenants.ts`
- [ ] Fault lives behind the catalog (no scattered `if (broken)`)
- [ ] Regression test that fails before the fix
- [ ] Playbook in `docs/incidents/<key>.md`
