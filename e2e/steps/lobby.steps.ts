import { expect } from "@playwright/test";
import { When } from "../fixtures/fixture";
import LobbyPage from "../pages/lobby.page";
import RoomPage from "../pages/room.page";
import { waitForSocketIoAck } from "../lib/utils";

let roomId = "";

When(
    "player one creates a room with name {string}",
    async ({ playerOne, pageFactory, scenarioState }, roomName: string) => {
        const lobby = pageFactory(LobbyPage, playerOne);
        const room = pageFactory(RoomPage, playerOne);
        const responsePromise = waitForSocketIoAck<{ roomId: string }>(
            playerOne,
            "room:create",
        );
        await lobby.goto();
        await lobby.createRoom(roomName);

        const message = await responsePromise;
        expect(message.roomId).toBeDefined();
        scenarioState.values.roomId = message.roomId;

        await expect(room.title).toHaveText("Poker Room");
    },
);

When("I save room id as {string}", async ({ scenarioState }, key: string) => {
    const roomId = scenarioState.values.roomId;

    expect(roomId).toBeDefined();

    scenarioState.values[key] = roomId;
});

When(
    "player two joins room with id {string}",
    async ({ playerTwo, pageFactory, scenarioState }, key: string) => {
        const lobby = pageFactory(LobbyPage, playerTwo);
        const room = pageFactory(RoomPage, playerTwo);

        const responsePromise = waitForSocketIoAck<{ roomId: string }>(
            playerTwo,
            "room:join",
        );
        await lobby.goto();

        const roomId = scenarioState.values[key];
        expect(roomId).toBeDefined();

        await lobby.joinRoom(roomId);
        await expect(room.title).toHaveText("Poker Room");
    },
);
