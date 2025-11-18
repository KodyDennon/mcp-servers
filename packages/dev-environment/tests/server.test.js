describe("Dev Environment MCP Server", () => {
  test("server module exists", () => {
    expect(() => require("../src/server.js")).not.toThrow();
  });
});
