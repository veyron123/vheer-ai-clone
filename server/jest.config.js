export default {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/simple-affiliate.test.js'],
  collectCoverageFrom: [
    'services/**/*.js',
    'controllers/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 40,
      functions: 50,
      lines: 50
    }
  },
  testTimeout: 10000,
  verbose: true
};