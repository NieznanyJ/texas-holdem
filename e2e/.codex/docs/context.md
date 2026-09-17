# Work context

## 2026-09-17: CI/CD repair

Current scope: repair CI configuration before debugging failing browser E2E scenarios.
Approved test scope for the next stage: a complete heads-up hand and the next hand.

Findings: root workspace misspelled frontend; shared package declarations were outside dependencies; CI lacked explicit type checking and backend API tests; Playwright HTML reporter was absent and traces required a retry that was not configured.

Changes: corrected workspace/dependency declarations and regenerated lockfile; added typecheck scripts and CI steps; enabled API tests; fixed CI localhost URLs; added limited workflow permissions, cancellation of superseded runs, timeouts, HTML reports and failure artifacts.

Validation completed locally:
- npm ci: passed.
- npm run lint --workspace backend and --workspace frontend: passed with existing warnings.
- npm run typecheck --workspaces --if-present: passed for backend, frontend and e2e.
- npm test --workspace backend: 37 tests passed.
- npm run test:e2e --workspace backend: 1 test passed.
- npm run build --workspace backend and --workspace frontend: passed.
- Fixed two stale frontend shared-type imports and the NodeNext supertest type import uncovered by these checks.
- GitHub-hosted Linux execution has not been verified; browser E2E execution is deferred to the next stage. Browser scenario changes are deferred. CD is not configured: hosting target and credentials are not yet selected.

## Linux CI lint installation fix

The runner failed because the lockfile contained only the Windows x64 optional tsgolint package. Added the five missing platform entries using npm-generated registry metadata for the same 7.0.2001 version. Existing dependency versions are unchanged. Verified a clean isolated npm ci --ignore-scripts --os=linux --cpu=x64 installation and presence of the linux-x64/tsgolint binary. Linux binary execution still requires the GitHub runner; Windows installation alone is not sufficient validation.
