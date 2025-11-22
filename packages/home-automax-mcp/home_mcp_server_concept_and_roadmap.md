# Home-MCP Server – Concept & Phased Plan

A conceptual overview and phased roadmap for a Node-based home automation MCP server intended to be published on npm (e.g. `home-mcp-server`). This server runs in a homelab and exposes a home’s devices and automations to AI clients via the Model Context Protocol (MCP).

---

## 1. Product & Scope

### Goal

Build a **Node-based MCP server** that:

- Runs on homelab hardware (NUC, server, NAS, Raspberry Pi, etc.).
- Connects to existing home automation stacks (especially Home Assistant, MQTT, Zigbee2MQTT, Z-Wave JS, and common vendor clouds/LAN APIs).
- Exposes a clean set of MCP tools and resources to AI clients (Claude Desktop, ChatGPT MCP, IDE MCP clients, etc.).
- Lets AI:
  - Discover devices, rooms, areas, and scenes.
  - Read state.
  - Control lights, switches, thermostats, locks, media, blinds, and scenes.
  - Respect user-defined safety and policy constraints.

### Non-Goals (Initial)

- **Not** a replacement for Home Assistant’s full automation engine.
- **Not** a cloud SaaS or remote service; this is **local-first, self-hosted**.
- **Not** a driver for every individual vendor out of the box; instead it uses a layered adapter strategy to reach “almost everything” via a few key integrations.

---

## 2. Conceptual Architecture

The system is organized into five main components:

1. **MCP Interface Layer**
2. **Home Graph & State Model**
3. **Adapter Layer**
4. **Policy & Safety Engine**
5. **Configuration & Management**

### 2.1 MCP Interface Layer

Responsibilities:

- Implement the MCP server side:
  - Expose **tools** for actions (`list_devices`, `set_light`, `run_scene`, etc.).
  - Expose **resources** for context (`/home/schema`, `/home/layout`, `/home/policies`, docs, etc.).
- Define a stable public surface for AI clients:
  - Tool names, parameter schemas, result formats.
  - Resource URIs and JSON structures.
- Provide a clear, compact model so agents can:
  - Fetch a snapshot of the home.
  - Decide what to do in local code.
  - Call small, composable tools to execute actions.

### 2.2 Home Graph & State Model

Responsibilities:

- Maintain a **normalized, adapter-agnostic representation** of the home:
  - `Home` → top-level container.
  - `Area` / `Room` → physical or logical zones.
  - `Device` → lights, switches, thermostats, locks, media players, sensors, etc.
  - `Capability` → what each device can do (switch, dimmer, color, thermostat, lock, cover, media, etc.).
  - `Scene` / `Mode` → grouped actions, like “evening mode”, “movie mode”, “away”.
- Hold a **state cache** for all devices and capabilities:
  - Synced with downstream adapters (Home Assistant, MQTT, etc.).
  - Queried by MCP tools for fast read operations.
- Provide high-level lookup and resolution:
  - Find devices by id, name, area, capability, tags.
  - Translate human-ish requests ("kitchen main lights") into one or more device ids and capabilities.

### 2.3 Adapter Layer

Responsibilities:

- Provide a **pluggable driver interface** for different home automation stacks and device ecosystems.
- Each adapter exposes a consistent internal API:
  - `discoverDevices()` → list of normalized devices.
  - `getState(device)` → current state for that device and its capabilities.
  - `execute(device, command)` → perform actions (turn on, set brightness, set temperature, etc.).
- Example adapters:
  - **Home Assistant adapter** (primary integration).
  - **MQTT / Zigbee2MQTT adapter**.
  - **Z-Wave JS adapter**.
  - Direct vendor adapters (Hue, Shelly, Tasmota/ESPHome, LIFX, etc.).
  - Webhook/HTTP adapter for custom or virtual devices.

### 2.4 Policy & Safety Engine

Responsibilities:

- Classify actions into **risk levels** (safe, medium, high) based on device type and command:
  - Safe: reading state, adjusting lights, moderate media controls.
  - Medium: changing thermostat settings, toggling some power outlets.
  - High: unlocking doors, opening garages, disabling alarms, controlling safety-critical devices.
- Evaluate all requested actions against **user-defined policies**:
  - Per-device and per-capability rules.
  - Quiet hours, temperature bounds, allowed ranges.
  - Requirement for explicit confirmation or PIN for certain actions.
- Act as a **gatekeeper** between MCP tool calls and adapters:
  - Allow, deny, modify, or require confirmation for actions.
  - Provide structured error/response information back to the MCP layer.

