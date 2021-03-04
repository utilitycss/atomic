module.exports = {
  globals: {
    "ts-jest": {
      tsConfig: "tsconfig.json",
    },
  },
  moduleFileExtensions: ["ts", "js"],
  modulePathIgnorePatterns: ["integration-test"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  testMatch: ["**/**/*.test.(ts|js)"],
  testEnvironment: "node",
};
