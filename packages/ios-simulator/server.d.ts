import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SimulatorManager } from "./simulatorManager.js";
import { InspectorManager } from "./inspector/index.js";
import { AutomationManager } from "./automation/automationManager.js";
export declare function createServer(): Server<
  {
    method: string;
    params?:
      | {
          [x: string]: unknown;
          _meta?:
            | {
                [x: string]: unknown;
                progressToken?: string | number | undefined;
              }
            | undefined;
        }
      | undefined;
  },
  {
    method: string;
    params?:
      | {
          [x: string]: unknown;
          _meta?:
            | {
                [x: string]: unknown;
              }
            | undefined;
        }
      | undefined;
  },
  {
    [x: string]: unknown;
    _meta?:
      | {
          [x: string]: unknown;
        }
      | undefined;
  }
>;
export declare function startServer(): Promise<{
  server: Server<
    {
      method: string;
      params?:
        | {
            [x: string]: unknown;
            _meta?:
              | {
                  [x: string]: unknown;
                  progressToken?: string | number | undefined;
                }
              | undefined;
          }
        | undefined;
    },
    {
      method: string;
      params?:
        | {
            [x: string]: unknown;
            _meta?:
              | {
                  [x: string]: unknown;
                }
              | undefined;
          }
        | undefined;
    },
    {
      [x: string]: unknown;
      _meta?:
        | {
            [x: string]: unknown;
          }
        | undefined;
    }
  >;
  transport: StdioServerTransport;
  simulatorManager: SimulatorManager;
  inspectorManager: InspectorManager;
  automationManager: AutomationManager;
}>;
//# sourceMappingURL=server.d.ts.map