### 2.5 Configuration & Management

Responsibilities:

- Manage configuration for:
  - Adapters (Home Assistant URL/token, MQTT broker, etc.).
  - Device naming, tags, and grouping.
  - Policy definitions and risk level overrides.
- Provide operational controls:
  - Logging and audit of actions.
  - Status/health of adapters.
  - Diagnostics.
- Optionally offer a simple admin UI or CLI for:
  - Viewing discovered devices.
  - Tuning safety policies.
  - Managing scenes and virtual devices.

---

## 3. Phased Plan (Conceptual, No Time Frames)

The plan below describes **what** to build in each phase, not **how** to implement it.

### Phase 1 – Core MCP Server with Fake Home

**Objective:**

Establish the MCP server interface and behavior using an in-memory, fake home setup before integrating with real devices.

**Conceptual Tasks:**

- Define the **initial MCP surface**:
  - Tools:
    - `list_devices`
    - `get_device_state`
    - `get_home_state` / `get_home_snapshot`
    - `set_switch` (generic on/off)
    - `set_light` (on/off + brightness)
  - Resources:
    - `/home/schema` → describes the normalized model (device, capability, area types).
    - `/home/layout` → fake rooms and devices.
    - `/home/policies` → placeholder policy structure.

- Implement a **minimal home graph** in memory:
  - A couple of hard-coded rooms (kitchen, living room, bedroom).
  - Sample devices (lights, switches, thermostat) with basic capabilities.

- Wire the MCP tools to the fake home graph:
  - Tool calls update and read from this in-memory state.

- Establish the **package structure**:
  - Core server module.
  - Home graph module.
  - Adapter interface module.
  - Config and utilities.

**Outcome:**

AI clients can connect to the MCP server and “control” a fake home. This validates the tool design, resource shapes, and overall MCP flow before adding real integrations.

---

### Phase 2 – Home Graph & Adapter Abstraction

**Objective:**

Stabilize a robust, adapter-agnostic home model and a clear adapter interface so that real integrations can plug in cleanly.

**Conceptual Tasks:**

- Define the **normalized device and capability model**:
  - Device fields: id, name, area, type, capabilities, tags, adapter id, native id, etc.
  - Capability types: `switch`, `light`, `dimmer`, `color_light`, `thermostat`, `lock`, `cover`, `media_player`, `sensor`, `camera`, etc.
  - Capability operations and associated state fields.

- Implement a **home graph service** that:
  - Manages devices, areas, and states in a central store.
  - Supports lookups by id, name, area, capability, and tags.
  - Exposes a simple API for commands (e.g. "turn on these devices", "set this thermostat").

- Design the **adapter interface**:
  - Standard methods like `discoverDevices()`, `getState(device)`, `execute(device, command)`.
  - Clearly separate protocol-specific logic into adapters, not the MCP tools.

- Refactor Phase 1 MCP tools to use:
  - Home graph service + adapter abstraction instead of direct/fake logic.

**Outcome:**

A solid internal architecture: MCP layer → home graph → adapters, with no assumptions leaking from any specific downstream system.

---

### Phase 3 – Home Assistant Adapter

**Objective:**

Integrate with Home Assistant first to get broad device support quickly.

**Conceptual Tasks:**

- Define **Home Assistant adapter configuration**:
  - Base URL, auth token.
  - Optional includes/excludes for domains, areas, and entities.

- Map Home Assistant concepts to the normalized model:
  - Entities → devices and capabilities.
  - Domains (e.g. `light`, `switch`, `climate`, `lock`) → capability types.
  - Areas → rooms/areas in the home graph.

- Implement adapter behavior conceptually:
  - Discovery:
    - Fetch entities and areas.
    - Convert them into normalized device objects.
  - State management:
    - Fetch and periodically refresh entity states, or subscribe where possible.
    - Push updates into the home graph state store.
  - Command execution:
    - Receive normalized commands from MCP tools through the home graph.
    - Translate them into Home Assistant service calls.

- Wire the MCP tools to use the Home Assistant adapter through the home graph:
  - `list_devices`, `get_device_state`, `set_switch`, `set_light`, etc., now act on real HA devices.

- Update resources:
  - `/home/layout` represents the Home Assistant home layout.
  - `/home/schema` may include metadata indicating which adapter a device comes from.

**Outcome:**

Users with existing Home Assistant setups can point `home-mcp-server` at HA and immediately control real devices via AI clients.

