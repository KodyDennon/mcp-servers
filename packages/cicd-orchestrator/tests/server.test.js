describe("CI/CD Orchestrator MCP Server", () => {
  test("server module exists", () => {
    expect(() => require("../src/server.js")).not.toThrow();
  });
});
