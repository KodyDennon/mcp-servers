import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { access, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
const execFileAsync = promisify(execFile);
const WDA_REPO_URL = "https://github.com/facebook/WebDriverAgent.git";
async function recordFailure(failures, task, remediation) {
  try {
    await task();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    failures.push(`${remediation}\n   ${detail}`);
  }
}
async function ensureWebDriverAgent(projectPath, failures) {
  try {
    await access(projectPath, constants.R_OK);
    return;
  } catch {
    console.error(
      `WebDriverAgent project missing at ${projectPath}. Attempting to clone ${WDA_REPO_URL} automatically...`,
    );
  }
  await recordFailure(
    failures,
    async () => {
      await mkdir(path.dirname(projectPath), { recursive: true });
      await execFileAsync("git", ["clone", WDA_REPO_URL, projectPath]);
      console.error("WebDriverAgent cloned successfully.");
    },
    `Failed to bootstrap WebDriverAgent at ${projectPath}. Clone manually with:\n   git clone ${WDA_REPO_URL} ${projectPath}`,
  );
}
export async function ensureEnvironment(required) {
  if (process.platform !== "darwin") {
    throw new Error(
      "The iOS Simulator MCP server only runs on macOS because it depends on Xcode.",
    );
  }
  const failures = [];
  await recordFailure(
    failures,
    async () => {
      await execFileAsync("xcode-select", ["-p"]);
    },
    "Install Xcode Command Line Tools with `xcode-select --install`.",
  );
  await recordFailure(
    failures,
    async () => {
      await execFileAsync("xcrun", ["simctl", "help"]);
    },
    "Ensure `xcrun simctl` works (launch Xcode once so it registers simulator runtimes).",
  );
  await recordFailure(
    failures,
    async () => {
      await execFileAsync("xcodebuild", ["-version"]);
    },
    "Launch Xcode and accept the license so `xcodebuild` can compile WebDriverAgent.",
  );
  await recordFailure(
    failures,
    async () => {
      await execFileAsync(required.webkitProxy, ["--version"]);
    },
    `Install ios-webkit-debug-proxy via Homebrew: \`brew install ios-webkit-debug-proxy\`, then point IOS_WEBKIT_DEBUG_PROXY_BINARY to it if necessary.`,
  );
  await recordFailure(
    failures,
    async () => {
      await execFileAsync("git", ["--version"]);
    },
    "Install Git (via Xcode tools or https://git-scm.com/download/mac) so WebDriverAgent can be cloned automatically.",
  );
  await ensureWebDriverAgent(required.webDriverAgentProjectPath, failures);
  if (failures.length > 0) {
    throw new Error(
      `Unable to start iOS Simulator MCP server because required tooling is missing:\n\n${failures
        .map((failure) => `- ${failure}`)
        .join(
          "\n",
        )}\n\nSee packages/ios-simulator/README.md for a full setup walkthrough.`,
    );
  }
}
//# sourceMappingURL=environment.js.map
