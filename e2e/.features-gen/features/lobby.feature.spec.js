// Generated from: features\lobby.feature
import { test } from "../../fixtures/fixture.ts";

test.describe('Lobby page tests', () => {

  test.describe('One user', () => {

    test('Player one creates a room', { tag: ['@lobby'] }, async ({ When, pageFactory, playerOne, scenarioState }) => { 
      await When('player one creates a room with name "test"', null, { pageFactory, playerOne, scenarioState }); 
    });

  });

  test.describe('Multiple users', () => {

    test('Player one creates a room and player two joins it', { tag: ['@lobby'] }, async ({ When, Then, And, pageFactory, playerOne, playerTwo, scenarioState }) => { 
      await When('player one creates a room with name "test"', null, { pageFactory, playerOne, scenarioState }); 
      await And('I save room id as "playerOneRoom"', null, { scenarioState }); 
      await Then('player two joins room with id "playerOneRoom"', null, { pageFactory, playerTwo, scenarioState }); 
    });

  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\lobby.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":8,"pickleLine":5,"tags":["@lobby"],"steps":[{"pwStepLine":9,"gherkinStepLine":6,"keywordType":"Action","textWithKeyword":"When player one creates a room with name \"test\"","stepMatchArguments":[{"group":{"start":36,"value":"\"test\"","children":[{"start":37,"value":"test","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":16,"pickleLine":9,"tags":["@lobby"],"steps":[{"pwStepLine":17,"gherkinStepLine":10,"keywordType":"Action","textWithKeyword":"When player one creates a room with name \"test\"","stepMatchArguments":[{"group":{"start":36,"value":"\"test\"","children":[{"start":37,"value":"test","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":18,"gherkinStepLine":11,"keywordType":"Action","textWithKeyword":"And I save room id as \"playerOneRoom\"","stepMatchArguments":[{"group":{"start":18,"value":"\"playerOneRoom\"","children":[{"start":19,"value":"playerOneRoom","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":19,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"Then player two joins room with id \"playerOneRoom\"","stepMatchArguments":[{"group":{"start":30,"value":"\"playerOneRoom\"","children":[{"start":31,"value":"playerOneRoom","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end