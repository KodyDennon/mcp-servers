interface RequestOptions {
  method: string;
  path: string;
  body?: Record<string, unknown>;
}

export class WebDriverClient {
  constructor(
    private readonly host: string,
    private readonly port: number,
    private readonly timeoutMs: number,
  ) {}

  private get baseUrl() {
    return `http://${this.host}:${this.port}`;
  }

  private async request<T = unknown>({ method, path, body }: RequestOptions) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        signal: controller.signal,
        body: body ? JSON.stringify(body) : undefined,
      });

      const text = await response.text();
      let data: Record<string, unknown>;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          `WebDriverAgent returned non-JSON response for ${method} ${path}: ${text}`,
        );
      }

      if (!response.ok) {
        const errorValue = (
          data as { value?: { error?: string; message?: string } }
        ).value;
        throw new Error(
          `WebDriverAgent error (${response.status}): ${errorValue?.message || errorValue?.error || text}`,
        );
      }

      const value = (data as { value?: unknown }).value ?? data;
      if (
        value &&
        typeof value === "object" &&
        "error" in value &&
        !(value instanceof Array)
      ) {
        const { error, message } = value as {
          error?: string;
          message?: string;
        };
        throw new Error(
          `WebDriverAgent command failed: ${error ?? "unknown"} ${message ?? ""}`.trim(),
        );
      }

      return value as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  async status() {
    return this.request<{ status: number }>({ method: "GET", path: "/status" });
  }

  async createSession(bundleId: string) {
    const payload = {
      capabilities: {
        alwaysMatch: {
          platformName: "iOS",
          "appium:bundleId": bundleId,
          "appium:automationName": "XCUITest",
          bundleId,
        },
        firstMatch: [{}],
      },
      desiredCapabilities: {
        platformName: "iOS",
        bundleId,
      },
    };
    const result = await this.request<{
      sessionId?: string;
      value?: { sessionId?: string };
    }>({
      method: "POST",
      path: "/session",
      body: payload,
    });
    if (typeof result === "string") {
      return result;
    }
    if (
      result &&
      typeof result === "object" &&
      "sessionId" in result &&
      typeof result.sessionId === "string"
    ) {
      return result.sessionId;
    }
    const value = (result as { value?: { sessionId?: string } }).value;
    if (value?.sessionId) {
      return value.sessionId;
    }
    throw new Error("WebDriverAgent did not return a sessionId.");
  }

  async deleteSession(sessionId: string) {
    await this.request({
      method: "DELETE",
      path: `/session/${sessionId}`,
    });
  }

  async tap(
    sessionId: string,
    options: { x: number; y: number; duration?: number },
  ) {
    await this.request({
      method: "POST",
      path: `/session/${sessionId}/wda/tap/0`,
      body: {
        x: options.x,
        y: options.y,
        duration: options.duration ?? 0,
      },
    });
  }

  async swipe(
    sessionId: string,
    options: {
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      duration?: number;
    },
  ) {
    await this.request({
      method: "POST",
      path: `/session/${sessionId}/wda/dragfromtoforduration`,
      body: {
        fromX: options.fromX,
        fromY: options.fromY,
        toX: options.toX,
        toY: options.toY,
        duration: options.duration ?? 0.25,
      },
    });
  }

  async typeText(sessionId: string, text: string) {
    await this.request({
      method: "POST",
      path: `/session/${sessionId}/wda/text`,
      body: { text },
    });
  }

  async pressButton(sessionId: string, button: string) {
    await this.request({
      method: "POST",
      path: `/session/${sessionId}/wda/pressButton`,
      body: { name: button },
    });
  }

  async getPageSource(sessionId: string) {
    const result = await this.request<{ value?: string; source?: string }>({
      method: "GET",
      path: `/session/${sessionId}/source`,
    });
    if (typeof result === "string") {
      return result;
    }
    if (result && typeof result === "object") {
      if ("source" in result && typeof result.source === "string") {
        return result.source;
      }
      if ("value" in result && typeof result.value === "string") {
        return result.value;
      }
    }
    throw new Error("WebDriverAgent did not return page source.");
  }

  async launchApp(sessionId: string, bundleId: string, args: string[] = []) {
    await this.request({
      method: "POST",
      path: `/session/${sessionId}/wda/apps/launch`,
      body: {
        bundleId,
        arguments: args,
      },
    });
  }

  async terminateApp(sessionId: string, bundleId: string) {
    await this.request({
      method: "POST",
      path: `/session/${sessionId}/wda/apps/terminate`,
      body: { bundleId },
    });
  }
}
