# System Design

## Backend modules

auth/
user/
room/
game/

## Game module

GameEngine
GameState
Player
Deck
HandEvaluator

GameEngine is pure TypeScript and must not depend on:

- database
- Socket.IO
- HTTP
