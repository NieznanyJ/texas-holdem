// Generated from: features\game.feature
import { test } from "../../fixtures/fixture.ts";

test.describe('Heads-up poker', () => {

  test.beforeEach('Background', async ({ Given, pageFactory, playerOne, playerTwo, scenarioState }, testInfo) => { if (testInfo.error) return;
    await Given('two players are in the same room', null, { pageFactory, playerOne, playerTwo, scenarioState }); 
  });
  
  test('Player one is game owner and can start the game', { tag: ['@game'] }, async ({ When, Then, pageFactory, playerOne, playerTwo, scenarioState }) => { 
    await When('owner starts the game', null, { pageFactory, playerOne, playerTwo, scenarioState }); 
    await Then('each player sees only their own hole cards', null, { pageFactory, playerOne, playerTwo, scenarioState }); 
  });

  test('Folding awards the pot and allows another hand', { tag: ['@game'] }, async ({ When, Then, And, pageFactory, playerOne, playerTwo, scenarioState }) => { 
    await When('owner starts the game', null, { pageFactory, playerOne, playerTwo, scenarioState }); 
    await And('the owner folds', null, { pageFactory, playerOne }); 
    await Then('the guest wins the hand', null, { pageFactory, playerOne, playerTwo, scenarioState }); 
    await When('the owner starts another hand', null, { pageFactory, playerOne }); 
    await Then('the dealer moves to the guest', null, { pageFactory, playerOne, playerTwo, scenarioState }); 
  });

  test('Calling and checking advances to the flop', { tag: ['@game'] }, async ({ When, Then, And, pageFactory, playerOne, playerTwo, scenarioState }) => { 
    await When('owner starts the game', null, { pageFactory, playerOne, playerTwo, scenarioState }); 
    await And('the owner calls and the guest checks', null, { pageFactory, playerOne, playerTwo }); 
    await Then('both players see three community cards', null, { pageFactory, playerOne, playerTwo }); 
  });

  test('Raising and calling records both contributions', { tag: ['@game'] }, async ({ When, Then, And, pageFactory, playerOne, playerTwo, scenarioState }) => { 
    await When('owner starts the game', null, { pageFactory, playerOne, playerTwo, scenarioState }); 
    await And('the owner raises to 30 and the guest calls', null, { pageFactory, playerOne, playerTwo }); 
    await Then('both players see a flop with a pot of 60', null, { pageFactory, playerOne, playerTwo, scenarioState }); 
  });

  test('Checking every street completes a hand and permits the next deal', { tag: ['@game'] }, async ({ When, Then, And, pageFactory, playerOne, playerTwo, scenarioState }) => { 
    await When('owner starts the game', null, { pageFactory, playerOne, playerTwo, scenarioState }); 
    await And('the owner calls and the guest checks', null, { pageFactory, playerOne, playerTwo }); 
    await And('both players check through the flop turn and river', null, { pageFactory, playerOne, playerTwo, scenarioState }); 
    await Then('the showdown settles a pot of 20 on both screens', null, { pageFactory, playerOne, playerTwo, scenarioState }); 
    await When('the owner starts another hand', null, { pageFactory, playerOne }); 
    await Then('the dealer moves to the guest', null, { pageFactory, playerOne, playerTwo, scenarioState }); 
  });

  test('A raised pot is settled after all remaining streets', { tag: ['@game'] }, async ({ When, Then, And, pageFactory, playerOne, playerTwo, scenarioState }) => { 
    await When('owner starts the game', null, { pageFactory, playerOne, playerTwo, scenarioState }); 
    await And('the owner raises to 30 and the guest calls', null, { pageFactory, playerOne, playerTwo }); 
    await And('both players check through the flop turn and river', null, { pageFactory, playerOne, playerTwo, scenarioState }); 
    await Then('the showdown settles a pot of 60 on both screens', null, { pageFactory, playerOne, playerTwo, scenarioState }); 
  });

  test('A called preflop all-in runs the board and settles the entire stack', { tag: ['@game'] }, async ({ When, Then, And, pageFactory, playerOne, playerTwo, scenarioState }) => { 
    await When('owner starts the game', null, { pageFactory, playerOne, playerTwo, scenarioState }); 
    await And('the owner goes all-in and the guest calls', null, { pageFactory, playerOne, playerTwo, scenarioState }); 
    await Then('the showdown settles a pot of 2000 on both screens', null, { pageFactory, playerOne, playerTwo, scenarioState }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\game.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":6,"tags":["@game"],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given two players are in the same room","isBg":true,"stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":7,"keywordType":"Action","textWithKeyword":"When owner starts the game","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":8,"keywordType":"Outcome","textWithKeyword":"Then each player sees only their own hole cards","stepMatchArguments":[]}]},
  {"pwTestLine":15,"pickleLine":10,"tags":["@game"],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given two players are in the same room","isBg":true,"stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":11,"keywordType":"Action","textWithKeyword":"When owner starts the game","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":12,"keywordType":"Action","textWithKeyword":"And the owner folds","stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"Then the guest wins the hand","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":14,"keywordType":"Action","textWithKeyword":"When the owner starts another hand","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"Then the dealer moves to the guest","stepMatchArguments":[]}]},
  {"pwTestLine":23,"pickleLine":17,"tags":["@game"],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given two players are in the same room","isBg":true,"stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When owner starts the game","stepMatchArguments":[]},{"pwStepLine":25,"gherkinStepLine":19,"keywordType":"Action","textWithKeyword":"And the owner calls and the guest checks","stepMatchArguments":[]},{"pwStepLine":26,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"Then both players see three community cards","stepMatchArguments":[]}]},
  {"pwTestLine":29,"pickleLine":22,"tags":["@game"],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given two players are in the same room","isBg":true,"stepMatchArguments":[]},{"pwStepLine":30,"gherkinStepLine":23,"keywordType":"Action","textWithKeyword":"When owner starts the game","stepMatchArguments":[]},{"pwStepLine":31,"gherkinStepLine":24,"keywordType":"Action","textWithKeyword":"And the owner raises to 30 and the guest calls","stepMatchArguments":[]},{"pwStepLine":32,"gherkinStepLine":25,"keywordType":"Outcome","textWithKeyword":"Then both players see a flop with a pot of 60","stepMatchArguments":[]}]},
  {"pwTestLine":35,"pickleLine":27,"tags":["@game"],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given two players are in the same room","isBg":true,"stepMatchArguments":[]},{"pwStepLine":36,"gherkinStepLine":28,"keywordType":"Action","textWithKeyword":"When owner starts the game","stepMatchArguments":[]},{"pwStepLine":37,"gherkinStepLine":29,"keywordType":"Action","textWithKeyword":"And the owner calls and the guest checks","stepMatchArguments":[]},{"pwStepLine":38,"gherkinStepLine":30,"keywordType":"Action","textWithKeyword":"And both players check through the flop turn and river","stepMatchArguments":[]},{"pwStepLine":39,"gherkinStepLine":31,"keywordType":"Outcome","textWithKeyword":"Then the showdown settles a pot of 20 on both screens","stepMatchArguments":[{"group":{"start":30,"value":"20"},"parameterTypeName":"int"}]},{"pwStepLine":40,"gherkinStepLine":32,"keywordType":"Action","textWithKeyword":"When the owner starts another hand","stepMatchArguments":[]},{"pwStepLine":41,"gherkinStepLine":33,"keywordType":"Outcome","textWithKeyword":"Then the dealer moves to the guest","stepMatchArguments":[]}]},
  {"pwTestLine":44,"pickleLine":35,"tags":["@game"],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given two players are in the same room","isBg":true,"stepMatchArguments":[]},{"pwStepLine":45,"gherkinStepLine":36,"keywordType":"Action","textWithKeyword":"When owner starts the game","stepMatchArguments":[]},{"pwStepLine":46,"gherkinStepLine":37,"keywordType":"Action","textWithKeyword":"And the owner raises to 30 and the guest calls","stepMatchArguments":[]},{"pwStepLine":47,"gherkinStepLine":38,"keywordType":"Action","textWithKeyword":"And both players check through the flop turn and river","stepMatchArguments":[]},{"pwStepLine":48,"gherkinStepLine":39,"keywordType":"Outcome","textWithKeyword":"Then the showdown settles a pot of 60 on both screens","stepMatchArguments":[{"group":{"start":30,"value":"60"},"parameterTypeName":"int"}]}]},
  {"pwTestLine":51,"pickleLine":41,"tags":["@game"],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given two players are in the same room","isBg":true,"stepMatchArguments":[]},{"pwStepLine":52,"gherkinStepLine":42,"keywordType":"Action","textWithKeyword":"When owner starts the game","stepMatchArguments":[]},{"pwStepLine":53,"gherkinStepLine":43,"keywordType":"Action","textWithKeyword":"And the owner goes all-in and the guest calls","stepMatchArguments":[]},{"pwStepLine":54,"gherkinStepLine":44,"keywordType":"Outcome","textWithKeyword":"Then the showdown settles a pot of 2000 on both screens","stepMatchArguments":[{"group":{"start":30,"value":"2000"},"parameterTypeName":"int"}]}]},
]; // bdd-data-end