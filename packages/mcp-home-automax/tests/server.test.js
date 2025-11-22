/**
 * Basic server tests
 */

describe("Home Automax MCP Server", () => {
  test("server module exists and can be imported", () => {
    expect(() => require("../src/server.js")).not.toThrow();
  });

  test("home graph module exists", () => {
    const { HomeGraph } = require("../src/home-graph/HomeGraph.js");
    expect(HomeGraph).toBeDefined();
    const homeGraph = new HomeGraph();
    expect(homeGraph.getAllDevices()).toEqual([]);
  });

  test("adapter manager module exists", () => {
    const { AdapterManager } = require("../src/adapters/AdapterManager.js");
    expect(AdapterManager).toBeDefined();
    const manager = new AdapterManager();
    expect(manager.getAllAdapters()).toEqual([]);
  });

  test("policy engine module exists", () => {
    const { PolicyEngine } = require("../src/policy/PolicyEngine.js");
    expect(PolicyEngine).toBeDefined();
    const engine = new PolicyEngine();
    expect(engine.getConfig()).toBeDefined();
  });

  test("fake adapter can be created", () => {
    const { FakeAdapter } = require("../src/adapters/FakeAdapter.js");
    expect(FakeAdapter).toBeDefined();
    const adapter = new FakeAdapter({ id: "test", type: "fake", enabled: true });
    expect(adapter.id).toBe("test");
  });
});
