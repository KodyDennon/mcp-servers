/**
 * Core type definitions for the home automation graph model
 */
/**
 * Capability types that devices can support
 */
export var CapabilityType;
(function (CapabilityType) {
    CapabilityType["SWITCH"] = "switch";
    CapabilityType["LIGHT"] = "light";
    CapabilityType["DIMMER"] = "dimmer";
    CapabilityType["COLOR_LIGHT"] = "color_light";
    CapabilityType["THERMOSTAT"] = "thermostat";
    CapabilityType["LOCK"] = "lock";
    CapabilityType["COVER"] = "cover";
    CapabilityType["MEDIA_PLAYER"] = "media_player";
    CapabilityType["SENSOR"] = "sensor";
    CapabilityType["CAMERA"] = "camera";
    CapabilityType["FAN"] = "fan";
    CapabilityType["VACUUM"] = "vacuum";
    CapabilityType["CLIMATE"] = "climate";
    CapabilityType["ALARM"] = "alarm";
})(CapabilityType || (CapabilityType = {}));
/**
 * Device type classification
 */
export var DeviceType;
(function (DeviceType) {
    DeviceType["LIGHT"] = "light";
    DeviceType["SWITCH"] = "switch";
    DeviceType["THERMOSTAT"] = "thermostat";
    DeviceType["LOCK"] = "lock";
    DeviceType["COVER"] = "cover";
    DeviceType["MEDIA_PLAYER"] = "media_player";
    DeviceType["SENSOR"] = "sensor";
    DeviceType["CAMERA"] = "camera";
    DeviceType["FAN"] = "fan";
    DeviceType["VACUUM"] = "vacuum";
    DeviceType["CLIMATE"] = "climate";
    DeviceType["ALARM"] = "alarm";
    DeviceType["GENERIC"] = "generic";
})(DeviceType || (DeviceType = {}));
//# sourceMappingURL=types.js.map