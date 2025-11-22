/**
 * Scene and context management tools for MCP
 */

import type { HomeGraph } from "../home-graph/HomeGraph.js";
import type { Device } from "../home-graph/types.js";
import type { AdapterManager } from "../adapters/AdapterManager.js";
import type { PolicyEngine } from "../policy/PolicyEngine.js";
import { PolicyDecision } from "../policy/types.js";

/**
 * Get all scene and context tools
 */
export function getSceneTools() {
  return [
    {
      name: "home_list_scenes",
      description: "List all scenes available in the home",
      inputSchema: {
        type: "object",
        properties: {
          tag: {
            type: "string",
            description: "Optional: filter scenes by tag",
          },
        },
      },
    },
    {
      name: "home_get_scene",
      description: "Get detailed information about a specific scene",
      inputSchema: {
        type: "object",
        properties: {
          sceneId: { type: "string", description: "Scene ID" },
        },
        required: ["sceneId"],
      },
    },
    {
      name: "home_find_scenes",
      description: "Find scenes by name (fuzzy search)",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Scene name to search for (case-insensitive)",
          },
        },
        required: ["name"],
      },
    },
    {
      name: "home_run_scene",
      description: "Execute a scene to activate a pre-configured set of device states",
      inputSchema: {
        type: "object",
        properties: {
          sceneId: { type: "string", description: "Scene ID to execute" },
          parameters: {
            type: "object",
            description: "Optional parameters to pass to the scene",
          },
        },
        required: ["sceneId"],
      },
    },
    {
      name: "home_get_context",
      description:
        "Get environmental context and summary including current time, active devices, and aggregate sensor data",
      inputSchema: {
        type: "object",
        properties: {
          includeDeviceStates: {
            type: "boolean",
            description: "Include detailed device states (default: false)",
          },
        },
      },
    },
    {
      name: "home_list_groups",
      description: "List all device groups",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "home_set_group",
      description: "Control all devices in a group",
      inputSchema: {
        type: "object",
        properties: {
          groupId: { type: "string", description: "Device group ID" },
          action: {
            type: "string",
            description: "Action to perform (turn_on, turn_off, etc.)",
          },
          parameters: {
            type: "object",
            description: "Optional parameters for the action",
          },
        },
        required: ["groupId", "action"],
      },
    },
  ];
}

/**
 * Handle scene and context tool calls
 */
