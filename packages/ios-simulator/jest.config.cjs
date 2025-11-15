/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.js"],
  collectCoverageFrom: ["<rootDir>/src/**/*.ts"],
  verbose: false,
  transform: {
    "^.+\\.js$": "babel-jest",
  },
};
