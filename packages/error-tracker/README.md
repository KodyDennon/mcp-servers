# Error Tracker & Observability Hub MCP Server

A Model Context Protocol (MCP) server that provides unified access to error tracking and observability platforms including Sentry, Datadog, New Relic, LogRocket, and Rollbar.

## Features

- **Sentry**: Query issues, get error details, update issue status
- **Datadog**: Search logs, query metrics, monitor alerts
- **New Relic**: Run NRQL queries, track error rates, list applications
- **LogRocket**: Access session recordings and user sessions
- **Rollbar**: List and manage error items
- **AI-Powered**: Designed for AI assistants to help triage errors and identify root causes

## Installation

```bash
npm install -g mcp-error-tracker
```

## Configuration

Set the following environment variables in your `.env` file:

```env
# Sentry (required for Sentry tools)
SENTRY_AUTH_TOKEN=your_sentry_auth_token
SENTRY_ORG=your_org_slug

# Datadog (optional)
DATADOG_API_KEY=your_datadog_api_key
DATADOG_APP_KEY=your_datadog_app_key

# New Relic (optional)
NEWRELIC_API_KEY=your_newrelic_api_key

# LogRocket (optional)
LOGROCKET_API_KEY=your_logrocket_api_key

# Rollbar (optional)
ROLLBAR_ACCESS_TOKEN=your_rollbar_access_token
```

## Available Tools

### Sentry
- `sentry_list_issues` - List recent errors and issues
- `sentry_get_issue` - Get detailed issue information
- `sentry_get_issue_events` - Get all events for an issue
- `sentry_update_issue` - Update issue status (resolve, ignore, assign)
- `sentry_get_stats` - Get project statistics and trends

### Datadog
- `datadog_search_logs` - Search logs for errors and events
- `datadog_get_metrics` - Query metrics
- `datadog_list_monitors` - List monitors
- `datadog_get_monitor` - Get monitor details

### New Relic
- `newrelic_query_nrql` - Run NRQL queries
- `newrelic_list_applications` - List all applications
- `newrelic_get_error_rate` - Get error rate for an application

### LogRocket
- `logrocket_list_sessions` - List recent user sessions
- `logrocket_get_session` - Get session details

### Rollbar
- `rollbar_list_items` - List recent error items
- `rollbar_get_item` - Get item details
- `rollbar_update_item` - Update item status

## License

MIT
