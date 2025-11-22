import { exec } from "child_process";
import { promisify } from "util";
import { readFile } from "fs/promises";
import { resolve } from "path";
const execAsync = promisify(exec);
export function getRuntimeTools() {
    return [
        {
            name: "runtime_detect_requirements",
            description: "Detect required runtime versions from project files",
            inputSchema: {
                type: "object",
                properties: {
                    directory: { type: "string", description: "Project directory path" },
                },
                required: ["directory"],
            },
        },
        {
            name: "runtime_list_node_versions",
            description: "List installed Node.js versions (via nvm)",
            inputSchema: {
                type: "object",
                properties: {},
            },
        },
        {
            name: "runtime_use_node_version",
            description: "Switch to a specific Node.js version",
            inputSchema: {
                type: "object",
                properties: {
                    version: { type: "string", description: "Node.js version to use" },
                },
                required: ["version"],
            },
        },
        {
            name: "runtime_install_node_version",
            description: "Install a specific Node.js version via nvm",
            inputSchema: {
                type: "object",
                properties: {
                    version: { type: "string", description: "Node.js version to install" },
                },
                required: ["version"],
            },
        },
        {
            name: "runtime_list_python_versions",
            description: "List installed Python versions (via pyenv)",
            inputSchema: {
                type: "object",
                properties: {},
            },
        },
        {
            name: "runtime_check_current_versions",
            description: "Check currently active runtime versions",
            inputSchema: {
                type: "object",
                properties: {},
            },
        },
    ];
}
export async function handleRuntimeToolCall(name, args) {
    switch (name) {
        case "runtime_detect_requirements": {
            const { directory } = args;
            try {
                const requirements = {};
                // Check for .nvmrc
                try {
                    const nvmrc = await readFile(resolve(directory, ".nvmrc"), "utf-8");
                    requirements.node = nvmrc.trim();
                }
                catch { }
                // Check package.json engines
                try {
                    const packageJson = JSON.parse(await readFile(resolve(directory, "package.json"), "utf-8"));
                    if (packageJson.engines) {
                        if (packageJson.engines.node)
                            requirements.nodeEngine = packageJson.engines.node;
                        if (packageJson.engines.npm)
                            requirements.npm = packageJson.engines.npm;
                    }
                }
                catch { }
                // Check for .python-version
                try {
                    const pythonVersion = await readFile(resolve(directory, ".python-version"), "utf-8");
                    requirements.python = pythonVersion.trim();
                }
                catch { }
                // Check for .ruby-version
                try {
                    const rubyVersion = await readFile(resolve(directory, ".ruby-version"), "utf-8");
                    requirements.ruby = rubyVersion.trim();
                }
                catch { }
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ requirements, detected: Object.keys(requirements).length }, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                throw new Error(`Failed to detect requirements: ${error}`);
            }
        }
        case "runtime_list_node_versions": {
            try {
                const { stdout } = await execAsync("nvm list");
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
                throw new Error(`Failed to list Node.js versions. Is nvm installed? ${error}`);
            }
        }
        case "runtime_use_node_version": {
            const { version } = args;
            try {
                const { stdout } = await execAsync(`nvm use ${version}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: stdout || `Switched to Node.js ${version}`,
                        },
                    ],
                };
            }
            catch (error) {
                throw new Error(`Failed to switch Node.js version: ${error}`);
            }
        }
        case "runtime_install_node_version": {
            const { version } = args;
            try {
                const { stdout } = await execAsync(`nvm install ${version}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: stdout || `Installed Node.js ${version}`,
                        },
                    ],
                };
            }
            catch (error) {
                throw new Error(`Failed to install Node.js version: ${error}`);
            }
        }
        case "runtime_list_python_versions": {
            try {
                const { stdout } = await execAsync("pyenv versions");
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
                throw new Error(`Failed to list Python versions. Is pyenv installed? ${error}`);
            }
        }
        case "runtime_check_current_versions": {
            const versions = {};
            try {
                const { stdout: nodeVersion } = await execAsync("node --version");
                versions.node = nodeVersion.trim();
            }
            catch { }
            try {
                const { stdout: npmVersion } = await execAsync("npm --version");
                versions.npm = npmVersion.trim();
            }
            catch { }
            try {
                const { stdout: pythonVersion } = await execAsync("python --version");
                versions.python = pythonVersion.trim();
            }
            catch { }
            try {
                const { stdout: rubyVersion } = await execAsync("ruby --version");
                versions.ruby = rubyVersion.trim();
            }
            catch { }
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ currentVersions: versions }, null, 2),
                    },
                ],
            };
        }
        default:
            throw new Error(`Unknown runtime tool: ${name}`);
    }
}
//# sourceMappingURL=runtimeTools.js.map