---

### Phase 4 – Safety, Policies, and Risk Levels

**Objective:**

Add a policy engine to gate actions and prevent unsafe or unwanted behavior by AI agents.

**Conceptual Tasks:**

- Define a **risk classification** for actions:
  - Safe: state reads, non-critical lights, minor media changes.
  - Medium: thermostat changes, some power controls.
  - High: locks, garages, alarms, safety-critical infrastructure.

- Create a **policy model**:
  - Global policies (default behavior for each risk level).
  - Per-device/per-capability rules.
  - Time-based rules (quiet hours, maximum temperature changes, etc.).
  - Requirements for confirmation or PIN for high-risk actions.

- Integrate the **policy engine** into the command pipeline:
  - Before executing any action via an adapter, evaluate:
    - Risk level.
    - Applicable policies.
  - Decide to allow, deny, modify, or require confirmation.

- Expose policies via MCP resources and errors:
  - `/home/policies` describes rules to the AI.
  - Tool responses clearly indicate when actions are blocked or require extra user input.

**Outcome:**

The server can safely mediate between powerful AI tools and real-world devices, giving users confidence and control.

---

### Phase 5 – MQTT, Zigbee2MQTT, Z-Wave & Virtual Devices

**Objective:**

Support homelab setups that don’t rely solely on Home Assistant and allow custom/virtual devices.

**Conceptual Tasks:**

- Design a **generic MQTT-based adapter concept**:
  - Configuration for mapping topics to devices/capabilities.
  - Handling state topics and command topics separately.

- Support **Zigbee2MQTT and Z-Wave JS** patterns using the same abstraction.

- Introduce **virtual device definitions**:
  - Devices that are defined in configuration files or via a management interface.
  - Backed by MQTT, HTTP/webhooks, or other mechanisms.

- Extend the home graph to merge devices from:
  - Home Assistant.
  - MQTT/Zigbee/Z-Wave.
  - Other adapters.

- Keep MCP tools adapter-agnostic:
  - AI clients use the same tools regardless of where the device came from.

**Outcome:**

The server becomes attractive to wider homelab scenarios, including DIY stacks that bypass or complement Home Assistant.

---

### Phase 6 – Scenes, Context Helpers, and Higher-Level Semantics

**Objective:**

Shift from basic remote control to more intelligent, context-aware home interactions.

**Conceptual Tasks:**

- Normalize **Scenes and Modes** across adapters:
  - Scenes from Home Assistant or other systems mapped into a common model.
  - Add MCP tools:
    - `list_scenes`
    - `run_scene`
  - Encourage agents to use scenes for complex or recurring actions.

- Add **context helper tools** (mostly read-only):
  - Presence/status, if available.
  - Time of day, sunrise/sunset.
  - Simple environment summary (e.g. main climate and key sensor values).

- Improve **discovery and naming**:
  - Tools to search for devices by fuzzy name or tag.
  - Grouping mechanisms for “all bedroom lights”, “all exterior lights”, etc.

- Enhance resources:
  - Richer `/home/layout` with nested areas (floors → rooms) and tags.
  - A `/home/docs/usage` resource explaining recommended tool usage patterns for agents.

**Outcome:**

Agents can act more like an intelligent house controller, using scenes and context instead of just firing individual device commands.

---

## 4. Advanced / Future Directions

These are optional expansion areas after the core is solid.

### Advanced A – Code Execution-Oriented Design

- Design tools and resources to work well with clients that support **code execution alongside MCP**.
- Encourage usage patterns where:
  - The client fetches a home snapshot.
  - Runs local code to decide on a batch of actions.
  - Calls a minimal number of high-level tools.

### Advanced B – Admin Dashboard & Observability

- Provide a small web-based dashboard to:
  - View devices, areas, adapters, and policies.
  - Inspect recent actions taken via MCP.
  - Perform dry-runs or simulations.

### Advanced C – Plugin Ecosystem for Adapters

- Define a simple plugin interface.
- Allow external packages to register as adapters.
- Document how to create and share new drivers for niche devices and ecosystems.

---

## 5. Summary

The `home-mcp-server` concept is a **Node-based, adapter-driven MCP server** that makes a whole smart home available to AI through a clean, policy-aware interface. By starting with a fake home, then adding a strong internal home graph and a Home Assistant adapter, and finally layering on safety, MQTT/Zigbee/Z-Wave, scenes, and context helpers, this project can evolve from a simple demo into a practical, widely adopted homelab tool.
