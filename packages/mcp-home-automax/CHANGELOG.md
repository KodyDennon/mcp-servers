# Changelog

All notable changes to mcp-home-automax will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
