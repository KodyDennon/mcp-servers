/**
 * Policy and safety types
 */
/**
 * Risk level for actions
 */
export var RiskLevel;
(function (RiskLevel) {
    RiskLevel["SAFE"] = "safe";
    RiskLevel["MEDIUM"] = "medium";
    RiskLevel["HIGH"] = "high";
})(RiskLevel || (RiskLevel = {}));
/**
 * Policy decision
 */
export var PolicyDecision;
(function (PolicyDecision) {
    PolicyDecision["ALLOW"] = "allow";
    PolicyDecision["DENY"] = "deny";
    PolicyDecision["REQUIRE_CONFIRMATION"] = "require_confirmation";
})(PolicyDecision || (PolicyDecision = {}));
//# sourceMappingURL=types.js.map