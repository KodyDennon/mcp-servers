import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { getDependencyAnalysisTools } from "./tools/analysisTools.js";
import { getSecurityTools } from "./tools/securityTools.js";
import { getLicenseTools } from "./tools/licenseTools.js";
import { getUpdateTools } from "./tools/updateTools.js";

// Load environment variables
dotenv.config();

export async function startServer() {
  const server = new Server(
    {
      name: "dependency-manager-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Combine all tools
  const allTools = [
    ...getDependencyAnalysisTools(),
    ...getSecurityTools(),
    ...getLicenseTools(),
    ...getUpdateTools(),
  ];

  // Handle list_tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: allTools,
    };
  });

  // Handle call_tool request
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      // Analysis tools
      if (name.startsWith("deps_analyze_") || name.startsWith("deps_list_")) {
        const { handleAnalysisToolCall } = await import("./tools/analysisTools.js");
        return await handleAnalysisToolCall(name, args || {});
      }

      // Security tools
      if (name.startsWith("deps_security_") || name.startsWith("deps_audit_")) {
        const { handleSecurityToolCall } = await import("./tools/securityTools.js");
        return await handleSecurityToolCall(name, args || {});
      }

      // License tools
      if (name.startsWith("deps_license_")) {
        const { handleLicenseToolCall } = await import("./tools/licenseTools.js");
        return await handleLicenseToolCall(name, args || {});
      }

      // Update tools
      if (name.startsWith("deps_check_") || name.startsWith("deps_suggest_")) {
        const { handleUpdateToolCall } = await import("./tools/updateTools.js");
        return await handleUpdateToolCall(name, args || {});
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error executing ${name}: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Dependency Manager MCP Server running on stdio");
}
