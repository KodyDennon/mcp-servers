# mcp-ios-simulator

MCP server that turns the Xcode iPhone Simulator into a remote-friendly testing surface for AI agents. Think “Chrome DevTools” but pointed at a real iOS simulator: boot devices, open Safari, grab screenshots, and tap into the WebKit Remote Inspector to run DOM queries or capture page snapshots.

## 🧱 Requirements

- macOS with Xcode + Command Line Tools installed (`xcode-select --install`)
- Access to the `Simulator` app (`/Applications/Xcode.app/Contents/Developer/Applications/Simulator.app`)
- WebKit inspector proxy (`brew install ios-webkit-debug-proxy`) – override the binary via `IOS_WEBKIT_DEBUG_PROXY_BINARY` if needed
- Enable **Develop → Allow Remote Automation** in Safari so WebInspector surfaces simulator tabs
- [WebDriverAgent](https://github.com/facebook/WebDriverAgent) checked out locally for native automation (clone anywhere and set `IOS_WDA_PROJECT_PATH` if not using `~/WebDriverAgent`)
- Git (ships with Command Line Tools) so WebDriverAgent can be auto-cloned on first run if it’s missing
- Grant macOS accessibility permissions to both Terminal and Simulator so WebDriverAgent/Xcode can control the device windows

## 🚀 Quick start

```bash
pnpm install
pnpm --filter mcp-ios-simulator build
pnpm --filter mcp-ios-simulator start
```

Or install globally:

```bash
pnpm dlx mcp-ios-simulator
# or
npm install -g mcp-ios-simulator
```

### Auto-configure Claude/clients

Ship the MCP entry automatically by running:

```bash
ios-simulator-mcp setup-config --config ~/.mcp.json
```

Omit `--config` to use the default Claude Desktop config path. Add `--device "iPhone 15 Pro Max"` if you want a different default simulator baked in. Restart Claude after running the command.

### Example `mcp-config.json`

```jsonc
{
  "mcpServers": {
    "ios-simulator": {
      "command": "ios-simulator-mcp",
      "env": {
        "IOS_SIM_DEFAULT_DEVICE": "iPhone 15 Pro",
      },
    },
  },
}
```

Use `pnpm --filter mcp-ios-simulator start` if you prefer to run via pnpm instead of the packaged binary.

## 🧰 Available tools

| Tool                                          | Description                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `listSimulators`                              | Returns runtime, state, and UDID for every available simulator.                                   |
| `bootSimulator`                               | Boots (or focuses) a device by name/UDID and foregrounds the Simulator window.                    |
| `shutdownSimulator`                           | Gracefully shuts down the booted simulator or a specific device.                                  |
| `openUrlInSimulator`                          | Boots the device if needed and opens a URL in mobile Safari.                                      |
| `captureSimulatorScreenshot`                  | Captures a PNG/JPG of the simulator display and returns base64 data plus a file path.             |
| `listWebInspectorTargets`                     | Lists inspectable Safari tabs/web views exposed via WebKit Remote Inspector.                      |
| `evaluateWebViewJavaScript`                   | Executes JavaScript inside a selected tab (great for DOM asserts, reading layout metrics, etc.).  |
| `captureWebViewScreenshot`                    | Uses `Page.captureScreenshot` over WebKit DevTools to grab the rendered tab contents (no chrome). |
| `installSimulatorApp`                         | Installs a .app/.ipa bundle using `simctl install`.                                               |
| `uninstallSimulatorApp`                       | Removes an installed app by bundle identifier.                                                    |
| `launchSimulatorApp`                          | Launches an installed bundle via `simctl launch` (great for cold-start testing or deep linking).  |
| `terminateSimulatorApp`                       | Stops a running bundle.                                                                           |
| `tapSimulatorScreen` / `swipeSimulatorScreen` | Drive native gestures anywhere on screen via WebDriverAgent.                                      |
| `typeSimulatorText`                           | Types Unicode text through the on-screen keyboard (no copy/paste hacks).                          |
| `pressSimulatorButton`                        | Presses hardware buttons (Home, Lock, Volume, Siri).                                              |
| `getSimulatorUiHierarchy`                     | Pulls accessibility/UI tree XML for native debugging.                                             |

All tools expose `output_schema` so clients can request structured results. Every tool response also ships inside `structuredContent.result` for MCP compatibility.

> 🕹️ Native control is powered by WebDriverAgent under the hood. On first run the server will build WDA with `xcodebuild` and stream its logs; subsequent requests reuse the same automation session for fast tap/swipe/text calls.

## ⚙️ Configuration

| Env var                         | Default                         | Purpose                                                                              |
| ------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------ |
| `IOS_SIM_DEFAULT_DEVICE`        | `iPhone 15 Pro`                 | Device booted when no explicit `device` argument is given.                           |
| `IOS_SIM_BOOT_TIMEOUT_MS`       | `120000`                        | How long to wait for `simctl` to report the simulator as booted.                     |
| `IOS_SIM_SCREENSHOT_DIR`        | `$TMPDIR/mcp-ios-simulator`     | Directory used for saving screenshots/videos.                                        |
| `IOS_WEBKIT_DEBUG_PROXY_BINARY` | `ios_webkit_debug_proxy`        | Binary that exposes WebKit Remote Inspector (override if installed elsewhere).       |
| `IOS_WEBKIT_DEBUG_PROXY_PORT`   | `9221`                          | Local port used by the proxy for JSON/WebSocket endpoints.                           |
| `IOS_WEBKIT_CONNECT_TIMEOUT_MS` | `8000`                          | Timeout applied while waiting for proxy connections/WebSocket handshake.             |
| `IOS_WEBKIT_READY_INTERVAL_MS`  | `750`                           | Poll interval when waiting for the proxy’s `/json` endpoint to come online.          |
| `IOS_WDA_PROJECT_PATH`          | `~/WebDriverAgent`              | Path to the WebDriverAgent checkout used for native automation.                      |
| `IOS_WDA_DERIVED_DATA`          | `$TMPDIR/mcp-ios-simulator-wda` | DerivedData output for xcodebuild (give it a persistent folder for faster rebuilds). |
| `IOS_WDA_PORT`                  | `8100`                          | Base port for WebDriverAgent HTTP server.                                            |
| `IOS_WDA_STARTUP_TIMEOUT_MS`    | `45000`                         | How long to wait for WDA to compile + boot before erroring.                          |
| `IOS_WDA_SESSION_TIMEOUT_MS`    | `15000`                         | Timeout applied to WDA HTTP calls.                                                   |
| `IOS_WDA_DEFAULT_BUNDLE_ID`     | `com.apple.springboard`         | Automation bundle identifier when a tool doesn’t provide one.                        |
| `IOS_WDA_SCHEME`                | `WebDriverAgentRunner`          | Xcode scheme to build when booting WebDriverAgent.                                   |

The server automatically loads `.env` files via `dotenv`. Validate config on startup by watching the stderr logs; missing tools (e.g., `ios_webkit_debug_proxy`) will show actionable errors.

## 🧪 Testing

Unit tests cover the device resolver logic (the pure part); hardware-specific commands are intentionally not mocked. Run tests locally with:

```bash
pnpm --filter mcp-ios-simulator test
```

This runs TypeScript build output through `babel-jest`, matching the rest of the monorepo.

## 🛠 Troubleshooting

- **`xcrun: error: unable to find utility "simctl"`** — make sure Xcode + Command Line Tools are installed and `xcode-select -p` returns a valid path.
- **No WebKit targets appear** — open Safari once, enable the Develop menu, and ensure `ios_webkit_debug_proxy` has permission to control the simulator. You may also need to toggle “Connect Hardware Keyboard” or relaunch Safari on the simulator.
- **Screenshots succeed but inspector calls fail** — confirm `ios_webkit_debug_proxy` is running (`lsof -nP -iTCP:9221`). Override `IOS_WEBKIT_DEBUG_PROXY_BINARY` if you installed it via a non-default path.
- **Automation tools hang on first run** — verify WebDriverAgent builds outside of MCP (`cd ~/WebDriverAgent && xcodebuild -scheme WebDriverAgentRunner -destination 'platform=iOS Simulator,name=iPhone 15 Pro' test`). Grant any prompted permissions, then rerun the server.
- **`WebDriverAgent project not found`** — set `IOS_WDA_PROJECT_PATH` to the folder containing `WebDriverAgent.xcodeproj`.
- **Auto-clone failed** — the server tries to clone WebDriverAgent automatically; make sure Git is installed and you have network access to GitHub (or clone manually and point `IOS_WDA_PROJECT_PATH` at it).
- **App install fails** — ensure the `.app` path is built for `x86_64` simulators (ARM builds from physical devices won’t install).
