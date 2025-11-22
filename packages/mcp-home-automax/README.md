# mcp-home-automax

**Model Context Protocol (MCP) Server for Home Automation**

Control your smart home with AI through a clean, policy-aware interface. Built on the Model Context Protocol, this server exposes your home's devices and automations to AI assistants like Claude Desktop.

## Features

### Phase 1 - Core Foundation (Current)

- **Fake Home Implementation**: Test and develop with an in-memory simulated home
- **Device Discovery & Control**: List, query, and control devices
- **Home Graph Model**: Normalized, adapter-agnostic device representation
- **Policy Engine**: Safety rules and risk classification for all actions
- **MCP Tools**:
  - `home_list_devices` - List all devices with filtering
  - `home_get_device` - Get detailed device information
  - `home_find_devices` - Fuzzy search for devices by name
  - `home_get_snapshot` - Complete home state snapshot
  - `home_set_switch` - Control switches
  - `home_set_light` - Control lights (on/off, brightness)
- **MCP Resources**:
  - `home://schema` - Home automation model schema
  - `home://layout` - Current home layout
  - `home://policies` - Safety and policy rules

### Future Phases (See IMPLEMENTATION_PLAN.md)

- Phase 2: Enhanced home graph and adapter abstraction
- Phase 3: Home Assistant integration
- Phase 4: Advanced policy engine with risk levels
- Phase 5: MQTT, Zigbee2MQTT, Z-Wave support
- Phase 6: Scenes, modes, and context helpers

## Installation

```bash
npm install -g mcp-home-automax
```

Or use with npx:

```bash
npx mcp-home-automax
```

## Requirements

- Node.js 20.0.0 or higher
- MCP-compatible client (Claude Desktop, etc.)

## Quick Start

### Using with Claude Desktop

Add this to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "home-automax": {
      "command": "npx",
      "args": ["-y", "mcp-home-automax"]
    }
  }
}
```

### Running Standalone

```bash
# Start the server
npm start

# Or with npx
npx mcp-home-automax
```

## Configuration

### Environment Variables

```bash
# Server configuration
SERVER_NAME=home-automax-mcp
SERVER_VERSION=0.1.0
LOG_LEVEL=info  # error, warn, info, debug
```

### Future Configuration (Phase 3+)

```bash
# Home Assistant
HASS_URL=http://homeassistant.local:8123
HASS_TOKEN=your-long-lived-access-token

# MQTT (Phase 5)
MQTT_BROKER=mqtt://localhost
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=
```

## Architecture

The server is organized into five main components:

### 1. MCP Interface Layer
Exposes tools and resources to AI clients following the Model Context Protocol specification.

### 2. Home Graph
Maintains a normalized, adapter-agnostic representation of your home:
- **Areas/Rooms**: Physical or logical zones
- **Devices**: Lights, switches, thermostats, locks, etc.
- **Capabilities**: What each device can do
- **Scenes**: Grouped actions and modes

### 3. Adapter Layer
Pluggable driver interface for different home automation systems:
- **Fake Adapter** (Phase 1): In-memory simulated devices
- **Home Assistant** (Phase 3): Coming soon
- **MQTT/Zigbee2MQTT** (Phase 5): Coming soon
- **Z-Wave JS** (Phase 5): Coming soon

### 4. Policy & Safety Engine
Classifies and gates all actions based on risk:
- **Safe**: Reading state, adjusting lights
- **Medium**: Thermostat changes, power controls
- **High**: Locks, alarms, safety-critical devices

### 5. Configuration Management
Handles adapter configuration, device naming, and policy definitions.

## Available Tools

### Device Tools

#### `home_list_devices`
List all devices with optional filtering.

**Parameters:**
- `areaId` (optional): Filter by area
- `capability` (optional): Filter by capability type
- `tag` (optional): Filter by tag

**Example:**
```json
{
  "areaId": "area_kitchen"
}
```

#### `home_get_device`
Get detailed information about a specific device.

**Parameters:**
- `deviceId` (required): Device ID

**Example:**
```json
{
  "deviceId": "device_kitchen_light"
}
```

#### `home_find_devices`
Find devices by name using fuzzy search.

**Parameters:**
- `name` (required): Device name to search
- `areaName` (optional): Limit search to specific area

**Example:**
```json
{
  "name": "kitchen light"
}
```

#### `home_get_snapshot`
Get a complete snapshot of the home state.

**Example:**
```json
{}
```

#### `home_set_switch`
Turn a switch on or off.

**Parameters:**
- `deviceId` (required): Device ID
- `on` (required): true to turn on, false to turn off

**Example:**
```json
{
  "deviceId": "device_kitchen_light",
  "on": true
}
```

#### `home_set_light`
Control a light (on/off and brightness).

**Parameters:**
- `deviceId` (required): Device ID
- `on` (optional): true to turn on, false to turn off
- `brightness` (optional): 0-100

**Example:**
```json
{
  "deviceId": "device_living_room_light",
  "on": true,
  "brightness": 75
}
```

## Available Resources

### `home://schema`
Describes the normalized home automation model including device types, capability types, and data structures.

### `home://layout`
Provides the current layout of areas, devices, and scenes in the home with statistics.

### `home://policies`
Exposes the current safety and policy configuration including risk levels and rules.

## Development

### Building

```bash
npm run build
```

### Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Development Mode

```bash
# Watch and rebuild on changes
npm run dev
```

### Formatting

```bash
# Check formatting
npm run lint

# Fix formatting
npm run format
```

## Project Structure

```
mcp-home-automax/
├── src/
│   ├── adapters/         # Adapter abstraction layer
│   │   ├── BaseAdapter.ts
│   │   ├── FakeAdapter.ts
│   │   └── AdapterManager.ts
│   ├── config/           # Configuration management
│   │   └── ConfigManager.ts
│   ├── home-graph/       # Home graph model
│   │   ├── types.ts
│   │   └── HomeGraph.ts
│   ├── policy/           # Policy and safety engine
│   │   ├── types.ts
│   │   └── PolicyEngine.ts
│   ├── tools/            # MCP tools
│   │   ├── deviceTools.ts
│   │   └── resourceTools.ts
│   └── server.ts         # Main server
├── tests/                # Tests
├── index.js              # Entry point
├── setup.js              # Setup script
└── package.json
```

## Roadmap

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the complete phased implementation plan.

### Upcoming

- **Phase 2**: Enhanced home graph with better device resolution
- **Phase 3**: Home Assistant adapter for real device control
- **Phase 4**: Advanced policy engine with confirmation workflows
- **Phase 5**: MQTT, Zigbee2MQTT, and Z-Wave adapters
- **Phase 6**: Scenes, modes, and context helpers

## Contributing

Contributions are welcome! Please see the main repository for contribution guidelines.

## License

MIT

## Links

- [GitHub Repository](https://github.com/KodyDennon/mcp-servers)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Home Assistant](https://www.home-assistant.io)

## Security

This server mediates between AI and real-world devices. Please:

- Review the policy configuration before deployment
- Test thoroughly with the fake adapter before connecting real devices
- Use appropriate network security measures
- Never expose the server directly to the internet

## Support

For issues, questions, or suggestions:

- GitHub Issues: [https://github.com/KodyDennon/mcp-servers/issues](https://github.com/KodyDennon/mcp-servers/issues)
- Documentation: See IMPLEMENTATION_PLAN.md for detailed architecture
