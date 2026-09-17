# CI/CD Strategy

## Goals

The CI/CD pipeline should:

- verify code quality on every pull request
- run automated tests before merging
- prevent broken code from reaching the main branch
- build the application in a reproducible way
- deploy only validated versions
- provide clear feedback when a pipeline step fails

---

## CI

Continuous Integration runs on:

- pull requests
- pushes to the main branch

### Pipeline stages

```text
Install
  ↓
Lint
  ↓
Type Check
  ↓
Unit Tests
  ↓
Backend API Tests
  ↓
Build
  ↓
E2E Tests
```

Some independent jobs may run in parallel to reduce pipeline execution time.

---

## Install

Install dependencies using the project's lock file.

Requirements:

- use a fixed Node.js version
- use `npm ci` instead of `npm install`
- cache dependencies where appropriate

The pipeline must fail if dependencies cannot be installed successfully.

---

## Lint

Run static code analysis for frontend and backend.

Purpose:

- detect code quality issues
- enforce consistent coding standards
- catch common mistakes before tests run

The pipeline must fail when lint errors are detected.

---

## Type Check

Run TypeScript type checking without emitting files.

Example:

```bash
npx tsc --noEmit
```

Frontend and backend should both pass type checking before merge.

---

## Unit Tests

Run unit tests for:

### Backend

Test:

- domain logic
- game rules
- utility functions
- pure services

Examples:

- GameEngine
- Deck
- HandEvaluator
- betting logic
- action validation

### Frontend

Test:

- components
- hooks
- utility functions
- state management
- frontend validation

Unit tests should not depend on external services.

---

## Backend API Tests

Run backend API tests against an isolated test environment.

Test:

- successful requests
- validation errors
- authentication and authorization
- response status codes
- response schemas
- important business rules
- database persistence where relevant

The test database must be isolated from development and production databases.

---

## Build

Build frontend and backend applications.

The build stage verifies that production artifacts can be created successfully.

The pipeline must fail when the application cannot be built.

---

## E2E Tests

Use:

- Playwright
- playwright-bdd
- Gherkin

E2E tests should run against a complete application environment containing:

- frontend
- backend
- required database
- realtime / Socket.IO communication

E2E tests verify critical user journeys.

Examples:

- user creates a room
- another user joins the room
- game starts
- player performs an action
- game state is synchronized between players
- reconnect works correctly

E2E tests should focus on critical flows rather than testing every possible validation case.

---

## Pull Request Pipeline

Every pull request should run:

```text
lint
type-check
unit-tests
api-tests
build
e2e-tests
```

A pull request must not be merged when required pipeline jobs fail.

---

## Main Branch Pipeline

Pushes to the main branch should run the complete CI pipeline.

```text
main
  ↓
CI
  ↓
Build
  ↓
Tests
  ↓
Create deployable artifact
  ↓
Deploy
```

Only validated commits may be deployed.

---

## CD

Continuous Deployment should use separate environments.

```text
Development
     ↓
Staging
     ↓
Production
```

### Development

Used for ongoing development and integration testing.

Deployment may happen automatically after successful changes are merged.

### Staging

Should resemble the production environment as closely as reasonably possible.

Used for:

- final integration verification
- E2E testing
- deployment verification

### Production

Production deployment should only use artifacts that have already passed CI.

Do not rebuild application code differently during production deployment.

---

## Secrets

Secrets must never be committed to the repository.

Examples:

- database credentials
- API keys
- authentication secrets
- deployment credentials

Secrets should be stored using the CI/CD platform's secret management mechanism.

Environment-specific secrets must be separated between:

- development
- staging
- production

---

## Database Migrations

Database migrations should be:

- version controlled
- executed automatically or through a controlled deployment step
- tested before production deployment

Production migrations should avoid destructive changes whenever possible.

---

## Artifacts

The pipeline may store useful artifacts such as:

- application builds
- Playwright reports
- screenshots
- traces
- videos
- test reports
- coverage reports

Artifacts from failed E2E tests should be retained to simplify debugging.

---

## Failure Handling

When a pipeline fails, it should clearly identify:

- failing stage
- failing test
- relevant logs
- available debugging artifacts

Failed pipelines must not trigger production deployment.

---

## Branch Strategy

Recommended branches:

```text
feature/*
bugfix/*
main
```

Typical workflow:

```text
feature branch
      ↓
Pull Request
      ↓
CI pipeline
      ↓
Code Review
      ↓
Merge to main
      ↓
Full CI
      ↓
Deployment
```

Direct changes to `main` should be avoided.

---

## CI/CD Rules for AI Agents

When modifying CI/CD configuration:

1. Inspect the existing pipeline before making changes.
2. Do not remove existing checks without justification.
3. Keep pipeline jobs small and understandable.
4. Prefer deterministic commands.
5. Do not expose secrets in logs.
6. Do not hardcode credentials.
7. Preserve debugging artifacts for failed tests.
8. Verify that CI commands also work locally where possible.
9. Avoid introducing unnecessary CI/CD dependencies.
10. Update this document when the pipeline architecture changes.

## Current implementation (2026-09-17)

The workflow in `.github/workflows/ci.yml` runs on pull requests targeting main and pushes to main, using Node.js 24 and the root npm workspace lockfile.

- Backend: clean install, lint, type check, unit tests, existing API tests, build.
- Frontend: clean install, lint, type check, build. Frontend unit tests are not implemented yet.
- E2E: waits for backend/frontend jobs, installs all workspaces, checks E2E types, installs Playwright browsers, and runs the existing Chromium/Firefox/WebKit projects.
- Playwright starts local backend/frontend servers. CI uses localhost:3000 and localhost:5173 rather than repository variables pointing to external environments.
- HTML reports, failure screenshots and retained failure traces are uploaded for five days. E2E failures remain blocking; scenario fixes are a separate next step.
- Database-backed tests are planned; the current application test setup has no database service.
- No deployment job is configured. CD requires a chosen hosting target, artifact strategy and environment credentials before implementation. Earlier CD sections describe the target strategy, not an operational deployment.
- Required status checks and protection of main must also be configured in GitHub repository settings; workflow YAML alone does not block merging.
