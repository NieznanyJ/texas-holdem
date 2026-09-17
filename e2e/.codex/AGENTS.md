# Project instructions

This repository is developed using a specification-first workflow.

Before implementing any non-trivial feature:

1. Read:
    - docs/product-scope.md
    - docs/requirements.md
    - docs/architecture.md
    - docs/design.md
    - docs/roadmap.md

2. Inspect the existing repository before proposing changes.

3. Do not implement immediately.
   First produce:
    - affected components
    - affected files
    - implementation steps
    - risks
    - required tests

4. Follow the architecture described in docs/architecture.md.

5. Do not introduce new libraries or architectural patterns without explaining why.

6. Prefer small, incremental changes.

7. After implementation:
    - run tests
    - run lint/typecheck
    - review the diff
    - verify the implementation against requirements

8. Update documentation if architecture or design changes.

For frontend changes, read `docs/frontend-design.md`.

Frontend rules:

- use styled-components
- add stable data-testid attributes where useful for testing
- follow Single Responsibility Principle
- avoid oversized components
- extract complex logic into hooks/services/utilities
