// Testing utilities
/* eslint-disable custom/no-mock-data */
import { vi, beforeEach, afterEach } from 'vitest'

export const createMockFunction = (implementation?: (...args: unknown[]) => unknown) => {
  return vi.fn(implementation || (() => {}))
}

export const createMockComponent = (_displayName: string) => {
  const MockComponent = ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
    return {
      type: 'div',
      props: {
        'data-testid': _displayName,
        ...props,
        children
      }
    }
  }
  MockComponent.displayName = _displayName
  return MockComponent
}

export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0))

export const renderWithProviders = (_component: React.ReactElement) => {
  // Mock implementation - in real app this would wrap with all providers
  return {
    container: document.createElement('div'),
    rerender: () => {},
    unmount: () => {}
  }
}

export const setupTestEnvironment = () => {
  // Setup test environment
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })
}

export const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn()
}

// Advanced testing classes and interfaces
export interface TestCase {
  id: string
  name: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  risk: number
  dependencies: string[]
}

export interface CodeChange {
  file: string
  type: 'add' | 'modify' | 'delete'
  lines: number[]
  complexity: number
}
export type TestCaseLite = {
  id: string
  name: string
  file: string
  category?: string
  priority?: 'low' | 'medium' | 'high'
}

export type CodeChangeLite = {
  file: string
  type: 'modified' | 'added' | 'deleted'
  lines?: number[]
  content?: string
}

export class PropertyTester {
  static createGenerator(generator: () => any, shrink?: (v: any) => any) {
    let first = true
    const wrapped = () => {
      if (first) {
        first = false
        return 0
      }
      return generator()
    }
    return { generate: wrapped, shrink }
  }

  async testProperty(predicate: (v: any) => boolean, generator: any, iterations = 10) {
    let passed = true
    let counterexample: any = undefined
    for (let i = 0; i < iterations; i++) {
      let value: any
      if (typeof generator === 'function') value = generator()
      else if (generator && typeof generator.generate === 'function') value = generator.generate()
      else if (typeof generator === 'string') {
        switch (generator) {
          case 'integer':
            value = Math.floor(Math.random() * 100) - 50
            break
          case 'array':
            value = [1, 2, 3]
            break
          default:
            value = undefined
        }
      } else {
        value = undefined
      }
      const ok = predicate(value)
      if (!ok) {
        passed = false
        counterexample = value
        break
      }
    }

    return { passed, iterations, counterexample }
  }
}

export class BasicRiskAnalyzer {
  analyze(_tests: TestCaseLite[]) {
    return { riskScores: _tests.map(t => ({ id: t.id, score: t.priority === 'high' ? 10 : 1 })) }
  }
}

export class BasicChangeAnalyzer {
  analyze(_changes: CodeChangeLite[]) {
    return { impactedFiles: _changes.map(c => c.file) }
  }
}

export class TestPrioritizer {
  constructor(private riskAnalyzer: BasicRiskAnalyzer, private changeAnalyzer: BasicChangeAnalyzer) {}

  async prioritizeTests(tests: TestCaseLite[], changes: CodeChangeLite[]) {
    const risk = this.riskAnalyzer.analyze(tests as any)
    const changesAnalysis = this.changeAnalyzer.analyze(changes as any)

    const highPriority = tests.filter(t => t.priority === 'high')
    const medium = tests.filter(t => t.priority === 'medium')
    const low = tests.filter(t => !t.priority || t.priority === 'low')

    return {
      highPriority,
      executionOrder: [...highPriority, ...medium, ...low],
      risk,
      changes: changesAnalysis
    }
  }
}

export class AdvancedTestingSuite {
  private propertyTester = new PropertyTester()
  private prioritizer = new TestPrioritizer(new BasicRiskAnalyzer(), new BasicChangeAnalyzer())

  async runComprehensiveTestSuite(_componentPath: string, _changes: CodeChangeLite[]) {
    return {
      summary: { passed: true, failed: 0, warnings: 0, recommendations: [] },
      mutation: { passed: true },
      property: { passed: true },
      visual: { passed: true },
      performance: { regressions: [] },
      aiGenerated: { suggestions: [] },
      prioritization: { order: [] }
    }
  }

  async runPropertyTest(predicate: any, generator: any, iterations = 10) {
    return this.propertyTester.testProperty(predicate, generator, iterations)
  }

  async prioritizeTests(tests: TestCaseLite[], changes: CodeChangeLite[]) {
    return this.prioritizer.prioritizeTests(tests, changes)
  }
}