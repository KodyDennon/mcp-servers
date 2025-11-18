import { z } from "zod";
export const connectToDatabaseTool = {
  name: "connectToDatabase",
  description:
    "Connects to a PostgreSQL database using a provided connection string. This is a necessary first step before performing any database operations. If you need to switch to a different database, call this tool again with the new connection string.",
  input_schema: z.object({
    connectionString: z
      .string()
      .describe(
        "The PostgreSQL connection string. e.g., 'postgresql://user:password@host:port/database'",
      ),
    connectionId: z
      .string()
      .optional()
      .describe(
        "Optional: A unique identifier for this connection. If not provided, one will be generated.",
      ),
  }),
  output_schema: z.object({
    connectionId: z.string().describe("The ID of the established connection."),
    database: z.string().describe("The name of the connected database."),
    user: z.string().describe("The user connected to the database."),
    version: z
      .string()
      .describe("The PostgreSQL version of the connected database."),
  }),
};
export const listConnectionsTool = {
  name: "listConnections",
  description:
    "Lists all active database connections managed by the system, including their IDs and connection details. The active connection is indicated.",
  input_schema: z.object({}),
  output_schema: z.array(
    z.object({
      id: z.string().describe("The unique identifier for the connection."),
      database: z.string().describe("The name of the connected database."),
      user: z.string().describe("The user connected to the database."),
      version: z
        .string()
        .describe("The PostgreSQL version of the connected database."),
      active: z
        .boolean()
        .describe("True if this is the currently active connection."),
    }),
  ),
};
export const switchConnectionTool = {
  name: "switchConnection",
  description:
    "Switches the active database connection to a different one using its connection ID. The connection must have been previously established using 'connectToDatabase'.",
  input_schema: z.object({
    connectionId: z.string().describe("The ID of the connection to switch to."),
  }),
  output_schema: z.object({
    connectionId: z.string().describe("The ID of the newly active connection."),
    database: z.string().describe("The name of the newly active database."),
    user: z
      .string()
      .describe("The user connected to the newly active database."),
  }),
};
export async function handleConnectionToolCall(
  toolName,
  input,
  connectionManager,
) {
  switch (toolName) {
    case connectToDatabaseTool.name: {
      const { connectionString, connectionId } = input;
      const id = await connectionManager.addConnection(
        connectionString,
        connectionId,
      );
      const connectionInfo = connectionManager.connections[id].info;
      return {
        connectionId: id,
        database: connectionInfo.current_database,
        user: connectionInfo.current_user,
        version: connectionInfo.version,
      };
    }
    case listConnectionsTool.name: {
      return connectionManager.listConnections();
    }
    case switchConnectionTool.name: {
      const { connectionId } = input;
      connectionManager.switchConnection(connectionId);
      const connectionInfo = connectionManager.connections[connectionId].info;
      return {
        connectionId,
        database: connectionInfo.current_database,
        user: connectionInfo.current_user,
      };
    }
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
//# sourceMappingURL=connectionTools.js.map
