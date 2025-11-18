export class ConnectionManager {
  connections: {};
  activeConnectionId: any;
  addConnection(connectionString: any, id?: null): Promise<string>;
  getConnection(connectionId?: null): any;
  listConnections(): any[];
  switchConnection(connectionId: any): void;
  shutdown(): Promise<void>;
}
//# sourceMappingURL=connectionManager.d.ts.map
