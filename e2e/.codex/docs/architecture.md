# Architecture

## Overview

Shared:
Shared types

Frontend:
React + typescript

Backend:
Nest.js + TypeScript

Realtime:
Socket.IO

Database:
PostgreSQL

## High level architecture

Client
|
| HTTP
v
REST API
|
+------ Authentication
|
+------ Room management

Client
|
| WebSocket / Socket.IO
v
Realtime Gateway
|
v
Game Service
|
v
Game Engine
|
v
Persistence

## Core architectural rules

1. Game state is authoritative on the server.
2. Client never decides whether a poker action is valid.
3. Socket handlers contain no game business logic.
4. Game rules belong in GameEngine.
5. Database repositories contain no domain logic.
6. UI components do not communicate directly with Socket.IO.
