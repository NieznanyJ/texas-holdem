import { Page } from "@playwright/test";

export const waitForSocketIoAck = <T>(
    page: Page,
    expectedEvent: string,
    timeoutMs = 5000,
): Promise<T> => {
    return new Promise((resolve, reject) => {
        let expectedAckId: string | undefined;

        const timeout = setTimeout(() => {
            reject(
                new Error(
                    `Timeout waiting for ACK for Socket.IO event: ${expectedEvent}`,
                ),
            );
        }, timeoutMs);

        page.on("websocket", (ws) => {
            ws.on("framesent", (event) => {
                const raw = event.payload.toString();

                // Engine.IO message (4) + Socket.IO EVENT (2)
                if (!raw.startsWith("42")) {
                    return;
                }

                const jsonStart = raw.indexOf("[");

                if (jsonStart === -1) {
                    return;
                }

                try {
                    const payload = JSON.parse(raw.slice(jsonStart));

                    const eventName = payload[0];

                    if (eventName !== expectedEvent) {
                        return;
                    }

                    // np.
                    // 421["room:create", {...}]
                    //   ^
                    //   ackId = 1
                    const header = raw.slice(2, jsonStart);
                    const ackIdMatch = header.match(/(\d+)$/);

                    if (!ackIdMatch) {
                        reject(
                            new Error(
                                `Socket.IO event "${expectedEvent}" was sent without ACK id`,
                            ),
                        );
                        return;
                    }

                    expectedAckId = ackIdMatch[1];

                    console.log(
                        `Found ${expectedEvent}, ACK id: ${expectedAckId}`,
                    );
                } catch {
                    // frame nie był JSON-em, ignorujemy
                }
            });

            ws.on("framereceived", (event) => {
                if (!expectedAckId) {
                    return;
                }

                const raw = event.payload.toString();

                // Engine.IO message (4) + Socket.IO ACK (3)
                if (!raw.startsWith("43")) {
                    return;
                }

                const jsonStart = raw.indexOf("[");

                if (jsonStart === -1) {
                    return;
                }

                const header = raw.slice(2, jsonStart);
                const ackIdMatch = header.match(/(\d+)$/);

                if (!ackIdMatch) {
                    return;
                }

                const receivedAckId = ackIdMatch[1];

                if (receivedAckId !== expectedAckId) {
                    return;
                }

                try {
                    const payload = JSON.parse(raw.slice(jsonStart));

                    clearTimeout(timeout);

                    resolve(payload[0] as T);
                } catch (error) {
                    clearTimeout(timeout);
                    reject(error);
                }
            });
        });
    });
};
