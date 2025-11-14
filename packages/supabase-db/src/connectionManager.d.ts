export class ConnectionManager {
    connections: {};
    activeConnectionId: any;
    addConnection(connectionString: any, id?: any): Promise<any>;
    getConnection(connectionId?: any): any;
    listConnections(): any[];
    switchConnection(connectionId: any): void;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=connectionManager.d.ts.map