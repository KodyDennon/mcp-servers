import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);
export function getDockerTools() {
    return [
        {
            name: "docker_list_containers",
            description: "List all Docker containers (running and stopped)",
            inputSchema: {
                type: "object",
                properties: {
                    all: { type: "boolean", description: "Include stopped containers (default: true)" },
                },
            },
        },
        {
            name: "docker_start_container",
            description: "Start a Docker container",
            inputSchema: {
                type: "object",
                properties: {
                    container_id: { type: "string", description: "Container ID or name" },
                },
                required: ["container_id"],
            },
        },
        {
            name: "docker_stop_container",
            description: "Stop a running Docker container",
            inputSchema: {
                type: "object",
                properties: {
                    container_id: { type: "string", description: "Container ID or name" },
                },
                required: ["container_id"],
            },
        },
        {
            name: "docker_compose_up",
            description: "Start services using docker-compose",
            inputSchema: {
                type: "object",
                properties: {
                    directory: { type: "string", description: "Directory with docker-compose.yml" },
                    detach: { type: "boolean", description: "Run in background (default: true)" },
                },
                required: ["directory"],
            },
        },
        {
            name: "docker_compose_down",
            description: "Stop and remove containers using docker-compose",
            inputSchema: {
                type: "object",
                properties: {
                    directory: { type: "string", description: "Directory with docker-compose.yml" },
                },
                required: ["directory"],
            },
        },
        {
            name: "docker_compose_ps",
            description: "List services managed by docker-compose",
            inputSchema: {
                type: "object",
                properties: {
                    directory: { type: "string", description: "Directory with docker-compose.yml" },
                },
                required: ["directory"],
            },
        },
    ];
}
export async function handleDockerToolCall(name, args) {
    switch (name) {
        case "docker_list_containers": {
            const { all = true } = args;
            try {
                const flag = all ? "-a" : "";
                const { stdout } = await execAsync(`docker ps ${flag}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: stdout,
                        },
                    ],
                };
            }
            catch (error) {
                throw new Error(`Failed to list Docker containers: ${error}`);
            }
        }
        case "docker_start_container": {
            const { container_id } = args;
            try {
                const { stdout } = await execAsync(`docker start ${container_id}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Container ${container_id} started successfully\n${stdout}`,
                        },
                    ],
                };
            }
            catch (error) {
                throw new Error(`Failed to start container: ${error}`);
            }
        }
        case "docker_stop_container": {
            const { container_id } = args;
            try {
                const { stdout } = await execAsync(`docker stop ${container_id}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Container ${container_id} stopped successfully\n${stdout}`,
                        },
                    ],
                };
            }
            catch (error) {
                throw new Error(`Failed to stop container: ${error}`);
            }
        }
        case "docker_compose_up": {
            const { directory, detach = true } = args;
            try {
                const flag = detach ? "-d" : "";
                const { stdout } = await execAsync(`docker-compose up ${flag}`, { cwd: directory });
                return {
                    content: [
                        {
                            type: "text",
                            text: stdout || "Docker Compose services started",
                        },
                    ],
                };
            }
            catch (error) {
                throw new Error(`Failed to start docker-compose services: ${error}`);
            }
        }
        case "docker_compose_down": {
            const { directory } = args;
            try {
                const { stdout } = await execAsync("docker-compose down", { cwd: directory });
                return {
                    content: [
                        {
                            type: "text",
                            text: stdout || "Docker Compose services stopped",
                        },
                    ],
                };
            }
            catch (error) {
                throw new Error(`Failed to stop docker-compose services: ${error}`);
            }
        }
        case "docker_compose_ps": {
            const { directory } = args;
            try {
                const { stdout } = await execAsync("docker-compose ps", { cwd: directory });
                return {
                    content: [
                        {
                            type: "text",
                            text: stdout,
                        },
                    ],
                };
            }
            catch (error) {
                throw new Error(`Failed to list docker-compose services: ${error}`);
            }
        }
        default:
            throw new Error(`Unknown Docker tool: ${name}`);
    }
}
//# sourceMappingURL=dockerTools.js.map