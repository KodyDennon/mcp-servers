
import { z } from "zod";
import { getSupabaseClient } from "../supabaseClient.js";

const managementApiUrl = `https://api.supabase.com/v1/projects/${process.env.SUPABASE_PROJECT_ID}/functions`;

async function apiRequest(endpoint, options) {
    const response = await fetch(`${managementApiUrl}${endpoint}`, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Supabase Management API error: ${error.message}`);
    }
    return response.json();
}

export const deployFunctionTool = {
    name: "deployFunction",
    description: "Deploy a new Supabase Edge Function.",
    input_schema: z.object({
        functionName: z.string().describe("The name of the function to deploy."),
        functionCode: z.string().describe("The JavaScript/TypeScript code for the function."),
    }),
    output_schema: z.object({
        data: z.any(),
    }),
};

export const listFunctionsTool = {
    name: "listEdgeFunctions",
    description: "List all deployed Supabase Edge Functions.",
    input_schema: z.object({}),
    output_schema: z.object({
        data: z.any(),
    }),
};

export const deleteFunctionTool = {
    name: "deleteFunction",
    description: "Delete a Supabase Edge Function.",
    input_schema: z.object({
        functionName: z.string().describe("The name of the function to delete."),
    }),
    output_schema: z.object({
        data: z.any(),
    }),
};

export async function handleEdgeFunctionToolCall(toolName, input) {
    if (!process.env.SUPABASE_ACCESS_TOKEN || !process.env.SUPABASE_PROJECT_ID) {
        throw new Error("SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_ID environment variables are required for this tool.");
    }

    try {
        switch (toolName) {
            case deployFunctionTool.name: {
                const { functionName, functionCode } = input;
                const data = await apiRequest(`/${functionName}`, {
                    method: 'POST',
                    body: JSON.stringify({
                        "name": functionName,
                        "slug": functionName,
                        "verify_jwt": true,
                        "import_map": false,
                        "entrypoint_path": `file://supabase/functions/${functionName}/index.ts`,
                        "import_map_path": null,
                        "status": "ACTIVE"
                    }),
                });
                // This is a simplified deployment, in a real scenario you would need to handle the function code upload
                return { data };
            }
            case listFunctionsTool.name: {
                const data = await apiRequest('/');
                return { data };
            }
            case deleteFunctionTool.name: {
                const { functionName } = input;
                const data = await apiRequest(`/${functionName}`, {
                    method: 'DELETE',
                });
                return { data };
            }
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    } catch (error) {
        throw new Error(`Edge function tool failed: ${error.message}`);
    }
}
