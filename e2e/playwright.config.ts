import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
    features: "features/**/*.feature",
    steps: ["steps/**/*.ts", "fixtures/**/*.ts"],
});

export default defineConfig({
    testDir,

    use: {
        baseURL: process.env.BASE_URL_FRONTEND ?? "http://localhost:5173",
        trace: "on-first-retry",
    },

    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
        {
            name: "firefox",
            use: { ...devices["Desktop Firefox"] },
        },
        {
            name: "webkit",
            use: { ...devices["Desktop Safari"] },
        },
    ],

    webServer: [
        {
            command: "npm run start:dev",
            cwd: "../backend",
            url: process.env.VITE_BACKEND_URL ?? "http://localhost:3000",
            reuseExistingServer: !process.env.CI,
        },
        {
            command: "npm run dev -- --host 0.0.0.0",
            cwd: "../frontend",
            url: process.env.BASE_URL_FRONTEND ?? "http://localhost:5173",
            reuseExistingServer: !process.env.CI,
        },
    ],
});
