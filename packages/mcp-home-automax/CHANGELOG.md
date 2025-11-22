# Changelog

All notable changes to mcp-home-automax will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-22

### Added

#### Phase 4 - Advanced Policy & Safety Engine
- Enhanced audit logging system with comprehensive tracking of all actions
- Confirmation workflow with token-based pending actions and expiration
- Time-based quiet hours checking with day-of-week filtering
- Value bounds checking for temperature, brightness, position, and volume
- Global bounds enforcement for temperature and brightness
- Risk level classification and policy evaluation enhancements
- Audit log query and statistics
- Confirmation timeout and cleanup mechanisms

#### Phase 5 - MQTT, Zigbee2MQTT, and Z-Wave Adapters
- Generic MQTT adapter with flexible topic mapping and payload formats
- Zigbee2MQTT adapter with automatic device discovery from bridge
- Z-Wave JS adapter with WebSocket API integration
- Support for custom device mappings in MQTT adapter
- Auto-discovery of Zigbee devices via Zigbee2MQTT bridge
- Z-Wave node discovery with command class mapping
- Device filtering by IEEE address or node ID
- Multiple MQTT payload formats (JSON and raw)

#### Phase 6 - Scene Tools and Context Helpers
- `home_list_scenes` - List all available scenes with filtering
- `home_get_scene` - Get detailed scene information
- `home_find_scenes` - Fuzzy search for scenes by name
- `home_run_scene` - Execute scenes with parameter support
- `home_get_context` - Environmental context and summary
- `home_list_groups` - List all device groups
- `home_set_group` - Control all devices in a group
- Aggregate sensor data collection (temperature, humidity)
- Active device tracking and summary statistics
- Time-based context (hour, day of week, etc.)

### Changed
- Updated server to support all new adapters (MQTT, Zigbee2MQTT, Z-Wave)
- Enhanced tool routing for scene and context tools
- Improved policy engine with confirmation tokens
- Better type safety across all adapters

### Improved
- Comprehensive audit logging for compliance and debugging
- Safer high-risk action handling with confirmations
- Better multi-protocol device support
- Enhanced environmental awareness for AI assistants

## [0.2.0] - 2024-11-22

### Added

#### Phase 2 - Enhanced Home Graph & Adapter Infrastructure
- Enhanced device model with aliases, firmware version, and health tracking
- Improved home graph with intelligent fuzzy device name resolution using Levenshtein distance
- Device state change notification system with event listeners
- Hierarchical area support with parent/child relationships
- Device grouping capabilities
- Adapter health monitoring and automatic reconnection with exponential backoff
- Adapter event system for state changes and connection events
- Command queuing and throttling in AdapterManager
- Bulk command execution support
- Adapter priority system for managing multiple adapters
- Configuration file support (JSON) with Zod schema validation
- Environment variable support for config file path (HOME_AUTOMAX_CONFIG)
- Device override and custom area configuration support

#### Phase 2 - Enhanced MCP Tools
- `home_list_areas` - List all areas with device counts and floor filtering
- `home_get_area` - Get area details with all contained devices
- `home_set_thermostat` - Control thermostats (temperature and HVAC mode)
- `home_set_color` - Set color for color-capable lights (hue, saturation, RGB)
- `home_set_cover` - Control covers/blinds (open, close, stop, set position)

#### Phase 3 - Home Assistant Integration
- Full Home Assistant adapter with WebSocket and REST API support
- Real-time state synchronization via WebSocket subscriptions
- Automatic entity discovery and mapping from Home Assistant
- Support for all major Home Assistant domains:
  - Lights (with brightness and color)
  - Switches
  - Climate/Thermostats
  - Locks
  - Covers
  - Media players
  - Sensors
  - Cameras
  - Fans
  - Vacuums
- Area and scene discovery from Home Assistant
- Automatic reconnection on WebSocket disconnection
- Domain and area filtering configuration
- Service call mapping for all device types
- Health check via REST API

### Changed
- Upgraded adapter interface with health monitoring methods
- Enhanced AdapterManager with priority-based routing
- Improved error handling and reconnection logic
- Updated configuration system with validation

### Improved
- Better device name resolution with scoring and fuzzy matching
- More robust adapter connection handling
- Enhanced policy evaluation for new device types
- Better state management with timestamps

## [0.1.0] - 2024-11-22

### Added

#### Phase 1 - Core Foundation
- Initial release with fake home implementation
- Core MCP server with stdio transport
- Home graph model with normalized device representation
- Adapter abstraction layer with BaseAdapter interface
- FakeAdapter for testing with simulated devices
- AdapterManager for managing multiple adapters
- Policy engine with risk classification (safe, medium, high)
- Configuration management system
- Device capability model supporting:
  - Switch (on/off)
  - Light (on/off with dimming)
  - Dimmer (brightness control)
  - Color light (future)
  - Thermostat (future)
  - Lock (future)
  - Cover (future)
  - Media player (future)
  - Sensor (future)
  - Camera (future)

#### MCP Tools
- `home_list_devices` - List all devices with filtering by area, capability, or tag
- `home_get_device` - Get detailed device information
- `home_find_devices` - Fuzzy search for devices by name
- `home_get_snapshot` - Complete home state snapshot
- `home_set_switch` - Control switches (on/off)
- `home_set_light` - Control lights (on/off and brightness)

#### MCP Resources
- `home://schema` - Home automation model schema
- `home://layout` - Current home layout with areas, devices, and scenes
- `home://policies` - Safety and policy configuration

#### Fake Home Setup
- Simulated areas: Kitchen, Living Room, Bedroom
- Simulated devices:
  - Kitchen Main Light (switch + dimmer)
  - Living Room Light (switch + dimmer + color)
  - Bedroom Thermostat
  - Front Door Lock
- Simulated scenes:
  - Movie Mode
  - Evening Mode

#### Infrastructure
- TypeScript support with ES2022 modules
- Jest testing framework
- Babel for TypeScript compilation
- Docker support
- Comprehensive documentation
- MIT License

### Documentation
- README.md with complete usage guide
- IMPLEMENTATION_PLAN.md with phased roadmap
- Inline code documentation
- Setup script with quick start guide

### Developer Experience
- NPM scripts for build, test, dev, and format
- Prettier configuration
- Git ignore patterns
- NPM and Docker ignore patterns
- Test coverage tracking
