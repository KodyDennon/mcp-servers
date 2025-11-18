/**
 * OAuth 2.0 Authentication Helper
 * Simplifies OAuth setup for MCP servers
 */
import http from "http";
import { URL } from "url";
import { MCPError, validateEnvironment } from "./errorHandler.js";
/**
 * OAuth Configuration
 */
export class OAuthConfig {
  constructor(options = {}) {
    this.clientId = options.clientId || process.env.OAUTH_CLIENT_ID;
    this.clientSecret = options.clientSecret || process.env.OAUTH_CLIENT_SECRET;
    this.redirectUri =
      options.redirectUri ||
      process.env.OAUTH_REDIRECT_URI ||
      "http://localhost:3000/oauth/callback";
    this.authUrl = options.authUrl || process.env.OAUTH_AUTH_URL;
    this.tokenUrl = options.tokenUrl || process.env.OAUTH_TOKEN_URL;
    this.scope = options.scope || "read write";
    this.state = options.state || this.generateState();
  }
  generateState() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
  validate() {
    const missing = [];
    if (!this.clientId) missing.push("clientId");
    if (!this.clientSecret) missing.push("clientSecret");
    if (!this.authUrl) missing.push("authUrl");
    if (!this.tokenUrl) missing.push("tokenUrl");
    if (missing.length > 0) {
      throw new MCPError(
        "AUTH_MISSING_ENV_VARS",
        "OAuth configuration is incomplete",
        {
          missing_fields: missing,
          hint: "Set OAuth environment variables or pass them in the config",
          example: {
            OAUTH_CLIENT_ID: "your-client-id",
            OAUTH_CLIENT_SECRET: "your-client-secret",
            OAUTH_AUTH_URL: "https://provider.com/oauth/authorize",
            OAUTH_TOKEN_URL: "https://provider.com/oauth/token",
          },
        },
      );
    }
    return true;
  }
  getAuthorizationUrl() {
    this.validate();
    const url = new URL(this.authUrl);
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("redirect_uri", this.redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", this.scope);
    url.searchParams.set("state", this.state);
    return url.toString();
  }
}
/**
 * OAuth Flow Handler
 * Simplifies the OAuth authorization code flow
 */
export class OAuthFlow {
  constructor(config) {
    this.config =
      config instanceof OAuthConfig ? config : new OAuthConfig(config);
    this.server = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
  }
  /**
   * Start OAuth flow with automatic browser redirect
   */
  async authorize() {
    this.config.validate();
    console.error("\n🔐 OAuth Authorization Required");
    console.error("================================\n");
    const authUrl = this.config.getAuthorizationUrl();
    console.error("Please visit this URL to authorize:");
    console.error(`\n${authUrl}\n`);
    console.error("Waiting for authorization callback...\n");
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.stopServer();
        reject(
          new MCPError("NETWORK_TIMEOUT", "OAuth authorization timeout", {
            timeout_seconds: 300,
            hint: "Complete authorization within 5 minutes",
          }),
        );
      }, 300000); // 5 minute timeout
      this.server = http.createServer(async (req, res) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        if (url.pathname === "/oauth/callback") {
          clearTimeout(timeout);
          const code = url.searchParams.get("code");
          const state = url.searchParams.get("state");
          const error = url.searchParams.get("error");
          if (error) {
            res.writeHead(400, { "Content-Type": "text/html" });
            res.end(`
              <html>
                <body>
                  <h1>❌ Authorization Failed</h1>
                  <p>Error: ${error}</p>
                  <p>You can close this window.</p>
                </body>
              </html>
            `);
            this.stopServer();
            reject(
              new MCPError(
                "AUTH_INVALID_CREDENTIALS",
                `OAuth authorization failed: ${error}`,
                {
                  error: error,
                  hint: "Check your OAuth provider settings",
                },
              ),
            );
            return;
          }
          if (state !== this.config.state) {
            res.writeHead(400, { "Content-Type": "text/html" });
            res.end(`
              <html>
                <body>
                  <h1>❌ Invalid State</h1>
                  <p>Security check failed. Please try again.</p>
                </body>
              </html>
            `);
            this.stopServer();
            reject(
              new MCPError("AUTH_INVALID_CREDENTIALS", "OAuth state mismatch", {
                hint: "Possible CSRF attack detected",
              }),
            );
            return;
          }
          try {
            await this.exchangeCodeForToken(code);
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(`
              <html>
                <body>
                  <h1>✅ Authorization Successful!</h1>
                  <p>You can close this window and return to your application.</p>
                  <script>setTimeout(() => window.close(), 3000);</script>
                </body>
              </html>
            `);
            this.stopServer();
            resolve({
              accessToken: this.accessToken,
              refreshToken: this.refreshToken,
              expiresAt: this.expiresAt,
            });
          } catch (error) {
            res.writeHead(500, { "Content-Type": "text/html" });
            res.end(`
              <html>
                <body>
                  <h1>❌ Token Exchange Failed</h1>
                  <p>${error.message}</p>
                </body>
              </html>
            `);
            this.stopServer();
            reject(error);
          }
        } else {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not Found");
        }
      });
      const port = new URL(this.config.redirectUri).port || 3000;
      this.server.listen(port, () => {
        console.error(`✓ Callback server listening on port ${port}`);
      });
      this.server.on("error", (error) => {
        clearTimeout(timeout);
        reject(
          new MCPError(
            "NETWORK_UNAVAILABLE",
            `Failed to start OAuth callback server: ${error.message}`,
            {
              port: port,
              hint: `Ensure port ${port} is available`,
            },
          ),
        );
      });
    });
  }
  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code) {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });
    try {
      const response = await fetch(this.config.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new MCPError(
          "AUTH_INVALID_CREDENTIALS",
          `Token exchange failed: ${response.status} ${response.statusText}`,
          {
            status: response.status,
            error: error,
            hint: "Check your OAuth client credentials",
          },
        );
      }
      const data = await response.json();
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.expiresAt = data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : null;
      return data;
    } catch (error) {
      if (error instanceof MCPError) {
        throw error;
      }
      throw new MCPError(
        "NETWORK_UNAVAILABLE",
        `Failed to exchange code for token: ${error.message}`,
        {
          hint: "Check network connectivity and token URL",
        },
      );
    }
  }
  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new MCPError(
        "AUTH_INVALID_CREDENTIALS",
        "No refresh token available",
        {
          hint: "Complete initial authorization first",
        },
      );
    }
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: this.refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });
    try {
      const response = await fetch(this.config.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });
      if (!response.ok) {
        throw new MCPError(
          "AUTH_TOKEN_EXPIRED",
          "Failed to refresh access token",
          {
            status: response.status,
            hint: "Re-authorize to get a new token",
          },
        );
      }
      const data = await response.json();
      this.accessToken = data.access_token;
      if (data.refresh_token) {
        this.refreshToken = data.refresh_token;
      }
      this.expiresAt = data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : null;
      return data;
    } catch (error) {
      if (error instanceof MCPError) {
        throw error;
      }
      throw new MCPError(
        "NETWORK_UNAVAILABLE",
        `Failed to refresh token: ${error.message}`,
        {
          hint: "Check network connectivity",
        },
      );
    }
  }
  /**
   * Check if access token is expired
   */
  isTokenExpired() {
    if (!this.expiresAt) {
      return false; // Unknown expiry, assume valid
    }
    // Add 5 minute buffer before actual expiry
    return new Date(Date.now() + 300000) >= this.expiresAt;
  }
  /**
   * Get valid access token, refreshing if necessary
   */
  async getAccessToken() {
    if (!this.accessToken) {
      throw new MCPError("AUTH_INVALID_CREDENTIALS", "Not authorized", {
        hint: "Call authorize() first",
      });
    }
    if (this.isTokenExpired()) {
      console.error("Access token expired, refreshing...");
      await this.refreshAccessToken();
    }
    return this.accessToken;
  }
  /**
   * Stop the OAuth callback server
   */
  stopServer() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}
