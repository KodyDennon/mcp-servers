#!/usr/bin/env node
console.log("Error Tracker MCP Server Setup");
console.log("================================");
console.log("");
console.log("Please set the following environment variables:");
console.log("  SENTRY_AUTH_TOKEN - Sentry Auth Token");
console.log("  SENTRY_ORG - Sentry Organization slug");
console.log("  DATADOG_API_KEY - Datadog API Key (optional)");
console.log("  DATADOG_APP_KEY - Datadog Application Key (optional)");
console.log("  NEWRELIC_API_KEY - New Relic API Key (optional)");
console.log("  LOGROCKET_API_KEY - LogRocket API Key (optional)");
console.log("  ROLLBAR_ACCESS_TOKEN - Rollbar Access Token (optional)");
console.log("");
console.log("You can create a .env file in your project root with these values.");
