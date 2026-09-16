import { Locator, Page } from "@playwright/test";

class RoomPage {
    private readonly page: Page;
    readonly title: Locator;
    constructor(page: Page) {
        this.page = page;
        this.title = this.page.getByRole("heading", { level: 1 });
    }
}

export default RoomPage;
