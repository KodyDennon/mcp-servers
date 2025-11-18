/**
 * Sandbox security configuration for code execution mode
 * Defines safe execution boundaries and resource limits
 */
export const defaultSandboxConfig = {
    // Execution mode (NEW!)
    // - 'sandbox': Code runs in Claude Code sandbox (safer, PII-protected)
    // - 'direct': Code runs directly on server (more powerful, requires trust)
    executionMode: process.env.CODE_EXECUTION_MODE || 'sandbox',
    // Allowed modules (whitelist)
    allowedModules: [
        './servers/supabase-db',
        './servers/supabase-db/query',
        './servers/supabase-db/schema',
        './servers/supabase-db/data',
        './servers/supabase-db/migration',
        './servers/supabase-db/admin',
        './servers/supabase-db/builder',
        './servers/supabase-db/pipeline',
        './servers/supabase-db/streaming',
        './servers/supabase-db/cache',
        './servers/supabase-db/privacy',
        './servers/supabase-db/skills',
        'date-fns', // Date utilities
        'lodash', // Data manipulation
    ],
    // Resource limits
    resourceLimits: {
        maxMemory: '512MB',
        maxQueryTime: 30000, // 30 seconds
        maxResults: 10000, // Maximum rows per query
    },
    // Data protection rules
    dataProtection: {
        piiFields: [
            'email',
            'password',
            'ssn',
            'social_security',
            'phone',
            'phone_number',
            'address',
            'street',
            'credit_card',
            'card_number',
            'cvv',
            'dob',
            'date_of_birth',
            'ip_address',
            'passport',
            'driver_license',
        ],
        redactionStrategy: 'tokenize',
        allowExport: false, // Prevent PII from leaving sandbox
    },
    // Operation permissions
    allowedOperations: {
        read: true, // Allow SELECT queries
        write: false, // Disallow INSERT/UPDATE/DELETE by default
        admin: false, // Disallow admin operations
    },
};
/**
 * Validate if a module import is allowed
 */
export function isModuleAllowed(modulePath, config = defaultSandboxConfig) {
    return config.allowedModules.some(allowed => modulePath.startsWith(allowed) || modulePath === allowed);
}
/**
 * Check if operation is allowed
 */
export function isOperationAllowed(operation, config = defaultSandboxConfig) {
    return config.allowedOperations[operation];
}
/**
 * Get config for specific environment
 */
export function getSandboxConfig(env = process.env.NODE_ENV || 'production') {
    switch (env) {
        case 'development':
            return {
                ...defaultSandboxConfig,
                executionMode: process.env.CODE_EXECUTION_MODE || 'direct', // Default to direct in dev
                allowedOperations: {
                    read: true,
                    write: true, // Allow writes in dev
                    admin: true, // Allow admin in dev
                },
            };
        case 'test':
            return {
                ...defaultSandboxConfig,
                executionMode: 'direct', // Tests run direct
                resourceLimits: {
                    ...defaultSandboxConfig.resourceLimits,
                    maxQueryTime: 5000, // Shorter timeout for tests
                },
            };
        case 'production':
        default:
            return defaultSandboxConfig;
    }
}
/**
 * Check if currently running in sandbox mode
 */
export function isSandboxMode() {
    const config = getSandboxConfig();
    return config.executionMode === 'sandbox';
}
/**
 * Get execution mode from environment
 */
export function getExecutionMode() {
    return process.env.CODE_EXECUTION_MODE || 'sandbox';
}
//# sourceMappingURL=sandbox.config.js.map