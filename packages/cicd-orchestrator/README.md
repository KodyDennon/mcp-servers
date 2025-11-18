# CI/CD Orchestrator MCP Server

A Model Context Protocol (MCP) server that provides unified access to multiple CI/CD platforms including GitHub Actions, GitLab CI, CircleCI, and Jenkins.

## Features

- **GitHub Actions**: List, trigger, monitor, and manage workflows
- **GitLab CI**: Control pipelines across GitLab projects
- **CircleCI**: Manage CircleCI pipelines
- **Jenkins**: Trigger and monitor Jenkins builds
- **AI-Powered**: Designed for AI assistants to help debug pipeline failures and optimize workflows

## Installation

```bash
npm install -g mcp-cicd-orchestrator
```

## Configuration

Set the following environment variables in your `.env` file:

```env
# GitHub (required for GitHub Actions)
GITHUB_TOKEN=your_github_token

# GitLab (optional)
GITLAB_TOKEN=your_gitlab_token
GITLAB_URL=https://gitlab.com/api/v4

# CircleCI (optional)
CIRCLECI_TOKEN=your_circleci_token

# Jenkins (optional)
JENKINS_URL=https://your-jenkins.com
JENKINS_USER=your_username
JENKINS_TOKEN=your_api_token
```

## Available Tools

### GitHub Actions
- `github_list_workflows` - List all workflows
- `github_get_workflow_runs` - Get workflow run history
- `github_trigger_workflow` - Trigger a workflow
- `github_get_workflow_logs` - Get workflow logs
- `github_cancel_workflow_run` - Cancel a running workflow
- `github_rerun_workflow` - Rerun a failed workflow

### GitLab CI
- `gitlab_list_pipelines` - List pipelines
- `gitlab_get_pipeline` - Get pipeline details
- `gitlab_trigger_pipeline` - Trigger a pipeline
- `gitlab_cancel_pipeline` - Cancel a pipeline
- `gitlab_retry_pipeline` - Retry a failed pipeline

### CircleCI
- `circleci_list_pipelines` - List pipelines
- `circleci_get_pipeline` - Get pipeline details
- `circleci_trigger_pipeline` - Trigger a pipeline

### Jenkins
- `jenkins_list_jobs` - List all jobs
- `jenkins_get_job` - Get job details
- `jenkins_trigger_build` - Trigger a build
- `jenkins_get_build` - Get build details
- `jenkins_stop_build` - Stop a running build

## License

MIT
