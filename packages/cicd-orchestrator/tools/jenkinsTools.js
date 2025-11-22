import axios from "axios";
function getJenkinsApi() {
  const baseURL = process.env.JENKINS_URL;
  if (!baseURL) {
    throw new Error("JENKINS_URL environment variable is required");
  }
  const auth =
    process.env.JENKINS_USER && process.env.JENKINS_TOKEN
      ? {
          username: process.env.JENKINS_USER,
          password: process.env.JENKINS_TOKEN,
        }
      : undefined;
  return axios.create({
    baseURL,
    auth,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
export function getJenkinsTools() {
  return [
    {
      name: "jenkins_list_jobs",
      description: "List all Jenkins jobs",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "jenkins_get_job",
      description: "Get details of a specific Jenkins job",
      inputSchema: {
        type: "object",
        properties: {
          job_name: { type: "string", description: "Job name" },
        },
        required: ["job_name"],
      },
    },
    {
      name: "jenkins_trigger_build",
      description: "Trigger a Jenkins build",
      inputSchema: {
        type: "object",
        properties: {
          job_name: { type: "string", description: "Job name" },
          parameters: { type: "object", description: "Build parameters" },
        },
        required: ["job_name"],
      },
    },
    {
      name: "jenkins_get_build",
      description: "Get details of a specific build",
      inputSchema: {
        type: "object",
        properties: {
          job_name: { type: "string", description: "Job name" },
          build_number: { type: "number", description: "Build number" },
        },
        required: ["job_name", "build_number"],
      },
    },
    {
      name: "jenkins_stop_build",
      description: "Stop a running build",
      inputSchema: {
        type: "object",
        properties: {
          job_name: { type: "string", description: "Job name" },
          build_number: { type: "number", description: "Build number" },
        },
        required: ["job_name", "build_number"],
      },
    },
  ];
}
export async function handleJenkinsToolCall(name, args) {
  const jenkins = getJenkinsApi();
  switch (name) {
    case "jenkins_list_jobs": {
      const response = await jenkins.get("/api/json?tree=jobs[name,url,color]");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    }
    case "jenkins_get_job": {
      const { job_name } = args;
      const response = await jenkins.get(
        `/job/${encodeURIComponent(job_name)}/api/json`,
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    }
    case "jenkins_trigger_build": {
      const { job_name, parameters } = args;
      const endpoint = parameters
        ? `/job/${encodeURIComponent(job_name)}/buildWithParameters`
        : `/job/${encodeURIComponent(job_name)}/build`;
      await jenkins.post(endpoint, parameters);
      return {
        content: [
          {
            type: "text",
            text: `Build triggered successfully for job: ${job_name}`,
          },
        ],
      };
    }
    case "jenkins_get_build": {
      const { job_name, build_number } = args;
      const response = await jenkins.get(
        `/job/${encodeURIComponent(job_name)}/${build_number}/api/json`,
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    }
    case "jenkins_stop_build": {
      const { job_name, build_number } = args;
      await jenkins.post(
        `/job/${encodeURIComponent(job_name)}/${build_number}/stop`,
      );
      return {
        content: [
          {
            type: "text",
            text: `Build ${build_number} stopped successfully for job: ${job_name}`,
          },
        ],
      };
    }
    default:
      throw new Error(`Unknown Jenkins tool: ${name}`);
  }
}
//# sourceMappingURL=jenkinsTools.js.map