export async function handleSceneToolCall(
  name: string,
  args: Record<string, unknown>,
  homeGraph: HomeGraph,
  adapterManager: AdapterManager,
  policyEngine: PolicyEngine
) {
  switch (name) {
    case "home_list_scenes": {
      const { tag } = args as { tag?: string };
      let scenes = homeGraph.getAllScenes();

      if (tag) {
        scenes = scenes.filter((s) =>
          s.tags?.some((t) => t.toLowerCase() === tag.toLowerCase())
        );
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(scenes, null, 2),
          },
        ],
      };
    }

    case "home_get_scene": {
      const { sceneId } = args as { sceneId: string };
      const scene = homeGraph.getScene(sceneId);

      if (!scene) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Scene not found: ${sceneId}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(scene, null, 2),
          },
        ],
      };
    }

    case "home_find_scenes": {
      const { name } = args as { name: string };
      const scenes = homeGraph.findScenesByName(name);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(scenes, null, 2),
          },
        ],
      };
    }

    case "home_run_scene": {
      const { sceneId, parameters } = args as {
        sceneId: string;
        parameters?: Record<string, unknown>;
      };

      const scene = homeGraph.getScene(sceneId);

      if (!scene) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Scene not found: ${sceneId}`,
            },
          ],
          isError: true,
        };
      }

      const command = {
        sceneId,
        parameters,
      };

      // Evaluate policy
      const policyResult = policyEngine.evaluateSceneCommand(command, scene);

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
              text: `Action requires confirmation: ${policyResult.reason}. Confirmation token: ${policyResult.confirmationToken}`,
            },
          ],
        };
      }

      // Execute scene
      await adapterManager.executeSceneCommand(command, scene.adapterId || "");

      return {
        content: [
          {
            type: "text" as const,
            text: `Scene "${scene.name}" executed successfully`,
          },
        ],
      };
    }

    case "home_get_context": {
      const { includeDeviceStates } = args as {
        includeDeviceStates?: boolean;
      };

      const now = new Date();
      const snapshot = homeGraph.getSnapshot();

      // Calculate aggregate statistics
      const allDevices = homeGraph.getAllDevices();
      const onlineDevices = allDevices.filter((d) => d.online !== false);
      const offlineDevices = allDevices.filter((d) => d.online === false);

      // Count devices by type
      const devicesByType: Record<string, number> = {};
      for (const device of allDevices) {
        devicesByType[device.type] = (devicesByType[device.type] || 0) + 1;
      }

      // Find active (on) devices
      const activeDevices = allDevices.filter((device) => {
        const switchCap = device.capabilities.find(
          (c) => c.type === "switch" || c.type === "light"
        );
        return switchCap && switchCap.state && (switchCap.state as { on?: boolean }).on;
      });

      // Collect sensor data (temperature, humidity, etc.)
      const sensors: Record<string, unknown>[] = [];
      const sensorDevices = allDevices.filter((d) => d.type === "sensor");

      for (const sensor of sensorDevices) {
        for (const capability of sensor.capabilities) {
          if (capability.state && typeof capability.state === "object") {
            sensors.push({
              deviceId: sensor.id,
              deviceName: sensor.name,
              areaId: sensor.areaId,
              type: capability.type,
              state: capability.state,
            });
          }
        }
      }

      // Calculate average temperature if available
      const tempSensors = sensors.filter(
        (s) =>
          s.type === "temperature" &&
          typeof (s.state as { temperature?: number }).temperature === "number"
      );

      let avgTemperature: number | undefined;
      if (tempSensors.length > 0) {
        const sum = tempSensors.reduce(
          (acc, s) => acc + ((s.state as { temperature: number }).temperature || 0),
          0
        );
        avgTemperature = sum / tempSensors.length;
      }

      const context = {
        timestamp: now.toISOString(),
        time: {
          hour: now.getHours(),
          minute: now.getMinutes(),
          day: now.getDay(),
          dayOfWeek: [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ][now.getDay()],
        },
        summary: {
          totalDevices: allDevices.length,
          onlineDevices: onlineDevices.length,
          offlineDevices: offlineDevices.length,
          activeDevices: activeDevices.length,
          devicesByType,
          totalAreas: snapshot.areas.length,
          totalScenes: snapshot.scenes.length,
          totalGroups: snapshot.groups?.length || 0,
        },
        environment: {
          averageTemperature: avgTemperature,
          sensors: sensors.length,
        },
        activeDeviceList: activeDevices.map((d) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          areaId: d.areaId,
        })),
      };

      // Optionally include full device states
      if (includeDeviceStates) {
        (context as Record<string, unknown>).deviceStates = allDevices.map((d) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          online: d.online,
          capabilities: d.capabilities,
        }));
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(context, null, 2),
          },
        ],
      };
    }

    case "home_list_groups": {
      const snapshot = homeGraph.getSnapshot();
      const groups = snapshot.groups || [];

      const groupsWithDevices = groups.map((group) => ({
        ...group,
        devices: group.deviceIds.map((id) => homeGraph.getDevice(id)).filter(Boolean),
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(groupsWithDevices, null, 2),
          },
        ],
      };
    }

    case "home_set_group": {
      const { groupId, action, parameters } = args as {
        groupId: string;
        action: string;
        parameters?: Record<string, unknown>;
      };

      const snapshot = homeGraph.getSnapshot();
      const group = snapshot.groups?.find((g) => g.id === groupId);

      if (!group) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Group not found: ${groupId}`,
            },
          ],
          isError: true,
        };
      }

      const devices = group.deviceIds
        .map((id) => homeGraph.getDevice(id))
        .filter((d): d is Device => d !== null);

      if (devices.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No devices found in group: ${groupId}`,
            },
          ],
          isError: true,
        };
      }

      // Execute action on all devices in group
      const results: string[] = [];
      const errors: string[] = [];

      for (const device of devices) {
        try {
          // Determine capability from device
          const capability = device.capabilities[0]?.type;
          if (!capability) {
            errors.push(`Device ${device.name} has no capabilities`);
            continue;
          }

          const command = {
            deviceId: device.id,
            capability,
            action,
            parameters,
          };

          // Evaluate policy
          const policyResult = policyEngine.evaluateDeviceCommand(
            command,
            device
          );

          if (policyResult.decision === PolicyDecision.DENY) {
            errors.push(`${device.name}: ${policyResult.reason}`);
            continue;
          }

          // Execute command
          await adapterManager.executeDeviceCommand(
            command,
            device.adapterId
          );
          results.push(`${device.name}: ${action} executed`);
        } catch (error) {
          errors.push(
            `${device.name}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                group: group.name,
                results,
                errors,
                summary: `${results.length} succeeded, ${errors.length} failed`,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
