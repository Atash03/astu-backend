/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 25000,
  rootDir: ".",
  roots: ["<rootDir>"],
  moduleNameMapper: {
    "@/(.*)": "<rootDir>/src/$1"
  },  
};