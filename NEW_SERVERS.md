# New MCP Servers

This repository now includes 4 brand new MCP servers designed to solve real developer pain points:

## 1. CI/CD Pipeline Orchestrator (`packages/cicd-orchestrator`)

**What it does:** Unified CI/CD management across multiple platforms

**Tools:** 21 total
- GitHub Actions (6 tools): workflows, runs, logs, triggers
- GitLab CI (5 tools): pipelines, triggers, cancellation
- CircleCI (3 tools): pipeline management
- Jenkins (5 tools): job and build management

**Why developers want it:**
- Stop switching between CI/CD dashboards
- Debug failed pipelines faster with AI assistance
- Manage deployments from your IDE

## 2. Error Tracking & Observability Hub (`packages/error-tracker`)

**What it does:** Unified error tracking across observability platforms

**Tools:** 17 total
- Sentry (5 tools): issues, events, stats, updates
- Datadog (4 tools): logs, metrics, monitors
- New Relic (3 tools): NRQL queries, error rates
- LogRocket (2 tools): session recordings
- Rollbar (3 tools): error item management

**Why developers want it:**
- No more jumping between Sentry/Datadog/New Relic tabs
- AI-powered root cause analysis
- Correlate errors with deployments automatically

## 3. Smart Dependency Manager (`packages/dependency-manager`)

**What it does:** Intelligent dependency management with AI recommendations

**Tools:** 14 total
- Analysis (4 tools): outdated packages, bundle size, duplicates
- Security (3 tools): npm audit, CVE checking, advisories
- License (3 tools): compliance checking, classification, reports
- Updates (4 tools): safe updates, changelogs, alternatives

**Why developers want it:**
- Know which updates are safe before upgrading
- Catch license compliance issues early
- Find better-maintained alternatives to abandoned packages
- Understand bundle size impact before adding dependencies

## 4. Local Dev Environment Orchestrator (`packages/dev-environment`)

**What it does:** Manage local dev environments, runtimes, and services

**Tools:** 19 total
- Runtime Management (6 tools): nvm, pyenv, rbenv version switching
- Docker (6 tools): container and docker-compose management
- Dev Containers (3 tools): config detection and generation
- Services (4 tools): health checks for Postgres, Redis, MongoDB

**Why developers want it:**
- One-command environment setup for any project
- Seamless switching between projects with different Node/Python versions
- Auto-detect and start required services
- Generate dev container configs on the fly

## Authentication Note

For production use, these servers should implement OAuth/web-based authentication flows where users authenticate through their browser for services like GitHub, Sentry, Datadog, etc. This is more secure than storing API tokens and provides a better user experience.

## Installation

Each server can be installed independently:

```bash
npm install -g mcp-cicd-orchestrator
npm install -g mcp-error-tracker
npm install -g mcp-dependency-manager
npm install -g mcp-dev-environment
```

## Development

Build all packages:
```bash
pnpm build
```

Test all packages:
```bash
pnpm test
```

## License

MIT
