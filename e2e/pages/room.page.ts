import { Locator, Page } from "@playwright/test";

class RoomPage {
    private readonly page: Page;
    readonly title: Locator;
    readonly startHandButton: Locator;
    readonly card: Locator;

    constructor(page: Page) {
        this.page = page;
        this.title = this.page.getByRole("heading", { level: 1 });
        this.startHandButton = this.page.getByRole("button", {
            name: "Start hand",
        });
        this.card = this.page.getByTestId("card");
    }

    get communityCards(): Locator {
        return this.page.locator("section").filter({
            has: this.page.getByRole("heading", { name: "Community cards", exact: true }),
        }).getByTestId("card");
    }

    get raiseAmount(): Locator {
        return this.page.getByRole("region", {name: "Player actions"}).getByLabel("Raise to", {exact: true});
    }

    action(name: string): Locator {
        return this.page.getByRole("region", {name: "Player actions"}).getByRole("button", {name, exact: true});
    }

    stat(name: string): Locator {
        return this.page.locator("dl > div").filter({
            has: this.page.locator("dt").filter({hasText: new RegExp("^" + name + "$")}),
        }).locator("dd");
    }

    getPlayer(userId: string): Locator {
        return this.page.locator("article").filter({has: this.page.getByText(userId, {exact:true})});
    }

    getCards(userId: string): Locator {
        return this.page
            .locator("article")
            .filter({
                has: this.page.getByText(userId, { exact: true }),
            })
            .getByTestId("card");
    }
}

export default RoomPage;
