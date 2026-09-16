import { expect } from "@playwright/test";
import { Given, When, Then } from "../fixtures/fixture";
import { waitForSocketIoAck, waitForSocketIoEvent } from "../lib/utils";
import LobbyPage from "../pages/lobby.page";
import RoomPage from "../pages/room.page";
import type { RoomState } from "@texas-holdem/shared";

Given("two players are in the same room", async ({ playerOne, playerTwo, pageFactory, scenarioState }) => {
    const owner = pageFactory(LobbyPage, playerOne);
    const guest = pageFactory(LobbyPage, playerTwo);
    await owner.goto();
    const [created] = await Promise.all([
        waitForSocketIoAck<{roomId: string; ownerId: string}>(playerOne, "room:create"),
        owner.createRoom("E2E game"),
    ]);
    expect(created.roomId).toBeTruthy();
    expect(created.ownerId).toBeTruthy();
    scenarioState.values.roomId = created.roomId;
    scenarioState.values.ownerId = created.ownerId;
    await expect(playerOne).toHaveURL(new RegExp("/room/" + created.roomId + "$"));
    await guest.goto();
    const [joined] = await Promise.all([
        waitForSocketIoAck<{success: boolean}>(playerTwo, "room:join"),
        guest.joinRoom(created.roomId),
    ]);
    expect(joined.success).toBe(true);
    await expect(playerTwo).toHaveURL(new RegExp("/room/" + created.roomId + "$"));
    await expect(playerOne.getByRole("heading", {name: "Players (2/9)", exact: true})).toBeVisible();
    await expect(playerTwo.getByRole("heading", {name: "Players (2/9)", exact: true})).toBeVisible();
});

When("owner starts the game", async ({playerOne, playerTwo, pageFactory, scenarioState}) => {
    const room = pageFactory(RoomPage, playerOne);
    const [ack, state] = await Promise.all([
        waitForSocketIoAck<{success: boolean}>(playerOne, "room:start"),
        waitForSocketIoEvent<RoomState>(playerOne, "game:updated"),
        room.startHandButton.click(),
    ]);
    expect(ack.success).toBe(true);
    expect(state.id).toBe(scenarioState.values.roomId);
    expect(state.ownerId).toBe(scenarioState.values.ownerId);
    expect(state.phase).toBe("preflop");
    expect(state.players).toHaveLength(2);
    scenarioState.values.guestId = state.players.find(p => p.userId !== state.ownerId)!.userId;
    await expect(room.getCards(state.ownerId)).toHaveCount(2);
    await expect(pageFactory(RoomPage, playerTwo).getCards(scenarioState.values.guestId)).toHaveCount(2);
});

Then("each player sees only their own hole cards", async ({playerOne, playerTwo, pageFactory, scenarioState}) => {
    for (const [page, ownId, otherId] of [
        [playerOne, scenarioState.values.ownerId, scenarioState.values.guestId],
        [playerTwo, scenarioState.values.guestId, scenarioState.values.ownerId],
    ] as const) {
        const room = pageFactory(RoomPage, page);
        await expect(room.getCards(ownId)).toHaveCount(2);
        await expect(room.getCards(otherId)).toHaveCount(0);
        await expect(room.getPlayer(otherId).getByRole("img", {name: "Hidden card", exact: true})).toHaveCount(2);
        await expect(room.communityCards).toHaveCount(0);
    }
    await expect(pageFactory(RoomPage, playerTwo).action("Check")).toBeDisabled();
});

When("the owner folds", async ({playerOne, pageFactory}) => {
    await pageFactory(RoomPage, playerOne).action("Fold").click();
});

