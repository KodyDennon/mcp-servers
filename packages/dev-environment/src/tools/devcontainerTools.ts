import { readFile, writeFile, access } from "fs/promises";
import { resolve } from "path";
import YAML from "yaml";

export function getDevContainerTools() {
  return [
    {
      name: "devcontainer_detect",
      description: "Check if project has dev container configuration",
      inputSchema: {
        type: "object",
        properties: {
          directory: { type: "string", description: "Project directory path" },
        },
        required: ["directory"],
      },
    },
    {
      name: "devcontainer_read_config",
      description: "Read devcontainer.json configuration",
      inputSchema: {
        type: "object",
        properties: {
          directory: { type: "string", description: "Project directory path" },
        },
        required: ["directory"],
      },
    },
    {
      name: "devcontainer_generate_config",
      description: "Generate a basic devcontainer.json configuration",
      inputSchema: {
        type: "object",
        properties: {
          directory: { type: "string", description: "Project directory path" },
          runtime: { type: "string", description: "Runtime type: node, python, ruby, etc." },
          version: { type: "string", description: "Runtime version" },
        },
        required: ["directory", "runtime"],
      },
    },
  ];
}

export async function handleDevContainerToolCall(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "devcontainer_detect": {
      const { directory } = args as { directory: string };

      try {
        const devcontainerPath = resolve(directory, ".devcontainer", "devcontainer.json");
        const dockerComposePath = resolve(directory, "docker-compose.yml");
        const dockerfilePath = resolve(directory, "Dockerfile");

        const checks = {
          hasDevContainer: false,
          hasDockerCompose: false,
          hasDockerfile: false,
        };

        try {
          await access(devcontainerPath);
          checks.hasDevContainer = true;
        } catch {}

        try {
          await access(dockerComposePath);
          checks.hasDockerCompose = true;
        } catch {}

        try {
          await access(dockerfilePath);
          checks.hasDockerfile = true;
        } catch {}

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(checks, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to detect dev container: ${error}`);
      }
    }

    case "devcontainer_read_config": {
      const { directory } = args as { directory: string };

      try {
        const devcontainerPath = resolve(directory, ".devcontainer", "devcontainer.json");
        const config = await readFile(devcontainerPath, "utf-8");

        // Remove comments from JSON (basic implementation)
        const cleanedConfig = config.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

        return {
          content: [
            {
              type: "text" as const,
              text: cleanedConfig,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to read devcontainer config: ${error}`);
      }
    }

    case "devcontainer_generate_config": {
      const { directory, runtime, version = "latest" } = args as {
        directory: string;
        runtime: string;
        version?: string;
      };

      const configs: Record<string, any> = {
        node: {
          name: "Node.js Development",
          image: `mcr.microsoft.com/devcontainers/javascript-node:${version}`,
          customizations: {
            vscode: {
              extensions: ["dbaeumer.vscode-eslint", "esbenp.prettier-vscode"],
            },
          },
          postCreateCommand: "npm install",
        },
        python: {
          name: "Python Development",
          image: `mcr.microsoft.com/devcontainers/python:${version}`,
          customizations: {
            vscode: {
              extensions: ["ms-python.python", "ms-python.vscode-pylance"],
            },
          },
          postCreateCommand: "pip install -r requirements.txt",
        },
        ruby: {
          name: "Ruby Development",
          image: `mcr.microsoft.com/devcontainers/ruby:${version}`,
          customizations: {
            vscode: {
              extensions: ["rebornix.ruby"],
            },
          },
          postCreateCommand: "bundle install",
        },
      };

      const config = configs[runtime] || configs.node;

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(config, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown dev container tool: ${name}`);
  }
}
