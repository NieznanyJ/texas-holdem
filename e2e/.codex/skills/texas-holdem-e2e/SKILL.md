---
name: texas-holdem-e2e
description: Create, extend, and debug Playwright BDD end-to-end tests in the texas-holdem repository, including Gherkin scenarios, page objects, isolated player fixtures, and Socket.IO assertions. Use for requested E2E coverage or failing E2E scenarios, not unrelated application features or unit tests.
---

# Texas Hold'em E2E

Translate the requested behavior into executable, independent scenarios using the repository's existing Playwright BDD conventions. Explain changes in the user's language; write feature scenarios, code identifiers, and test messages in English.

## Discover the current contract

Resolve paths relative to the current repository; do not assume an absolute checkout path. Inspect applicable AGENTS.md instructions, then the relevant:

- e2e/package.json, e2e/tsconfig.json, and e2e/playwright.config.ts
- e2e/fixtures/fixture.ts and e2e/lib/utils.ts
- existing features, steps, and page objects for the behavior
- frontend components and backend gateway/service methods involved
- shared/src exports for network data types

Treat source files as authoritative: session handling, event payloads, and scripts can change. Reuse matching steps rather than adding ambiguous duplicate expressions. Do not copy shared interfaces into test files or cast enum values to Page.

## Implement at the right layer

- e2e/features/*.feature: observable behavior in Given/When/Then; Background prepares each scenario independently.
- e2e/steps/*.steps.ts: orchestration and assertions using Given/When/Then imported from the project's fixture module.
- e2e/pages/*.page.ts: reusable locators and UI interactions.
- e2e/fixtures/fixture.ts: isolated browser contexts per player and fresh test-scoped scenario state.
- e2e/lib/: reusable synchronization only when existing helpers cannot cover the requirement.

Prefer extending existing files. Do not edit generated .features-gen output. Do not modify gameplay rules, authentication, dependencies, or CI merely to make a test pass. Report application defects; fix them only within the user's requested scope. Minimal semantic attributes/test IDs are appropriate when stable selectors are otherwise unavailable.

Each scenario creates its own room and sessions. Keep IDs in the scenario fixture, not globals; do not rely on another scenario running first. Use distinct contexts for players and close them in fixture teardown, including on failure.

## Assert behavior reliably

Prefer roles with accessible names, labels, and established test IDs. Scope repeated elements to the correct player or section. Return Locator for collections and use awaited expect(locator).toHaveCount(), toBeVisible(), or toHaveText(). Avoid .all() followed by immediate length assertions for asynchronously rendered UI, fixed sleeps, force-clicking disabled controls, and increasing timeouts without investigating.

Assert response.success rather than object truthiness. Use toBe for exact IDs. Inspect rendered attributes before assuming a React testId prop becomes data-testid. For private cards, check the owner's view and the opponent's hidden view.

Shuffled cards are nondeterministic. Assert counts, privacy, legal transitions, pot/stack conservation, or winners computed from observed cards. Do not assume specific dealt cards or introduce a production deck override for test convenience.

## Socket.IO synchronization

Reuse waitForSocketIoAck for command acknowledgements and waitForSocketIoEvent for server pushes such as game:updated. Never wait for an ACK from a server-pushed event.

Register observers before the UI action. Observe the correct player's Page. Track connections in the fixture before navigation so helpers can observe existing sockets. Check current helper support: frame observers see WebSocket traffic, not HTTP polling; account for transport readiness rather than silently missing messages.

When several events may arrive, match the expected room, phase, or hand rather than accepting an unrelated update. Await observation and the triggering action together where practical, so a rejected observation is handled. Any new listener helper must clean up after success, timeout, and page closure and correlate ACK IDs to their socket.

## Validate the actual change

Inspect scripts before choosing commands. For the current npm workspace layout:

- npm test --workspace e2e -- --project=chromium --grep "scenario name"
  uses the test script to generate BDD tests before running Playwright.
- Run a TypeScript no-emit check for e2e using an installed compiler.
- Broaden browser coverage when the change involves browser behavior or the user requests it.

Check webServer configuration before starting servers; prefer its configured lifecycle. Reuse a local server only if it runs the intended checkout. Test against the local/test application, not an unrelated hosted service.

If execution is blocked by unavailable dependencies, browsers, or services, report the exact blocker and the unperformed checks. Do not mark unrun tests as passing, hide failures with skips, or alter assertions to accept a defect. For failures, inspect the first error and available trace/report, make a supported correction, and rerun the targeted scenario; stop retrying unchanged failures.

## Deliver

Summarize added scenarios, touched files, actual commands and results, and any remaining limitation. Keep changes limited to the requested coverage.
