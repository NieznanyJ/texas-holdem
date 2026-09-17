import type { Page, WebSocket } from "@playwright/test";

type Frame = { payload: string | Buffer };
type Packet = { type: "2" | "3"; id?: string; data: unknown[] };

// Default namespace, JSON events/ACKs only; binary packets are intentionally ignored.
function parsePacket(frame: Frame): Packet | null {
    const match = /^4([23])(\d*)(\[.*)$/s.exec(frame.payload.toString());
    if (!match) return null;
    try {
        const data: unknown = JSON.parse(match[3]);
        return Array.isArray(data)
            ? { type: match[1] as "2" | "3", id: match[2] || undefined, data }
            : null;
    } catch {
        return null;
    }
}

const sockets = new WeakMap<Page, Set<WebSocket>>();

/** Register before page.goto(), so later waits can observe an existing connection. */
export function trackSocketIo(page: Page): void {
    if (sockets.has(page)) return;
    const connections = new Set<WebSocket>();
    sockets.set(page, connections);
    page.on("websocket", ws => {
        if (new URL(ws.url()).pathname !== "/socket.io/") return;
        connections.add(ws);
        ws.once("close", () => connections.delete(ws));
    });
}

function waitForMessage<T>(
    page: Page,
    event: string,
    kind: "ack" | "event",
    timeoutMs: number,
): Promise<T> {
    trackSocketIo(page);
    return new Promise<T>((resolve, reject) => {
        const listeners = new Map<WebSocket, {
            sent: (frame: Frame) => void;
            received: (frame: Frame) => void;
        }>();
        let expected: { socket: WebSocket; id: string } | undefined;

        function cleanup() {
            clearTimeout(timer);
            page.off("websocket", attach);
            page.off("close", onClose);
            for (const [ws, handlers] of listeners) {
                ws.off("framesent", handlers.sent);
                ws.off("framereceived", handlers.received);
            }
        }

        function fail(message: string) {
            cleanup();
            reject(new Error(message));
        }

        function onClose() {
            fail(`Page closed while waiting for ${kind}: ${event}`);
        }

        function attach(ws: WebSocket) {
            if (new URL(ws.url()).pathname !== "/socket.io/" || listeners.has(ws)) return;

            const sent = (frame: Frame) => {
                if (kind !== "ack" || expected) return;
                const packet = parsePacket(frame);
                if (packet?.type !== "2" || packet.data[0] !== event) return;
                if (packet.id === undefined) {
                    fail(`Socket.IO event "${event}" was sent without an ACK id`);
                    return;
                }
                expected = { socket: ws, id: packet.id };
            };

            const received = (frame: Frame) => {
                const packet = parsePacket(frame);
                if (!packet) return;
                const matches = kind === "event"
                    ? packet.type === "2" && packet.data[0] === event
                    : packet.type === "3" && expected?.socket === ws && expected.id === packet.id;
                if (!matches) return;
                cleanup();
                resolve(packet.data[kind === "event" ? 1 : 0] as T);
            };

            listeners.set(ws, { sent, received });
            ws.on("framesent", sent);
            ws.on("framereceived", received);
        }

        const timer = setTimeout(
            () => fail(`Timeout waiting for Socket.IO ${kind}: ${event}`),
            timeoutMs,
        );
        page.on("close", onClose);
        page.on("websocket", attach);
        for (const ws of sockets.get(page)!) attach(ws);
        if (page.isClosed()) onClose();
    });
}

export const waitForSocketIoAck = <T>(
    page: Page, event: string, timeoutMs = 5000,
): Promise<T> => waitForMessage<T>(page, event, "ack", timeoutMs);

export const waitForSocketIoEvent = <T>(
    page: Page, event: string, timeoutMs = 5000,
): Promise<T> => waitForMessage<T>(page, event, "event", timeoutMs);