Then("the guest wins the hand", async ({playerOne, playerTwo, pageFactory, scenarioState}) => {
    for (const page of [playerOne, playerTwo]) {
        const room = pageFactory(RoomPage, page);
        await expect(room.stat("Phase")).toHaveText("finished");
        await expect(room.stat("Pot")).toHaveText("0");
        await expect(room.getPlayer(scenarioState.values.ownerId)).toContainText("Chips: 995");
        await expect(room.getPlayer(scenarioState.values.guestId)).toContainText("Chips: 1005");
    }
    await expect(pageFactory(RoomPage, playerOne).startHandButton).toBeEnabled();
    await expect(pageFactory(RoomPage, playerTwo).startHandButton).toHaveCount(0);
});

When("the owner starts another hand", async ({playerOne, pageFactory}) => {
    await pageFactory(RoomPage, playerOne).startHandButton.click();
});

Then("the dealer moves to the guest", async ({playerOne, playerTwo, pageFactory, scenarioState}) => {
    for (const page of [playerOne, playerTwo]) {
        const room = pageFactory(RoomPage, page);
        await expect(room.stat("Hand")).toHaveText("#2");
        await expect(room.stat("Phase")).toHaveText("preflop");
        await expect(room.getPlayer(scenarioState.values.guestId)).toContainText("Dealer");
        await expect(room.communityCards).toHaveCount(0);
    }
});

When("the owner calls and the guest checks", async ({playerOne, playerTwo, pageFactory}) => {
    await pageFactory(RoomPage, playerOne).action("Call 5").click();
    await pageFactory(RoomPage, playerTwo).action("Check").click();
});

Then("both players see three community cards", async ({playerOne, playerTwo, pageFactory}) => {
    for (const page of [playerOne, playerTwo]) {
        const room = pageFactory(RoomPage, page);
        await expect(room.stat("Phase")).toHaveText("flop");
        await expect(room.communityCards).toHaveCount(3);
        await expect(room.stat("Pot")).toHaveText("20");
    }
    await expect(pageFactory(RoomPage, playerTwo).action("Check")).toBeEnabled();
    await expect(pageFactory(RoomPage, playerOne).action("Check")).toBeDisabled();
});

When("the owner raises to 30 and the guest calls", async ({playerOne, playerTwo, pageFactory}) => {
    const room = pageFactory(RoomPage, playerOne);
    await room.raiseAmount.fill("30");
    await room.action("Raise to 30").click();
    await pageFactory(RoomPage, playerTwo).action("Call 20").click();
});

Then("both players see a flop with a pot of 60", async ({playerOne, playerTwo, pageFactory, scenarioState}) => {
    for (const page of [playerOne, playerTwo]) {
        const room = pageFactory(RoomPage, page);
        await expect(room.stat("Phase")).toHaveText("flop");
        await expect(room.communityCards).toHaveCount(3);
        await expect(room.stat("Pot")).toHaveText("60");
        for (const id of [scenarioState.values.ownerId, scenarioState.values.guestId]) {
            await expect(room.getPlayer(id)).toContainText("Chips: 970");
            await expect(room.getPlayer(id)).toContainText("Bet: 0");
        }
    }
});

When("both players check through the flop turn and river", async ({playerOne, playerTwo, pageFactory, scenarioState}) => {
    const owner = pageFactory(RoomPage, playerOne);
    const guest = pageFactory(RoomPage, playerTwo);
    for (const [phase, count] of [["flop", 3], ["turn", 4], ["river", 5]] as const) {
        for (const room of [owner, guest]) {
            await expect(room.stat("Phase")).toHaveText(phase);
            await expect(room.communityCards).toHaveCount(count);
        }
        await guest.action("Check").click();
        if (phase !== "river") {
            await owner.action("Check").click();
            continue;
        }
        const [ownerState, guestState, ack] = await Promise.all([
            waitForSocketIoEvent<RoomState>(playerOne, "game:updated"),
            waitForSocketIoEvent<RoomState>(playerTwo, "game:updated"),
            waitForSocketIoAck<{success: boolean}>(playerOne, "game:check"),
            owner.action("Check").click(),
        ]);
        expect(ack.success).toBe(true);
        scenarioState.values.ownerShowdown = JSON.stringify(ownerState);
        scenarioState.values.guestShowdown = JSON.stringify(guestState);
    }
});

