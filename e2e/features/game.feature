@game
Feature: Heads-up poker
    Background:
        Given two players are in the same room

    Scenario: Player one is game owner and can start the game
        When owner starts the game
        Then each player sees only their own hole cards

    Scenario: Folding awards the pot and allows another hand
        When owner starts the game
        And the owner folds
        Then the guest wins the hand
        When the owner starts another hand
        Then the dealer moves to the guest

    Scenario: Calling and checking advances to the flop
        When owner starts the game
        And the owner calls and the guest checks
        Then both players see three community cards

    Scenario: Raising and calling records both contributions
        When owner starts the game
        And the owner raises to 30 and the guest calls
        Then both players see a flop with a pot of 60

    Scenario: Checking every street completes a hand and permits the next deal
        When owner starts the game
        And the owner calls and the guest checks
        And both players check through the flop turn and river
        Then the showdown settles a pot of 20 on both screens
        When the owner starts another hand
        Then the dealer moves to the guest

    Scenario: A raised pot is settled after all remaining streets
        When owner starts the game
        And the owner raises to 30 and the guest calls
        And both players check through the flop turn and river
        Then the showdown settles a pot of 60 on both screens

    Scenario: A called preflop all-in runs the board and settles the entire stack
        When owner starts the game
        And the owner goes all-in and the guest calls
        Then the showdown settles a pot of 2000 on both screens
