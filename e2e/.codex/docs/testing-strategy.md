# Testing Strategy

## Backend

### API Tests

Purpose:
Verify backend endpoints and business rules through the API layer.

Test:

- successful requests
- validation errors
- authorization/authentication
- invalid input
- expected status codes
- response schema
- important business rules
- persistence where relevant

Do not test frontend behavior here.

---

## Frontend

### Unit Tests

Purpose:
Test isolated frontend logic and components.

Test:

- utility functions
- hooks
- state management
- component behavior
- validation logic
- rendering based on props/state

Mock backend/API dependencies where appropriate.

Do not reproduce full E2E scenarios here.

---

## E2E

### Playwright + playwright-bdd

Purpose:
Verify complete user flows across frontend and backend.

Use:

- Playwright
- playwright-bdd
- Gherkin scenarios

Test only critical user journeys.

Examples:

- user creates a room
- second user joins a room
- players start a game
- player performs an action
- game state updates for both players
- player reconnects after connection loss
- full poker game with multiple players

E2E tests should verify the system from the user's perspective.
