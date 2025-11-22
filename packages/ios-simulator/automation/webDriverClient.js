export class WebDriverClient {
  host;
  port;
  timeoutMs;
  constructor(host, port, timeoutMs) {
    this.host = host;
    this.port = port;
    this.timeoutMs = timeoutMs;
  }
  get baseUrl() {
    return `http://${this.host}:${this.port}`;
  }
  async request({ method, path, body }) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const headers = {
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
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          `WebDriverAgent returned non-JSON response for ${method} ${path}: ${text}`,
        );
      }
      if (!response.ok) {
        const errorValue = data.value;
        throw new Error(
          `WebDriverAgent error (${response.status}): ${errorValue?.message || errorValue?.error || text}`,
        );
      }
      const value = data.value ?? data;
      if (
        value &&
        typeof value === "object" &&
        "error" in value &&
        !(value instanceof Array)
      ) {
        const { error, message } = value;
        throw new Error(
          `WebDriverAgent command failed: ${error ?? "unknown"} ${message ?? ""}`.trim(),
        );
      }
      return value;
    } finally {
      clearTimeout(timeout);
    }
  }
  async status() {
    return this.request({ method: "GET", path: "/status" });
  }
  async createSession(bundleId) {
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
    const result = await this.request({
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
    const value = result.value;
    if (value?.sessionId) {
      return value.sessionId;
    }
    throw new Error("WebDriverAgent did not return a sessionId.");
  }
  async deleteSession(sessionId) {
    await this.request({
      method: "DELETE",
      path: `/session/${sessionId}`,
    });
  }
  async tap(sessionId, options) {
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
  async swipe(sessionId, options) {
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
  async typeText(sessionId, text) {
    await this.request({
      method: "POST",
      path: `/session/${sessionId}/wda/text`,
      body: { text },
    });
  }
  async pressButton(sessionId, button) {
    await this.request({
      method: "POST",
      path: `/session/${sessionId}/wda/pressButton`,
      body: { name: button },
    });
  }
  async getPageSource(sessionId) {
    const result = await this.request({
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
  async launchApp(sessionId, bundleId, args = []) {
    await this.request({
      method: "POST",
      path: `/session/${sessionId}/wda/apps/launch`,
      body: {
        bundleId,
        arguments: args,
      },
    });
  }
  async terminateApp(sessionId, bundleId) {
    await this.request({
      method: "POST",
      path: `/session/${sessionId}/wda/apps/terminate`,
      body: { bundleId },
    });
  }
}
//# sourceMappingURL=webDriverClient.js.map
