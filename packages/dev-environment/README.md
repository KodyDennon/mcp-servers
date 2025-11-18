# Local Dev Environment Orchestrator MCP Server

A Model Context Protocol (MCP) server for managing local development environments. Handles runtime versions (nvm, pyenv, rbenv), Docker containers, dev containers, and local services with AI assistance.

## Features

- **Runtime Management**: Detect, install, and switch between Node.js, Python, Ruby versions
- **Docker Integration**: Manage containers and docker-compose services
- **Dev Containers**: Detect and configure dev container environments
- **Service Health**: Monitor PostgreSQL, Redis, MongoDB, and other local services
- **AI-Powered**: Designed for AI assistants to set up and switch environments automatically

## Installation

```bash
npm install -g mcp-dev-environment
```

## Requirements

- **Docker**: Required for container management
- **nvm**: Optional, for Node.js version management
- **pyenv**: Optional, for Python version management
- **rbenv**: Optional, for Ruby version management

The server will detect which tools you have installed.

## Available Tools

### Runtime Management (6 tools)
- `runtime_detect_requirements` - Detect required versions from project files
- `runtime_list_node_versions` - List installed Node.js versions
- `runtime_use_node_version` - Switch to specific Node.js version
- `runtime_install_node_version` - Install Node.js version via nvm
- `runtime_list_python_versions` - List Python versions via pyenv
- `runtime_check_current_versions` - Check active runtime versions

### Docker Tools (6 tools)
- `docker_list_containers` - List Docker containers
- `docker_start_container` - Start a container
- `docker_stop_container` - Stop a container
- `docker_compose_up` - Start docker-compose services
- `docker_compose_down` - Stop docker-compose services
- `docker_compose_ps` - List docker-compose services

### Dev Container Tools (3 tools)
- `devcontainer_detect` - Check for dev container config
- `devcontainer_read_config` - Read devcontainer.json
- `devcontainer_generate_config` - Generate dev container config

### Service Tools (4 tools)
- `service_check_postgres` - Check PostgreSQL status
- `service_check_redis` - Check Redis status
- `service_check_mongodb` - Check MongoDB status
- `service_health_check` - Health check all services

## Usage Example

```typescript
// Detect project requirements
{
  "name": "runtime_detect_requirements",
  "arguments": {
    "directory": "/path/to/project"
  }
}

// Start docker-compose services
{
  "name": "docker_compose_up",
  "arguments": {
    "directory": "/path/to/project",
    "detach": true
  }
}

// Check service health
{
  "name": "service_health_check",
  "arguments": {}
}
```

## License

MIT
