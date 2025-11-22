/**
 * Intelligent Analysis Tools
 *
 * MCP tools for Phase 3 intelligent analysis features:
 * - Breaking change detection
 * - AI-ready package analysis
 * - Alternative package suggestions
 * - Dependency graph analysis
 */
/**
 * MCP Tool: Compare package versions for breaking changes
 */
export declare function analyzeBreakingChanges(params: {
  package: string;
  fromVersion: string;
  toVersion: string;
}): Promise<string>;
/**
 * MCP Tool: Comprehensive AI-ready package analysis
 */
export declare function analyzePackageIntelligent(params: {
  package: string;
  currentVersion?: string;
  projectPath?: string;
}): Promise<string>;
/**
 * MCP Tool: Find alternative packages
 */
export declare function findAlternativePackages(params: {
  package: string;
  maxResults?: number;
  minQualityScore?: number;
  requireTypes?: boolean;
  maxBundleSize?: number;
}): Promise<string>;
/**
 * MCP Tool: Analyze dependency graph
 */
export declare function analyzeDependencyGraph(params: {
  projectPath?: string;
  maxDepth?: number;
}): Promise<string>;
/**
 * Get intelligent analysis tool definitions for MCP
 */
export declare function getIntelligentTools(): (
  | {
      name: string;
      description: string;
      inputSchema: {
        type: string;
        properties: {
          package: {
            type: string;
            description: string;
          };
          fromVersion: {
            type: string;
            description: string;
          };
          toVersion: {
            type: string;
            description: string;
          };
          currentVersion?: undefined;
          projectPath?: undefined;
          maxResults?: undefined;
          minQualityScore?: undefined;
          requireTypes?: undefined;
          maxBundleSize?: undefined;
          maxDepth?: undefined;
        };
        required: string[];
      };
    }
  | {
      name: string;
      description: string;
      inputSchema: {
        type: string;
        properties: {
          package: {
            type: string;
            description: string;
          };
          currentVersion: {
            type: string;
            description: string;
          };
          projectPath: {
            type: string;
            description: string;
          };
          fromVersion?: undefined;
          toVersion?: undefined;
          maxResults?: undefined;
          minQualityScore?: undefined;
          requireTypes?: undefined;
          maxBundleSize?: undefined;
          maxDepth?: undefined;
        };
        required: string[];
      };
    }
  | {
      name: string;
      description: string;
      inputSchema: {
        type: string;
        properties: {
          package: {
            type: string;
            description: string;
          };
          maxResults: {
            type: string;
            description: string;
          };
          minQualityScore: {
            type: string;
            description: string;
          };
          requireTypes: {
            type: string;
            description: string;
          };
          maxBundleSize: {
            type: string;
            description: string;
          };
          fromVersion?: undefined;
          toVersion?: undefined;
          currentVersion?: undefined;
          projectPath?: undefined;
          maxDepth?: undefined;
        };
        required: string[];
      };
    }
  | {
      name: string;
      description: string;
      inputSchema: {
        type: string;
        properties: {
          projectPath: {
            type: string;
            description: string;
          };
          maxDepth: {
            type: string;
            description: string;
          };
          package?: undefined;
          fromVersion?: undefined;
          toVersion?: undefined;
          currentVersion?: undefined;
          maxResults?: undefined;
          minQualityScore?: undefined;
          requireTypes?: undefined;
          maxBundleSize?: undefined;
        };
        required?: undefined;
      };
    }
)[];
/**
 * Handle intelligent tool calls
 */
export declare function handleIntelligentToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<
  | {
      content: {
        type: "text";
        text: string;
      }[];
      isError?: undefined;
    }
  | {
      content: {
        type: "text";
        text: string;
      }[];
      isError: boolean;
    }
>;
//# sourceMappingURL=intelligentTools.d.ts.map
