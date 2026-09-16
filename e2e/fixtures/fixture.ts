import { Browser, Page } from "@playwright/test";
import { test as base, createBdd } from "playwright-bdd";

type ScenarioState = {
    values: Record<string, string>;
};

type Fixtures = {
    pageFactory: PageFactory;
    scenarioState: ScenarioState;
    playerOne: Page;
    playerTwo: Page;
    playerThree: Page;
};

const createNewPlayerBrowserContext = async (
    { browser }: { browser: Browser },
    use: (page: Page) => Promise<void>,
) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await use(page);

    await context.close();
};
type PageObjectConstructor<T> = new (page: Page) => T;

type PageFactory = <T>(PageObject: PageObjectConstructor<T>, page: Page) => T;

const createPageFactory: PageFactory = <T>(
    PageObject: PageObjectConstructor<T>,
    page: Page,
): T => {
    return new PageObject(page);
};

export const test = base.extend<Fixtures>({
    playerOne: createNewPlayerBrowserContext,
    playerTwo: createNewPlayerBrowserContext,
    playerThree: createNewPlayerBrowserContext,
    pageFactory: async ({}, use) => {
        await use(createPageFactory);
    },
    scenarioState: async ({}, use) => {
        await use({
            values: {},
        });
    },
});

export const { Given, When, Then } = createBdd(test);
