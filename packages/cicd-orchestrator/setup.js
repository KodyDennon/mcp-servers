#!/usr/bin/env node
console.log("CI/CD Orchestrator MCP Server Setup");
console.log("====================================");
console.log("");
console.log("Please set the following environment variables:");
console.log("  GITHUB_TOKEN - GitHub Personal Access Token");
console.log("  GITLAB_TOKEN - GitLab Personal Access Token (optional)");
console.log("  CIRCLECI_TOKEN - CircleCI API Token (optional)");
console.log("  JENKINS_URL - Jenkins URL (optional)");
console.log("  JENKINS_USER - Jenkins Username (optional)");
console.log("  JENKINS_TOKEN - Jenkins API Token (optional)");
console.log("");
console.log("You can create a .env file in your project root with these values.");