When("the owner goes all-in and the guest calls", async ({playerOne, playerTwo, pageFactory, scenarioState}) => {
    const owner = pageFactory(RoomPage, playerOne);
    const guest = pageFactory(RoomPage, playerTwo);
    await owner.action("All-in 995").click();
    await expect(guest.action("Call 990 (all-in)")).toBeEnabled();
    const [ownerState, guestState, ack] = await Promise.all([
        waitForSocketIoEvent<RoomState>(playerOne, "game:updated"),
        waitForSocketIoEvent<RoomState>(playerTwo, "game:updated"),
        waitForSocketIoAck<{success: boolean}>(playerTwo, "game:call"),
        guest.action("Call 990 (all-in)").click(),
    ]);
    expect(ack.success).toBe(true);
    scenarioState.values.ownerShowdown = JSON.stringify(ownerState);
    scenarioState.values.guestShowdown = JSON.stringify(guestState);
});

Then("the showdown settles a pot of {int} on both screens", async ({playerOne, playerTwo, pageFactory, scenarioState}, expectedPot: number) => {
    const ownerState: RoomState = JSON.parse(scenarioState.values.ownerShowdown);
    const guestState: RoomState = JSON.parse(scenarioState.values.guestShowdown);
    expect(ownerState.viewerId).toBe(scenarioState.values.ownerId);
    expect(guestState.viewerId).toBe(scenarioState.values.guestId);
    expect(guestState.players).toEqual(ownerState.players);
    expect(guestState.communityCards).toEqual(ownerState.communityCards);
    expect(guestState.result).toEqual(ownerState.result);

    for (const [page, state] of [[playerOne, ownerState], [playerTwo, guestState]] as const) {
        expect(state.id).toBe(scenarioState.values.roomId);
        expect(state.phase).toBe("finished");
        expect(state.currentPlayerSeat).toBeNull();
        expect(state.pot).toBe(0);
        expect(state.result?.reason).toBe("showdown");
        expect(state.communityCards).toHaveLength(5);
        expect(state.players.reduce((sum,p) => sum+p.chips,0)).toBe(2000);
        expect(state.result!.pots.reduce((sum,pot)=>sum+pot.amount,0)).toBe(expectedPot);
        for (const pot of state.result!.pots) {
            expect(pot.kind).toBe("pot");
            expect(pot.awards.length).toBeGreaterThan(0);
            expect(pot.awards.reduce((sum,award)=>sum+award.amount,0)).toBe(pot.amount);
            for (const award of pot.awards) {
                expect(pot.eligibleUserIds).toContain(award.userId);
                expect(Number.isSafeInteger(award.amount)).toBe(true);
            }
        }
        const allCards = [...state.communityCards, ...state.players.flatMap(p=>p.hand ?? [])];
        expect(allCards).toHaveLength(9);
        expect(new Set(allCards.map(c=>c.rank+":"+c.suit)).size).toBe(9);
        const room = pageFactory(RoomPage, page);
        await expect(room.stat("Phase")).toHaveText("finished");
        await expect(room.stat("Pot")).toHaveText("0");
        await expect(room.communityCards).toHaveCount(5);
        await expect(page.getByRole("heading", {name:"Hand result", exact:true})).toBeVisible();
        await expect(page.getByRole("region", {name:"Player actions"})).toHaveCount(0);
        for (const player of state.players) {
            expect(player.hand).toHaveLength(2);
            const payout = state.result!.pots.flatMap(pot=>pot.awards)
                .filter(award=>award.userId===player.userId)
                .reduce((sum,award)=>sum+award.amount,0);
            expect(player.chips).toBe(1000-player.totalBet+payout);
            await expect(room.getCards(player.userId)).toHaveCount(2);
            await expect(room.getPlayer(player.userId)).toContainText("Chips: "+player.chips);
        }
    }
});
