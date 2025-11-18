/**
 * OAuth Configuration
 */
export class OAuthConfig {
    constructor(options?: {});
    clientId: any;
    clientSecret: any;
    redirectUri: any;
    authUrl: any;
    tokenUrl: any;
    scope: any;
    state: any;
    generateState(): string;
    validate(): boolean;
    getAuthorizationUrl(): string;
}
/**
 * OAuth Flow Handler
 * Simplifies the OAuth authorization code flow
 */
export class OAuthFlow {
    constructor(config: any);
    config: OAuthConfig;
    server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse> | null;
    accessToken: any;
    refreshToken: any;
    expiresAt: Date | null;
    /**
     * Start OAuth flow with automatic browser redirect
     */
    authorize(): Promise<any>;
    /**
     * Exchange authorization code for access token
     */
    exchangeCodeForToken(code: any): Promise<unknown>;
    /**
     * Refresh access token using refresh token
     */
    refreshAccessToken(): Promise<unknown>;
    /**
     * Check if access token is expired
     */
    isTokenExpired(): boolean;
    /**
     * Get valid access token, refreshing if necessary
     */
    getAccessToken(): Promise<any>;
    /**
     * Stop the OAuth callback server
     */
    stopServer(): void;
}
/**
 * Simple authentication helper for basic auth and API keys
 */
export class SimpleAuth {
    constructor(options?: {});
    type: any;
    key: any;
    username: any;
    password: any;
    getHeaders(): {
        "X-API-Key": any;
        Authorization?: undefined;
    } | {
        Authorization: string;
        "X-API-Key"?: undefined;
    };
}
import http from "http";
//# sourceMappingURL=oauth.d.ts.map