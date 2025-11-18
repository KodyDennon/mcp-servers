import { createClient } from "@supabase/supabase-js";
let supabaseClient;
function resolveSupabaseCredentials() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.POSTGRES_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl) {
        throw new Error("SUPABASE_URL (or POSTGRES_URL) environment variable is not set. See README.md for configuration instructions.");
    }
    if (!supabaseKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) environment variable is not set. See README.md for configuration instructions.");
    }
    return { supabaseUrl, supabaseKey };
}
export function getSupabaseClient() {
    if (!supabaseClient) {
        const { supabaseUrl, supabaseKey } = resolveSupabaseCredentials();
        supabaseClient = createClient(supabaseUrl, supabaseKey);
    }
    return supabaseClient;
}
//# sourceMappingURL=supabaseClient.js.map