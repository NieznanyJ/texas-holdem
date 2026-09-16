@lobby
Feature: Lobby page tests

    Rule: One user
        Scenario: Player one creates a room
            When player one creates a room with name "test"

    Rule: Multiple users
        Scenario: Player one creates a room and player two joins it
            When player one creates a room with name "test"
            And I save room id as "playerOneRoom"
            Then player two joins room with id "playerOneRoom"
