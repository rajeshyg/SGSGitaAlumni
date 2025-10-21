/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'

// Import advanced testing frameworks
// TODO: Implement advanced testing frameworks in src/lib/testing/
// import { MutationTester } from './src/lib/testing/MutationTester'
// import { PropertyTester } from './src/lib/testing/PropertyTester'
// import { VisualTester, BasicScreenshotEngine, BasicImageComparisonEngine } from './src/lib/testing/VisualTester'
// import { PerformanceTester, BasicBenchmarkEngine, BasicMetricsCollector } from './src/lib/testing/PerformanceTester'
// import { AITestGenerator, BasicAIEngine, BasicCodeAnalyzer } from './src/lib/testing/AITestGenerator'
// import { TestPrioritizer, BasicRiskAnalyzer, BasicChangeAnalyzer } from './src/lib/testing/TestPrioritizer'
// import { TestRunner } from './src/lib/testing/types'

// Initialize testing engines
// TODO: Initialize testing engines when frameworks are implemented
// const mutationTester = new MutationTester(/* testRunner */) // Will be set up in test environment
// const propertyTester = new PropertyTester()
// const visualTester = new VisualTester(
//   new BasicScreenshotEngine(),
//   new BasicImageComparisonEngine()
// )
// const performanceTester = new PerformanceTester(
//   new BasicBenchmarkEngine(),
//   new BasicMetricsCollector()
// )
// const aiTestGenerator = new AITestGenerator(
//   new BasicAIEngine(),
//   new BasicCodeAnalyzer()
// )
// const testPrioritizer = new TestPrioritizer(
//   new BasicRiskAnalyzer(),
//   new BasicChangeAnalyzer()
// )

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    test: {
      globals: true,
      environment: 'node', // Use node environment for API tests
      setupFiles: ['./tests/setup/api-test-setup.ts'], // Separate setup for API tests
      include: [
        'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        'tests/api/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        'tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
      ],
      exclude: ['playwright.config.*', 'node_modules/**'],

      // Environment configuration for isolated testing
      env: {
        NODE_ENV: 'test',
        ...env
      },

      // Load test environment variables
      environmentOptions: {
        jsdom: {
          url: 'http://localhost:5173'
        }
      },

    // Advanced testing will be configured programmatically
    // See src/lib/testing/ for framework implementations

    coverage: {
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'src/lib/testing/', // Exclude testing utilities
        'src/**/*.test.*',
        'src/**/*.spec.*'
      ],
      thresholds: {
        global: {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    },

    // Advanced testing frameworks are available in src/lib/testing/
    // Use them programmatically in your tests
  },

  resolve: {
    alias: {
      '@': '/src',
    },
  },
  }
})

// Custom reporters and advanced functionality available in src/lib/testing/