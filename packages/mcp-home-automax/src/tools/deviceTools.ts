/**
 * Device management tools for MCP
 */

import type { HomeGraph } from "../home-graph/HomeGraph.js";
import type { AdapterManager } from "../adapters/AdapterManager.js";
import type { PolicyEngine } from "../policy/PolicyEngine.js";
import { CapabilityType } from "../home-graph/types.js";
import { PolicyDecision } from "../policy/types.js";

/**
 * Get all device tools
 */
export function getDeviceTools() {
  return [
    {
      name: "home_list_devices",
      description:
        "List all devices in the home with their current state, capabilities, and areas",
      inputSchema: {
        type: "object",
        properties: {
          areaId: {
            type: "string",
            description: "Optional: filter devices by area ID",
          },
          capability: {
            type: "string",
            description: "Optional: filter devices by capability type",
          },
          tag: {
            type: "string",
            description: "Optional: filter devices by tag",
          },
        },
      },
    },
    {
      name: "home_get_device",
      description: "Get detailed information about a specific device",
      inputSchema: {
        type: "object",
        properties: {
          deviceId: { type: "string", description: "Device ID" },
        },
        required: ["deviceId"],
      },
    },
    {
      name: "home_find_devices",
      description:
        "Find devices by name (fuzzy search) or other criteria",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Device name to search for (case-insensitive)",
          },
          areaName: {
            type: "string",
            description: "Area name to search within",
          },
        },
        required: ["name"],
      },
    },
    {
      name: "home_get_snapshot",
      description:
        "Get a complete snapshot of the entire home state including all areas, devices, and scenes",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "home_set_switch",
      description: "Turn a switch on or off",
      inputSchema: {
        type: "object",
        properties: {
          deviceId: { type: "string", description: "Device ID" },
          on: {
            type: "boolean",
            description: "true to turn on, false to turn off",
          },
        },
        required: ["deviceId", "on"],
      },
    },
    {
      name: "home_set_light",
      description: "Control a light (on/off and brightness)",
      inputSchema: {
        type: "object",
        properties: {
          deviceId: { type: "string", description: "Device ID" },
          on: {
            type: "boolean",
            description: "true to turn on, false to turn off",
          },
          brightness: {
            type: "number",
            description: "Brightness level (0-100), optional",
          },
        },
        required: ["deviceId"],
      },
    },
  ];
}

/**
 * Handle device tool calls
 */
export async function handleDeviceToolCall(
  name: string,
  args: Record<string, unknown>,
  homeGraph: HomeGraph,
  adapterManager: AdapterManager,
  policyEngine: PolicyEngine
) {
  switch (name) {
    case "home_list_devices": {
      const { areaId, capability, tag } = args as {
        areaId?: string;
        capability?: string;
        tag?: string;
      };

      let devices = homeGraph.getAllDevices();

      if (areaId) {
        devices = devices.filter((d) => d.areaId === areaId);
      }

      if (capability) {
        devices = devices.filter((d) =>
          d.capabilities.some((c) => c.type === capability)
        );
      }

      if (tag) {
        devices = devices.filter((d) =>
          d.tags?.some((t) => t.toLowerCase() === tag.toLowerCase())
        );
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(devices, null, 2),
          },
        ],
      };
    }

    case "home_get_device": {
      const { deviceId } = args as { deviceId: string };
      const device = homeGraph.getDevice(deviceId);

      if (!device) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Device not found: ${deviceId}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(device, null, 2),
          },
        ],
      };
    }

    case "home_find_devices": {
      const { name, areaName } = args as { name: string; areaName?: string };

      let devices = homeGraph.findDevicesByName(name);

      if (areaName) {
        const areas = homeGraph.findAreasByName(areaName);
        const areaIds = areas.map((a) => a.id);
        devices = devices.filter((d) => d.areaId && areaIds.includes(d.areaId));
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(devices, null, 2),
          },
        ],
      };
    }

    case "home_get_snapshot": {
      const snapshot = homeGraph.getSnapshot();

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(snapshot, null, 2),
          },
        ],
      };
    }

    case "home_set_switch": {
      const { deviceId, on } = args as { deviceId: string; on: boolean };
      const device = homeGraph.getDevice(deviceId);

      if (!device) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Device not found: ${deviceId}`,
            },
          ],
          isError: true,
        };
      }

      const command = {
        deviceId,
        capability: CapabilityType.SWITCH,
        action: on ? "turn_on" : "turn_off",
      };

      // Evaluate policy
      const policyResult = policyEngine.evaluateDeviceCommand(command, device);

      if (policyResult.decision === PolicyDecision.DENY) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Action denied: ${policyResult.reason}`,
            },
          ],
          isError: true,
        };
      }

      if (policyResult.decision === PolicyDecision.REQUIRE_CONFIRMATION) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Action requires confirmation: ${policyResult.reason}. Please confirm to proceed.`,
            },
          ],
        };
      }

      // Execute command
      await adapterManager.executeDeviceCommand(command, device.adapterId);

      return {
        content: [
          {
            type: "text" as const,
            text: `Switch ${on ? "turned on" : "turned off"} successfully`,
          },
        ],
      };
    }

    case "home_set_light": {
      const { deviceId, on, brightness } = args as {
        deviceId: string;
        on?: boolean;
        brightness?: number;
      };
      const device = homeGraph.getDevice(deviceId);

      if (!device) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Device not found: ${deviceId}`,
            },
          ],
          isError: true,
        };
      }

      // Handle on/off
      if (on !== undefined) {
        const command = {
          deviceId,
          capability: CapabilityType.SWITCH,
          action: on ? "turn_on" : "turn_off",
        };

        const policyResult = policyEngine.evaluateDeviceCommand(command, device);

        if (policyResult.decision === PolicyDecision.DENY) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Action denied: ${policyResult.reason}`,
              },
            ],
            isError: true,
          };
        }

        await adapterManager.executeDeviceCommand(command, device.adapterId);
      }

      // Handle brightness
      if (brightness !== undefined) {
        const command = {
          deviceId,
          capability: CapabilityType.DIMMER,
          action: "set_brightness",
          parameters: { brightness },
        };

        const policyResult = policyEngine.evaluateDeviceCommand(command, device);

        if (policyResult.decision === PolicyDecision.DENY) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Action denied: ${policyResult.reason}`,
              },
            ],
            isError: true,
          };
        }

        await adapterManager.executeDeviceCommand(command, device.adapterId);
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Light controlled successfully`,
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
