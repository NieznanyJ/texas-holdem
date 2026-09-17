# Frontend Design Guidelines

## Goals

The frontend should be:

- easy to understand
- easy to test
- easy to maintain
- visually consistent
- composed of small, focused components
- predictable in structure and behavior

---

## Styling

Use **styled-components** for component styling.

Avoid:

- inline styles
- large global CSS files
- mixing multiple styling approaches without a clear reason

Example:

```tsx
const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;
```

Styles should stay close to the component they belong to unless they are shared across multiple parts of the application.

Shared styling primitives may be extracted when duplication becomes significant.

---

## Component Responsibility

Every component should follow the **Single Responsibility Principle**.

A component should have one clear purpose.

Good examples:

```text
RoomCard
RoomList
CreateRoomForm
PlayerAvatar
GameControls
PotDisplay
```

Avoid components that simultaneously:

- fetch data
- contain complex business logic
- manage multiple unrelated states
- render several independent sections
- handle unrelated user interactions

If a component becomes responsible for multiple concerns, split it into smaller components.

---

## Component Size

Components should remain reasonably small.

There is no strict line limit, but long components should be treated as a signal that responsibilities may need to be separated.

As a guideline:

- small presentational components should usually remain below ~100 lines
- components above ~150–200 lines should be reviewed for possible extraction

Do not split components mechanically only to reduce line count.

Split them when there is a clear responsibility boundary.

---

## Component Structure

Prefer a structure similar to:

```text
components/
  RoomCard/
    RoomCard.tsx
    RoomCard.styles.ts
    RoomCard.test.tsx
    index.ts
```

For smaller components, colocating styles in the same file is acceptable.

Example:

```text
components/
  Button.tsx
```

Choose the simpler structure unless the component becomes large enough to justify separate files.

---

## Data Attributes for Testing

Add stable `data-testid` attributes to important interactive and test-relevant elements.

Examples:

```tsx
<button data-testid="create-room-button">Create room</button>
```

```tsx
<input data-testid="room-name-input" value={roomName} />
```

Use meaningful and stable names.

Preferred format:

```text
feature-element
```

Examples:

```text
login-submit-button
room-name-input
room-list
room-card
game-pot
player-action-fold
player-action-call
player-action-raise
```

Avoid test IDs based on:

- implementation details
- CSS classes
- generated IDs
- component indexes

Bad:

```text
button-1
div-3
styled-component-abc
```

---

## Test Selector Priority

When writing tests, prefer user-facing selectors where they are stable and expressive.

Recommended priority:

```text
role / accessible name
        ↓
label
        ↓
text
        ↓
data-testid
```

`data-testid` should be available for elements where semantic selectors may be ambiguous or unstable.

The goal is to make important frontend elements easy to test without coupling tests to styling or DOM structure.

---

## Business Logic

Do not place complex business logic directly inside UI components.

Extract logic into:

- hooks
- services
- utility functions
- domain modules
- state management

Example:

Bad:

```text
GameTable component
 ├── render UI
 ├── validate poker action
 ├── calculate bet
 ├── update socket
 ├── transform server state
 └── manage animations
```

Preferred:

```text
GameTable
   |
   +-- useGameState()
   +-- usePlayerActions()
   +-- GameBoard
   +-- GameControls
   +-- PlayerList
```

The frontend should not duplicate backend business rules unnecessarily.

For example, the backend remains authoritative for poker game rules.

---

## Hooks

Use custom hooks when logic:

- is reused
- contains multiple related state values
- handles asynchronous behavior
- manages subscriptions
- communicates with APIs or realtime services
- makes a component difficult to understand

Examples:

```text
useAuth()
useLobby()
useRoom()
useGameState()
useSocket()
```

Hooks should also follow the Single Responsibility Principle.

---

## API Communication

Do not call HTTP APIs directly from deeply nested presentational components.

Prefer:

```text
Component
   ↓
hook / service
   ↓
API client
```

Example:

```text
CreateRoomForm
     ↓
useCreateRoom()
     ↓
roomApi.createRoom()
```

This makes components easier to test and keeps transport logic separate from presentation.

---

## Socket.IO Communication

Do not access the raw Socket.IO client throughout the component tree.

Keep realtime communication behind a dedicated abstraction.

Example:

```text
Component
   ↓
custom hook
   ↓
socket service
   ↓
Socket.IO
```

Example:

```text
GameTable
   ↓
useGameSocket()
   ↓
gameSocketService
```

This prevents UI components from becoming tightly coupled to Socket.IO implementation details.

---

## State Management

