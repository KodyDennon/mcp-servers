import { resolveDeviceFromQuery } from "../src/utils/deviceResolver.js";

const sampleDevices = [
  {
    udid: "1111-AAAA",
    name: "iPhone 15 Pro",
    state: "Shutdown",
    runtimeDisplayName: "iOS 17.5",
    platform: "iOS",
    runtimeIdentifier: "com.apple.CoreSimulator.SimRuntime.iOS-17-5",
    isAvailable: true,
  },
  {
    udid: "2222-BBBB",
    name: "iPhone SE (3rd generation)",
    state: "Booted",
    runtimeDisplayName: "iOS 17.5",
    platform: "iOS",
    runtimeIdentifier: "com.apple.CoreSimulator.SimRuntime.iOS-17-5",
    isAvailable: true,
  },
];

describe("resolveDeviceFromQuery", () => {
  it("selects by UDID", () => {
    const result = resolveDeviceFromQuery(
      sampleDevices,
      "1111-aaaa",
      "ignored",
    );
    expect(result.device.udid).toBe("1111-AAAA");
    expect(result.reason).toBe("udid");
  });

  it("selects by name", () => {
    const result = resolveDeviceFromQuery(
      sampleDevices,
      "iphone se (3rd generation)",
    );
    expect(result.device.udid).toBe("2222-BBBB");
    expect(result.reason).toBe("name");
  });

  it("falls back to booted", () => {
    const result = resolveDeviceFromQuery(sampleDevices);
    expect(result.device.udid).toBe("2222-BBBB");
    expect(result.reason).toBe("booted");
  });

  it("uses default when provided", () => {
    const result = resolveDeviceFromQuery(
      sampleDevices,
      undefined,
      "iphone 15",
    );
    expect(result.device.udid).toBe("1111-AAAA");
    expect(result.reason).toBe("default");
  });

  it("throws when asking for booted but none exist", () => {
    expect(() =>
      resolveDeviceFromQuery(
        [
          {
            ...sampleDevices[0],
            state: "Shutdown",
          },
        ],
        "booted",
      ),
    ).toThrow("No booted simulator found");
  });
});
