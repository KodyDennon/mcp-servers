import WebSocket, { type RawData } from "ws";

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout?: NodeJS.Timeout;
}

export class InspectorSession {
  private readonly socket: WebSocket;
  private nextCommandId = 0;
  private readonly pending = new Map<number, PendingRequest>();
  private openPromise: Promise<void> | null = null;

  constructor(
    private readonly endpoint: string,
    private readonly timeoutMs: number,
  ) {
    this.socket = new WebSocket(endpoint);
    this.socket.on("message", (data) => this.handleMessage(data));
    this.socket.on("error", (error) => this.failPending(error));
    this.socket.on("close", () =>
      this.failPending(new Error("Inspector connection closed")),
    );
  }

  private handleMessage(data: RawData) {
    try {
      const message = JSON.parse(data.toString()) as {
        id?: number;
        result?: unknown;
        error?: { message?: string };
      };

      if (typeof message.id !== "number") {
        return;
      }

      const pending = this.pending.get(message.id);
      if (!pending) {
        return;
      }

      if (pending.timeout) {
        clearTimeout(pending.timeout);
      }

      this.pending.delete(message.id);

      if (message.error) {
        pending.reject(
          new Error(message.error.message ?? "Inspector command failed"),
        );
      } else {
        pending.resolve(message.result);
      }
    } catch (error) {
      console.error("Failed to parse inspector message:", error);
    }
  }

  private failPending(error: Error) {
    for (const [, request] of this.pending) {
      if (request.timeout) {
        clearTimeout(request.timeout);
      }
      request.reject(error);
    }
    this.pending.clear();
  }

  async open() {
    if (this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.socket.readyState === WebSocket.CLOSED) {
      throw new Error("Inspector connection already closed.");
    }

    if (!this.openPromise) {
      this.openPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Timed out connecting to WebKit inspector target."));
        }, this.timeoutMs);

        this.socket.once("open", () => {
          clearTimeout(timeout);
          resolve();
        });

        this.socket.once("error", (error) => {
          clearTimeout(timeout);
          reject(
            error instanceof Error
              ? error
              : new Error("Failed to open inspector socket"),
          );
        });
      });
    }

    await this.openPromise;
  }

  send<T>(method: string, params?: Record<string, unknown>) {
    return new Promise<T>((resolve, reject) => {
      if (this.socket.readyState !== WebSocket.OPEN) {
        reject(new Error("Inspector session is not ready."));
        return;
      }
      const id = ++this.nextCommandId;
      const payload = JSON.stringify({ id, method, params });

      const timeout = setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`Inspector command ${method} timed out.`));
        }
      }, this.timeoutMs);

      const pendingResolve = (value: unknown) => {
        resolve(value as T);
      };

      this.pending.set(id, {
        resolve: pendingResolve,
        reject: (error) => reject(error),
        timeout,
      });
      this.socket.send(payload);
    });
  }

  dispose() {
    this.socket.removeAllListeners();
    this.failPending(new Error("Inspector session disposed"));
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
    }
  }
}
