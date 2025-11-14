# Supabase DB MCP Server - Testing Documentation

## Overview

This package has been modularized and includes a comprehensive test suite to ensure code quality and reliability.

## Test Statistics

- **Total Tests**: 110 passing
- **Test Coverage**:
  - Statements: 35.55%
  - Branches: 32.77%
  - Functions: 31.19%
  - Lines: 38.29%

## Modular Architecture

The codebase has been refactored into a clean, modular structure:

### Core Modules

- **src/config.js** - Configuration and environment variable management
- **src/server.js** - MCP server setup and initialization
- **src/connectionManager.js** - PostgreSQL connection pool management
- **src/handlers.js** - Request handler registration and routing
- **src/supabaseClient.js** - Supabase client initialization

### Tool Modules

All tools are organized in `src/tools/`:

- **connectionTools.js** - Database connection management
- **queryTools.js** - SQL query execution and transactions
- **schemaTools.js** - Database schema inspection and modification
- **migrationTools.js** - Database migration management
- **dataTools.js** - Data import/export and row operations
- **adminTools.js** - Administrative operations (backups, auth, storage)
- **subscriptionTools.js** - Real-time subscription management
- **edgeFunctionTools.js** - Supabase Edge Functions deployment
- **aiTools.js** - AI-powered RAG and indexing

### Utility Modules

- **src/utils/sqlHelpers.js** - SQL safety analysis and result formatting
- **src/utils/aiHelpers.js** - AI and embedding utilities

## Running Tests

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode (if configured)
npm test -- --watch

# Run specific test file
npm test -- connectionManager.test.js
```

## Test Structure

Tests are located in the `tests/` directory and follow the naming convention `<module>.test.js`:

### Unit Tests

- **connectionManager.test.js** - Connection management with mocked PostgreSQL
- **connectionTools.test.js** - Connection tool handlers
- **queryTools.test.js** - Query execution and transaction handling
- **sqlHelpers.test.js** - SQL safety checks and result formatting
- **dataTools.test.js** - Data manipulation operations
- **schemaTools.test.js** - Schema inspection and modification
- **migrationTools.test.js** - Migration tool handlers
- **adminTools.test.js** - Administrative operations
- **handlers.test.js** - Request handler registration and routing
- **server.test.js** - Server initialization

### Integration Tests

- **aiTools.test.js** - AI tools with mocked dependencies

## Test Configuration

### Jest Configuration (jest.config.cjs)

```javascript
{
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  transform: {
    '^.+\.js$': 'babel-jest',
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 35,
      statements: 35,
    },
  },
}
```

### Babel Configuration (babel.config.cjs)

```javascript
{
  presets: [
    ['@babel/preset-env', {
      targets: { node: 'current' }
    }]
  ],
}
```

## Testing Best Practices

### Mocking

Tests use Jest's mocking capabilities to isolate units:

```javascript
// Mock PostgreSQL pool
jest.mock('pg', () => ({
  Pool: jest.fn(() => mockPool),
}));

// Mock file system operations
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
  },
}));
```

### Test Structure

Each test file follows this pattern:

1. **Setup**: Import modules and create mocks
2. **beforeEach**: Reset mocks and initialize test state
3. **describe blocks**: Group related tests
4. **it blocks**: Individual test cases

Example:

```javascript
describe('ConnectionManager', () => {
  let connectionManager;

  beforeEach(() => {
    connectionManager = new ConnectionManager();
    jest.clearAllMocks();
  });

  describe('addConnection', () => {
    it('should add a new connection with generated ID', async () => {
      // Test implementation
    });
  });
});
```

## Coverage Goals

The project maintains the following coverage thresholds:

- **Statements**: 35%
- **Branches**: 30%
- **Functions**: 30%
- **Lines**: 35%

High-coverage modules:
- connectionTools.js: 100% coverage
- queryTools.js: 100% coverage
- connectionManager.js: 96% coverage
- aiTools.js: 94% coverage

## Known Limitations

1. **config.test.js** is skipped due to ESM `import.meta` issues with Jest
2. Some tool modules (schemaTools, migrationTools, subscriptionTools, edgeFunctionTools) have lower coverage as they require complex database setups for full integration testing
3. The tests focus on unit testing with mocked dependencies rather than full integration testing with a live database

## Future Improvements

1. Add integration tests with a test database instance
2. Increase coverage for schema and migration tools
3. Add end-to-end tests for the full MCP server
4. Set up CI/CD pipeline with automated test runs
5. Add performance benchmarks

## Contributing

When adding new features:

1. Write tests first (TDD approach recommended)
2. Ensure all tests pass: `npm test`
3. Maintain or improve coverage thresholds
4. Update this documentation if adding new modules or test patterns

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Cannot use import statement outside a module"
**Solution**: Ensure babel-jest is configured correctly in jest.config.cjs

**Issue**: Mock not working
**Solution**: Ensure mocks are defined before imports, use `jest.mock()` at the top level

**Issue**: Coverage thresholds not met
**Solution**: Add more test cases or adjust thresholds in jest.config.cjs

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Babel Jest](https://jestjs.io/docs/getting-started#using-babel)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
