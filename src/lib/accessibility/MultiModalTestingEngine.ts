export interface InteractionMode {
  type: 'keyboard' | 'mouse' | 'touch' | 'voice' | 'switch' | 'screen-reader';
  capabilities: string[];
  limitations: string[];
}

export interface MultiModalTestResult {
  mode: InteractionMode;
  component: string;
  testCase: string;
  status: 'passed' | 'failed' | 'warning' | 'not-applicable';
  duration: number;
  interactions: Interaction[];
  issues: MultiModalIssue[];
  recommendations: string[];
}

export interface Interaction {
  type: string;
  target: string;
  timestamp: number;
  success: boolean;
  details?: string;
}

export interface MultiModalIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedModes: string[];
  wcagViolation?: string;
  recommendation: string;
}

export interface MultiModalConsistencyReport {
  component: string;
  overallConsistency: number; // 0-100
  modeComparisons: ModeComparison[];
  commonIssues: MultiModalIssue[];
  recommendations: string[];
  timestamp: Date;
}

export interface ModeComparison {
  modeA: string;
  modeB: string;
  consistency: number; // 0-100
  differences: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface MultiModalTestSuite {
  id: string;
  name: string;
  components: string[];
  modes: InteractionMode[];
  testCases: MultiModalTestCase[];
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface MultiModalTestCase {
  id: string;
  name: string;
  description: string;
  component: string;
  primaryMode: string;
  alternativeModes: string[];
  expectedBehavior: string;
  successCriteria: string[];
}

export class MultiModalTestingEngine {
  private supportedModes: Map<string, InteractionMode> = new Map();
  private testSuites: Map<string, MultiModalTestSuite> = new Map();

  constructor() {
    this.initializeSupportedModes();
  }

  public async runMultiModalTestSuite(
    suiteId: string,
    options: TestOptions = {}
  ): Promise<MultiModalTestResult[]> {
    const suite = this.testSuites.get(suiteId);
    if (!suite) {
      throw new Error(`Test suite ${suiteId} not found`);
    }

    const results: MultiModalTestResult[] = [];

    for (const testCase of suite.testCases) {
      for (const mode of suite.modes) {
        const result = await this.executeTestCase(testCase, mode, options);
        results.push(result);
      }
    }

    return results;
  }

  public async analyzeMultiModalConsistency(
    component: string,
    results: MultiModalTestResult[]
  ): Promise<MultiModalConsistencyReport> {
    const componentResults = results.filter(r => r.component === component);

    // Calculate overall consistency
    const overallConsistency = this.calculateOverallConsistency(componentResults);

    // Compare modes pairwise
    const modeComparisons = this.compareInteractionModes(componentResults);

    // Identify common issues
    const commonIssues = this.identifyCommonIssues(componentResults);

    // Generate recommendations
    const recommendations = this.generateConsistencyRecommendations(commonIssues, modeComparisons);

    return {
      component,
      overallConsistency,
      modeComparisons,
      commonIssues,
      recommendations,
      timestamp: new Date()
    };
  }

  public async createTestSuite(
    components: string[],
    modes: string[] = []
  ): Promise<MultiModalTestSuite> {
    const suiteId = `suite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const selectedModes = modes.length > 0
      ? modes.map(mode => this.supportedModes.get(mode)).filter(Boolean) as InteractionMode[]
      : Array.from(this.supportedModes.values());

    const testCases = this.generateTestCases(components, selectedModes);

    const suite: MultiModalTestSuite = {
      id: suiteId,
      name: `Multi-Modal Test Suite for ${components.join(', ')}`,
      components,
      modes: selectedModes,
      testCases,
      status: 'pending'
    };

    this.testSuites.set(suiteId, suite);
    return suite;
  }

  public getSupportedModes(): InteractionMode[] {
    return Array.from(this.supportedModes.values());
  }

  public getTestSuite(suiteId: string): MultiModalTestSuite | null {
    return this.testSuites.get(suiteId) || null;
  }

  private initializeSupportedModes(): void {
    this.supportedModes.set('keyboard', {
      type: 'keyboard',
      capabilities: ['navigation', 'activation', 'text-input', 'shortcuts'],
      limitations: ['spatial-interaction', 'gesture-based-actions']
    });

    this.supportedModes.set('mouse', {
      type: 'mouse',
      capabilities: ['precise-pointing', 'drag-drop', 'hover-states', 'context-menus'],
      limitations: ['keyboard-only-users', 'motor-impairments']
    });

    this.supportedModes.set('touch', {
      type: 'touch',
      capabilities: ['gestures', 'multi-touch', 'swipe-navigation', 'pinch-zoom'],
      limitations: ['precision-requirements', 'hover-dependent-features']
    });

    this.supportedModes.set('voice', {
      type: 'voice',
      capabilities: ['voice-commands', 'dictation', 'voice-navigation'],
      limitations: ['quiet-environments', 'speech-recognition-accuracy', 'privacy-concerns']
    });

    this.supportedModes.set('switch', {
      type: 'switch',
      capabilities: ['single-switch-scanning', 'dual-switch-stepping'],
      limitations: ['complex-interactions', 'speed-requirements']
    });

    this.supportedModes.set('screen-reader', {
      type: 'screen-reader',
      capabilities: ['semantic-navigation', 'content-announcement', 'landmark-navigation'],
      limitations: ['visual-context', 'spatial-layout-understanding']
    });
  }

  private async executeTestCase(
    testCase: MultiModalTestCase,
    mode: InteractionMode,
    options: TestOptions
  ): Promise<MultiModalTestResult> {
    const startTime = Date.now();

    // Simulate test execution
    const interactions = await this.simulateInteractions(testCase, mode);
    const issues = await this.analyzeTestResults(testCase, mode, interactions);

    const duration = Date.now() - startTime;
    const status = this.determineTestStatus(issues, interactions);

    return {
      mode,
      component: testCase.component,
      testCase: testCase.id,
      status,
      duration,
      interactions,
      issues,
      recommendations: this.generateTestRecommendations(issues, mode)
    };
  }

  private async simulateInteractions(
    testCase: MultiModalTestCase,
    mode: InteractionMode
  ): Promise<Interaction[]> {
    // Mock interaction simulation based on mode capabilities
    const interactions: Interaction[] = [];

    switch (mode.type) {
      case 'keyboard':
        interactions.push(...this.simulateKeyboardInteractions(testCase));
        break;
      case 'mouse':
        interactions.push(...this.simulateMouseInteractions(testCase));
        break;
      case 'touch':
        interactions.push(...this.simulateTouchInteractions(testCase));
        break;
      case 'voice':
        interactions.push(...this.simulateVoiceInteractions(testCase));
        break;
      case 'switch':
        interactions.push(...this.simulateSwitchInteractions(testCase));
        break;
      case 'screen-reader':
        interactions.push(...this.simulateScreenReaderInteractions(testCase));
        break;
    }

    return interactions;
  }

  private simulateKeyboardInteractions(testCase: MultiModalTestCase): Interaction[] {
    return [
      {
        type: 'keydown',
        target: testCase.component,
        timestamp: Date.now(),
        success: true,
        details: 'Tab navigation to component'
      },
      {
        type: 'keypress',
        target: testCase.component,
        timestamp: Date.now() + 100,
        success: true,
        details: 'Enter key activation'
      }
    ];
  }

  private simulateMouseInteractions(testCase: MultiModalTestCase): Interaction[] {
    return [
      {
        type: 'click',
        target: testCase.component,
        timestamp: Date.now(),
        success: true,
        details: 'Left mouse button click'
      },
      {
        type: 'hover',
        target: testCase.component,
        timestamp: Date.now() + 50,
        success: true,
        details: 'Mouse hover for tooltip'
      }
    ];
  }

  private simulateTouchInteractions(testCase: MultiModalTestCase): Interaction[] {
    return [
      {
        type: 'touchstart',
        target: testCase.component,
        timestamp: Date.now(),
        success: true,
        details: 'Touch start event'
      },
      {
        type: 'touchend',
        target: testCase.component,
        timestamp: Date.now() + 100,
        success: true,
        details: 'Touch end event'
      }
    ];
  }

  private simulateVoiceInteractions(testCase: MultiModalTestCase): Interaction[] {
    return [
      {
        type: 'voice-command',
        target: testCase.component,
        timestamp: Date.now(),
        success: true,
        details: 'Voice command recognized and executed'
      }
    ];
  }

  private simulateSwitchInteractions(testCase: MultiModalTestCase): Interaction[] {
    return [
      {
        type: 'switch-activation',
        target: testCase.component,
        timestamp: Date.now(),
        success: true,
        details: 'Switch device activation'
      }
    ];
  }

  private simulateScreenReaderInteractions(testCase: MultiModalTestCase): Interaction[] {
    return [
      {
        type: 'screen-reader-focus',
        target: testCase.component,
        timestamp: Date.now(),
        success: true,
        details: 'Screen reader focus and announcement'
      }
    ];
  }

  private async analyzeTestResults(
    testCase: MultiModalTestCase,
    mode: InteractionMode,
    interactions: Interaction[]
  ): Promise<MultiModalIssue[]> {
    const issues: MultiModalIssue[] = [];

    // Check for failed interactions
    const failedInteractions = interactions.filter(i => !i.success);
    if (failedInteractions.length > 0) {
      issues.push({
        severity: 'high',
        description: `${failedInteractions.length} interactions failed in ${mode.type} mode`,
        affectedModes: [mode.type],
        recommendation: `Fix ${mode.type} interaction handling for ${testCase.component}`
      });
    }

    // Check for mode-specific limitations
    if (mode.limitations.includes('precision-requirements') && testCase.expectedBehavior.includes('precise')) {
      issues.push({
        severity: 'medium',
        description: `${mode.type} mode may struggle with precision requirements`,
        affectedModes: [mode.type],
        recommendation: 'Consider alternative interaction methods for precise actions'
      });
    }

    return issues;
  }

  private determineTestStatus(
    issues: MultiModalIssue[],
    interactions: Interaction[]
  ): 'passed' | 'failed' | 'warning' | 'not-applicable' {
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');

    if (criticalIssues.length > 0 || interactions.every(i => !i.success)) {
      return 'failed';
    }

    if (highIssues.length > 0) {
      return 'warning';
    }

    if (interactions.some(i => i.success)) {
      return 'passed';
    }

    return 'not-applicable';
  }

  private generateTestRecommendations(issues: MultiModalIssue[], mode: InteractionMode): string[] {
    const recommendations: string[] = [];

    for (const issue of issues) {
      recommendations.push(issue.recommendation);
    }

    // Add mode-specific recommendations
    switch (mode.type) {
      case 'keyboard':
        recommendations.push('Ensure proper tab order and keyboard event handling');
        break;
      case 'touch':
        recommendations.push('Implement touch gesture support and prevent zoom issues');
        break;
      case 'voice':
        recommendations.push('Add voice command labels and feedback');
        break;
      case 'screen-reader':
        recommendations.push('Provide proper ARIA labels and semantic markup');
        break;
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  private calculateOverallConsistency(results: MultiModalTestResult[]): number {
    if (results.length === 0) return 100;

    const passedTests = results.filter(r => r.status === 'passed').length;
    return Math.round((passedTests / results.length) * 100);
  }

  private compareInteractionModes(results: MultiModalTestResult[]): ModeComparison[] {
    const comparisons: ModeComparison[] = [];
    const modes = [...new Set(results.map(r => r.mode.type))];

    for (let i = 0; i < modes.length; i++) {
      for (let j = i + 1; j < modes.length; j++) {
        const modeA = modes[i];
        const modeB = modes[j];

        const modeAResults = results.filter(r => r.mode.type === modeA);
        const modeBResults = results.filter(r => r.mode.type === modeB);

        const consistency = this.calculateModeConsistency(modeAResults, modeBResults);
        const differences = this.identifyModeDifferences(modeAResults, modeBResults);

        comparisons.push({
          modeA,
          modeB,
          consistency,
          differences,
          severity: this.calculateComparisonSeverity(consistency, differences)
        });
      }
    }

    return comparisons;
  }

  private calculateModeConsistency(modeAResults: MultiModalTestResult[], modeBResults: MultiModalTestResult[]): number {
    // Compare test results between modes for the same components
    const commonComponents = new Set(
      modeAResults.map(r => r.component).filter(c =>
        modeBResults.some(br => br.component === c)
      )
    );

    let totalConsistency = 0;
    let componentCount = 0;

    for (const component of commonComponents) {
      const componentAResults = modeAResults.filter(r => r.component === component);
      const componentBResults = modeBResults.filter(r => r.component === component);

      const consistency = this.calculateComponentConsistency(componentAResults, componentBResults);
      totalConsistency += consistency;
      componentCount++;
    }

    return componentCount > 0 ? Math.round(totalConsistency / componentCount) : 100;
  }

  private calculateComponentConsistency(
    componentAResults: MultiModalTestResult[],
    componentBResults: MultiModalTestResult[]
  ): number {
    const totalTests = componentAResults.length + componentBResults.length;
    const passedTests = componentAResults.filter(r => r.status === 'passed').length +
                       componentBResults.filter(r => r.status === 'passed').length;

    return Math.round((passedTests / totalTests) * 100);
  }

  private identifyModeDifferences(
    modeAResults: MultiModalTestResult[],
    modeBResults: MultiModalTestResult[]
  ): string[] {
    const differences: string[] = [];

    // Compare failed tests between modes
    const modeAFailures = modeAResults.filter(r => r.status === 'failed').map(r => r.testCase);
    const modeBFailures = modeBResults.filter(r => r.status === 'failed').map(r => r.testCase);

    const uniqueAFailures = modeAFailures.filter(f => !modeBFailures.includes(f));
    const uniqueBFailures = modeBFailures.filter(f => !modeAFailures.includes(f));

    if (uniqueAFailures.length > 0) {
      differences.push(`${uniqueAFailures.length} tests failed only in first mode`);
    }

    if (uniqueBFailures.length > 0) {
      differences.push(`${uniqueBFailures.length} tests failed only in second mode`);
    }

    return differences;
  }

  private calculateComparisonSeverity(consistency: number, differences: string[]): 'low' | 'medium' | 'high' {
    if (consistency < 50 || differences.length > 5) return 'high';
    if (consistency < 75 || differences.length > 2) return 'medium';
    return 'low';
  }

  private identifyCommonIssues(results: MultiModalTestResult[]): MultiModalIssue[] {
    const issueMap = new Map<string, MultiModalIssue>();

    for (const result of results) {
      for (const issue of result.issues) {
        const key = `${issue.description}-${issue.severity}`;
        if (issueMap.has(key)) {
          const existing = issueMap.get(key)!;
          existing.affectedModes = [...new Set([...existing.affectedModes, ...issue.affectedModes])];
        } else {
          issueMap.set(key, { ...issue });
        }
      }
    }

    return Array.from(issueMap.values()).filter(issue => issue.affectedModes.length > 1);
  }

  private generateConsistencyRecommendations(
    issues: MultiModalIssue[],
    comparisons: ModeComparison[]
  ): string[] {
    const recommendations: string[] = [];

    // Recommendations based on common issues
    for (const issue of issues) {
      recommendations.push(`Address ${issue.description.toLowerCase()} affecting ${issue.affectedModes.join(', ')}`);
    }

    // Recommendations based on mode comparisons
    const lowConsistencyComparisons = comparisons.filter(c => c.consistency < 70);
    if (lowConsistencyComparisons.length > 0) {
      recommendations.push('Improve consistency between interaction modes, especially for low-scoring mode pairs');
    }

    // General recommendations
    recommendations.push('Implement progressive enhancement to ensure core functionality works across all modes');
    recommendations.push('Add mode-specific optimizations while maintaining consistent behavior');

    return [...new Set(recommendations)];
  }

  private generateTestCases(components: string[], modes: InteractionMode[]): MultiModalTestCase[] {
    const testCases: MultiModalTestCase[] = [];

    for (const component of components) {
      // Generate test cases for each component and mode combination
      for (const mode of modes) {
        testCases.push({
          id: `${component}-${mode.type}-test`,
          name: `${component} ${mode.type} interaction test`,
          description: `Test ${component} functionality using ${mode.type} interaction mode`,
          component,
          primaryMode: mode.type,
          alternativeModes: modes.filter(m => m.type !== mode.type).map(m => m.type),
          expectedBehavior: `Component should be fully functional using ${mode.type} interactions`,
          successCriteria: [
            `All ${mode.type} interactions complete successfully`,
            'Component state changes appropriately',
            'No accessibility violations introduced'
          ]
        });
      }
    }

    return testCases;
  }
}

export interface TestOptions {
  timeout?: number;
  retries?: number;
  viewport?: { width: number; height: number };
  userAgent?: string;
}