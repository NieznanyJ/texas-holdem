import { Locator, Page } from "@playwright/test";

class LobbyPage {
    private readonly page: Page;
    readonly createRoomForm: Locator;
    private readonly joinRoomForm: Locator;
    private readonly createRoomButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.createRoomForm = this.page.getByTestId("create-room-form");
        this.joinRoomForm = this.page.getByTestId("join-room-form");
        this.createRoomButton = this.page.getByRole("button", {
            name: "Create and join",
        });
    }

    async goto() {
        await this.page.goto("/");
    }

    getLobbyForm(formType: "create" | "join"): Locator {
        return formType === "create" ? this.createRoomForm : this.joinRoomForm;
    }

    getLobbyFromButton(formType: "create" | "join"): Locator {
        return this.getLobbyForm(formType).locator("button");
    }

    async createRoom(roomName: string): Promise<void> {
        await this.getLobbyForm("create").locator("input").fill(roomName);
        await this.getLobbyFromButton("create").click();
    }

    async joinRoom(roomId: string): Promise<void> {
        await this.getLobbyForm("join").locator("input").fill(roomId);
        await this.getLobbyFromButton("join").click();
    }
}

export default LobbyPage;
