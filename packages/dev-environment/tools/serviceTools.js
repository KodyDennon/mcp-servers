import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);
export function getServiceTools() {
    return [
        {
            name: "service_check_postgres",
            description: "Check if PostgreSQL is running",
            inputSchema: {
                type: "object",
                properties: {},
            },
        },
        {
            name: "service_check_redis",
            description: "Check if Redis is running",
            inputSchema: {
                type: "object",
                properties: {},
            },
        },
        {
            name: "service_check_mongodb",
            description: "Check if MongoDB is running",
            inputSchema: {
                type: "object",
                properties: {},
            },
        },
        {
            name: "service_health_check",
            description: "Run health checks on common local services",
            inputSchema: {
                type: "object",
                properties: {},
            },
        },
    ];
}
export async function handleServiceToolCall(name, args) {
    switch (name) {
        case "service_check_postgres": {
            try {
                const { stdout } = await execAsync("docker ps --filter name=postgres --format '{{.Names}}'");
                const isRunning = stdout.trim().length > 0;
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                service: "PostgreSQL",
                                running: isRunning,
                                containers: isRunning ? stdout.trim().split("\n") : [],
                            }, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ service: "PostgreSQL", running: false, error: String(error) }, null, 2),
                        },
                    ],
                };
            }
        }
        case "service_check_redis": {
            try {
                const { stdout } = await execAsync("docker ps --filter name=redis --format '{{.Names}}'");
                const isRunning = stdout.trim().length > 0;
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                service: "Redis",
                                running: isRunning,
                                containers: isRunning ? stdout.trim().split("\n") : [],
                            }, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ service: "Redis", running: false, error: String(error) }, null, 2),
                        },
                    ],
                };
            }
        }
        case "service_check_mongodb": {
            try {
                const { stdout } = await execAsync("docker ps --filter name=mongo --format '{{.Names}}'");
                const isRunning = stdout.trim().length > 0;
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                service: "MongoDB",
                                running: isRunning,
                                containers: isRunning ? stdout.trim().split("\n") : [],
                            }, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ service: "MongoDB", running: false, error: String(error) }, null, 2),
                        },
                    ],
                };
            }
        }
        case "service_health_check": {
            const services = ["postgres", "redis", "mongo"];
            const health = {};
            for (const service of services) {
                try {
                    const { stdout } = await execAsync(`docker ps --filter name=${service} --format '{{.Names}}'`);
                    health[service] = stdout.trim().length > 0;
                }
                catch {
                    health[service] = false;
                }
            }
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            timestamp: new Date().toISOString(),
                            services: health,
                            healthy: Object.values(health).filter((v) => v).length,
                            total: services.length,
                        }, null, 2),
                    },
                ],
            };
        }
        default:
            throw new Error(`Unknown service tool: ${name}`);
    }
}
//# sourceMappingURL=serviceTools.js.map