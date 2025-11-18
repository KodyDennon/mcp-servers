# Smart Dependency Manager MCP Server

A Model Context Protocol (MCP) server for intelligent dependency management. Analyze dependencies, check for updates, security vulnerabilities, license issues, and bundle size impacts with AI-powered recommendations.

## Features

- **Dependency Analysis**: Analyze package.json, detect duplicates, estimate bundle sizes
- **Security Scanning**: Run npm audit, get security advisories, check CVEs
- **License Management**: Check license compliance, classify licenses, generate reports
- **Update Intelligence**: Identify safe updates, detect breaking changes, get changelogs
- **AI-Powered**: Designed for AI assistants to make smart dependency decisions

## Installation

```bash
npm install -g mcp-dependency-manager
```

## Configuration

Optional environment variables:

```env
NPM_TOKEN=your_npm_token  # For private packages
SNYK_TOKEN=your_snyk_token  # For enhanced security scanning
```

## Available Tools

### Analysis Tools (4 tools)
- `deps_analyze_package` - Analyze package.json dependency tree
- `deps_list_outdated` - List outdated dependencies
- `deps_analyze_bundle_size` - Estimate bundle size impact
- `deps_find_duplicates` - Find duplicate dependencies

### Security Tools (3 tools)
- `deps_audit_vulnerabilities` - Run npm audit for vulnerabilities
- `deps_security_advisories` - Get detailed security advisories
- `deps_check_package_security` - Check specific package security

### License Tools (3 tools)
- `deps_license_check` - Check for license compliance issues
- `deps_license_report` - Generate comprehensive license report
- `deps_license_classify` - Classify licenses by type

### Update Tools (4 tools)
- `deps_check_updates` - Check for available updates
- `deps_suggest_safe_updates` - Suggest safe (non-breaking) updates
- `deps_get_changelog` - Get changelog between versions
- `deps_suggest_alternatives` - Find better-maintained alternatives

## Usage Example

Point the server at a directory containing package.json:

```typescript
// List outdated dependencies
{
  "name": "deps_list_outdated",
  "arguments": {
    "directory": "/path/to/project"
  }
}

// Check security vulnerabilities
{
  "name": "deps_audit_vulnerabilities",
  "arguments": {
    "directory": "/path/to/project",
    "level": "high"
  }
}

// Suggest safe updates
{
  "name": "deps_suggest_safe_updates",
  "arguments": {
    "directory": "/path/to/project"
  }
}
```

## License

MIT