Keep state as local as possible.

Use component state when data is only relevant to one component.

Lift state only when multiple components genuinely require it.

Global state should be reserved for shared application-level concerns such as:

- authenticated user
- active room
- current game
- global application state

Avoid storing every UI state globally.

---

## Props

Keep component APIs small and explicit.

Prefer:

```tsx
<RoomCard room={room} onJoin={handleJoin} />
```

over passing many unrelated primitive props.

Avoid excessive prop drilling.

If data has to pass through many unrelated components, consider:

- composition
- context
- a focused state abstraction

---

## Conditional Rendering

Avoid deeply nested JSX conditions.

Bad:

```tsx
conditionA ? (
  conditionB ? (
    conditionC ? ...
```

Prefer extracting conditions into:

- variables
- helper functions
- dedicated components

Example:

```tsx
const canJoinRoom = room.status === "waiting" && !room.isFull;
```

---

## Naming

Component names should describe their purpose.

Use PascalCase:

```text
RoomCard
CreateRoomForm
GameControls
PlayerSeat
```

Hooks:

```text
useRoom
useGame
usePlayerActions
```

Handlers:

```text
handleJoinRoom
handleCreateRoom
handleFold
```

Boolean values:

```text
isLoading
isConnected
hasError
canRaise
```

Avoid vague names such as:

```text
data
thing
obj
handler
component1
```

when a more specific name is possible.

---

## Reusability

Do not create abstractions prematurely.

Create reusable components when:

- the same UI pattern appears multiple times
- the behavior is genuinely shared
- extracting it makes the code easier to understand

Avoid creating overly generic components that require many configuration props.

Prefer simple, focused abstractions.

---

## Accessibility

Interactive elements should use appropriate HTML semantics.

Prefer:

```tsx
<button>
```

instead of:

```tsx
<div onClick={...}>
```

Use:

- labels for form inputs
- accessible names
- semantic headings
- correct button types
- keyboard-accessible controls

Accessibility should also improve testability by enabling stable role-based selectors.

---

## Forms

Form components should separate:

```text
presentation
validation
submission
API communication
```

Avoid large form components containing all application logic.

A form component may manage local input state while submission logic is delegated to a dedicated hook or service.

---

## Error Handling

User-facing errors should be:

- clear
- actionable when possible
- consistent across the application

Do not expose raw backend errors or stack traces directly to users.

Keep technical errors available for debugging separately.

---

## Loading States

Async operations should expose clear loading states.

Examples:

```text
loading room list
creating room
joining room
starting game
reconnecting
```

Prevent duplicate actions when an operation is already in progress.

Example:

```tsx
<button disabled={isCreating} data-testid="create-room-button">
    Create room
</button>
```

---

## Empty States

Lists and screens should explicitly handle empty states.

Examples:

```text
No rooms available.
No players have joined yet.
No game is currently active.
```

Do not leave blank screens without explanation.

---

## Frontend Testing Requirements

Frontend unit tests should focus on:

- component behavior
- hooks
- validation
- state changes
- conditional rendering
- interaction callbacks

Tests should not depend on styled-components implementation details.

Avoid selectors such as generated CSS class names.

Prefer accessible selectors and stable `data-testid` attributes.

---

## AI Agent Rules

When implementing frontend code:

1. Read this document before making frontend changes.
2. Use styled-components for styling.
3. Follow the Single Responsibility Principle.
4. Keep components focused and reasonably small.
5. Extract complex logic from JSX.
6. Add meaningful `data-testid` attributes to important testable elements.
7. Prefer semantic HTML.
8. Do not introduce another styling framework without justification.
9. Do not place backend business rules in frontend components.
10. Keep Socket.IO and HTTP communication behind hooks or services.
11. Review large components for possible decomposition.
12. Preserve accessibility and testability when refactoring.
13. Add or update frontend unit tests when behavior changes.
14. Update this document if frontend architectural rules change.

---

## Example Structure

```text
src/
├── components/
│   ├── Button/
│   ├── RoomCard/
│   ├── PlayerSeat/
│   └── GameControls/
│
├── features/
│   ├── auth/
│   ├── lobby/
│   ├── room/
│   └── game/
│
├── hooks/
│   ├── useAuth.ts
│   ├── useLobby.ts
│   └── useGame.ts
│
├── services/
│   ├── api/
│   └── socket/
│
├── styles/
│   ├── GlobalStyle.ts
│   └── theme.ts
│
├── utils/
└── types/
```

The exact folder structure may evolve with the application, but responsibility boundaries should remain clear.