/**
 * Simple authentication helper for basic auth and API keys
 */
export class SimpleAuth {
  constructor(options = {}) {
    this.type = options.type || "api_key"; // 'api_key', 'bearer', 'basic'
    this.key = options.key || process.env.API_KEY;
    this.username = options.username || process.env.AUTH_USERNAME;
    this.password = options.password || process.env.AUTH_PASSWORD;
  }
  getHeaders() {
    switch (this.type) {
      case "api_key":
        if (!this.key) {
          throw new MCPError(
            "AUTH_MISSING_ENV_VARS",
            "API key not configured",
            {
              hint: "Set API_KEY environment variable",
            },
          );
        }
        return {
          "X-API-Key": this.key,
        };
      case "bearer":
        if (!this.key) {
          throw new MCPError(
            "AUTH_MISSING_ENV_VARS",
            "Bearer token not configured",
            {
              hint: "Set API_KEY environment variable",
            },
          );
        }
        return {
          Authorization: `Bearer ${this.key}`,
        };
      case "basic":
        if (!this.username || !this.password) {
          throw new MCPError(
            "AUTH_MISSING_ENV_VARS",
            "Basic auth credentials not configured",
            {
              missing_vars: [
                !this.username && "AUTH_USERNAME",
                !this.password && "AUTH_PASSWORD",
              ].filter(Boolean),
              hint: "Set AUTH_USERNAME and AUTH_PASSWORD environment variables",
            },
          );
        }
        const credentials = Buffer.from(
          `${this.username}:${this.password}`,
        ).toString("base64");
        return {
          Authorization: `Basic ${credentials}`,
        };
      default:
        throw new MCPError(
          "VALIDATION_INVALID_INPUT",
          `Unknown auth type: ${this.type}`,
          {
            supported_types: ["api_key", "bearer", "basic"],
          },
        );
    }
  }
}
//# sourceMappingURL=oauth.js.map
