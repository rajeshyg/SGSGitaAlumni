import { PredictivePerformanceEngine } from '../PredictivePerformanceEngine';
import { AnomalyDetectionEngine } from '../AnomalyDetectionEngine';

export interface GateEvaluation {
  deployment: Deployment;
  performanceResults: PerformanceResults;
  evaluation: GateEvaluationResult;
  decision: GateDecision;
  timestamp: Date;
  gateId: string;
}

export interface Deployment {
  id: string;
  version: string;
  environment: 'staging' | 'production' | 'canary';
  timestamp: Date;
  commitHash: string;
  branch: string;
}

export interface PerformanceResults {
  responseTime: ResponseTimeMetrics;
  throughput: ThroughputMetrics;
  errorRate: ErrorRateMetrics;
  resourceUsage: ResourceUsageMetrics;
  testDuration: number;
  testStatus: 'passed' | 'failed' | 'warning';
}

export interface ResponseTimeMetrics {
  average: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
  baseline: number;
}

export interface ThroughputMetrics {
  requestsPerSecond: number;
  concurrentUsers: number;
  baseline: number;
}

export interface ErrorRateMetrics {
  totalErrors: number;
  errorRate: number;
  baseline: number;
}

export interface ResourceUsageMetrics {
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics;
  network: NetworkMetrics;
}

export interface CPUMetrics {
  average: number;
  peak: number;
  baseline: number;
}

export interface MemoryMetrics {
  average: number;
  peak: number;
  baseline: number;
}

export interface DiskMetrics {
  readIOPS: number;
  writeIOPS: number;
  baseline: number;
}

export interface NetworkMetrics {
  inbound: number;
  outbound: number;
  baseline: number;
}

export interface GateEvaluationResult {
  responseTime: GateCheckResult;
  throughput: GateCheckResult;
  errorRate: GateCheckResult;
  resourceUsage: GateCheckResult;
  overallResult: 'passed' | 'failed' | 'warning';
}

export interface GateCheckResult {
  status: 'passed' | 'failed' | 'warning';
  value: number;
  threshold: number;
  deviation: number;
  score: number;
}

export interface GateDecision {
  action: 'allow' | 'block' | 'warn';
  reason: string;
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

export interface GateCriteria {
  responseTimeThreshold: number;
  throughputThreshold: number;
  errorRateThreshold: number;
  cpuThreshold: number;
  memoryThreshold: number;
  evaluationWeights: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    resourceUsage: number;
  };
}

export class PerformanceGate {
  private predictiveEngine: PredictivePerformanceEngine;
  private anomalyEngine: AnomalyDetectionEngine;
  private gateCriteria: GateCriteria;

  constructor(criteria?: Partial<GateCriteria>) {
    this.predictiveEngine = new PredictivePerformanceEngine();
    this.anomalyEngine = new AnomalyDetectionEngine();
    this.gateCriteria = {
      responseTimeThreshold: 1000, // ms
      throughputThreshold: 100, // req/sec
      errorRateThreshold: 0.05, // 5%
      cpuThreshold: 80, // %
      memoryThreshold: 85, // %
      evaluationWeights: {
        responseTime: 0.3,
        throughput: 0.2,
        errorRate: 0.3,
        resourceUsage: 0.2
      },
      ...criteria
    };
  }

  public async evaluatePerformanceGate(
    deployment: Deployment,
    baseline: PerformanceBaseline
  ): Promise<GateEvaluation> {
    // Run performance tests
    const performanceResults = await this.runPerformanceTests(deployment);

    // Evaluate against gate criteria
    const evaluation = await this.evaluateAgainstCriteria(performanceResults, baseline);

    // Generate gate decision
    const decision = await this.generateGateDecision(evaluation);

    // Log gate evaluation
    await this.logGateEvaluation({
      deployment,
      performanceResults,
      evaluation,
      decision
    });

    return {
      deployment,
      performanceResults,
      evaluation,
      decision,
      timestamp: new Date(),
      gateId: this.generateGateId()
    };
  }

  private async runPerformanceTests(deployment: Deployment): Promise<PerformanceResults> {
    // Mock performance test execution
    // In real implementation, this would trigger actual performance tests
    const testResults = await this.executePerformanceTestSuite(deployment);

    return {
      responseTime: testResults.responseTime,
      throughput: testResults.throughput,
      errorRate: testResults.errorRate,
      resourceUsage: testResults.resourceUsage,
      testDuration: testResults.duration,
      testStatus: testResults.status
    };
  }

  private async evaluateAgainstCriteria(
    results: PerformanceResults,
    baseline: PerformanceBaseline
  ): Promise<GateEvaluationResult> {
    // Check response time criteria
    const responseTimeCheck = this.checkResponseTimeCriteria(results, baseline);

    // Check throughput criteria
    const throughputCheck = this.checkThroughputCriteria(results, baseline);

    // Check error rate criteria
    const errorRateCheck = this.checkErrorRateCriteria(results, baseline);

    // Check resource usage criteria
    const resourceCheck = this.checkResourceUsageCriteria(results, baseline);

    return {
      responseTime: responseTimeCheck,
      throughput: throughputCheck,
      errorRate: errorRateCheck,
      resourceUsage: resourceCheck,
      overallResult: this.calculateOverallGateResult([
        responseTimeCheck,
        throughputCheck,
        errorRateCheck,
        resourceCheck
      ])
    };
  }

  private checkResponseTimeCriteria(
    results: PerformanceResults,
    baseline: PerformanceBaseline
  ): GateCheckResult {
    const value = results.responseTime.average;
    const threshold = this.gateCriteria.responseTimeThreshold;
    const baselineValue = baseline.responseTime.average;

    const deviation = ((value - baselineValue) / baselineValue) * 100;
    const status = this.determineStatus(value, threshold, deviation);

    return {
      status,
      value,
      threshold,
      deviation,
      score: this.calculateScore(value, threshold, deviation)
    };
  }

  private checkThroughputCriteria(
    results: PerformanceResults,
    baseline: PerformanceBaseline
  ): GateCheckResult {
    const value = results.throughput.requestsPerSecond;
    const threshold = this.gateCriteria.throughputThreshold;
    const baselineValue = baseline.throughput.requestsPerSecond;

    const deviation = ((value - baselineValue) / baselineValue) * 100;
    const status = this.determineStatusForThroughput(value, threshold, deviation);

    return {
      status,
      value,
      threshold,
      deviation,
      score: this.calculateScoreForThroughput(value, threshold, deviation)
    };
  }

  private checkErrorRateCriteria(
    results: PerformanceResults,
    baseline: PerformanceBaseline
  ): GateCheckResult {
    const value = results.errorRate.errorRate;
    const threshold = this.gateCriteria.errorRateThreshold;
    const baselineValue = baseline.errorRate.errorRate;

    const deviation = value - baselineValue;
    const status = this.determineStatus(value, threshold, deviation);

    return {
      status,
      value,
      threshold,
      deviation,
      score: this.calculateScore(value, threshold, deviation)
    };
  }

  private checkResourceUsageCriteria(
    results: PerformanceResults,
    baseline: PerformanceBaseline
  ): GateCheckResult {
    const cpuValue = results.resourceUsage.cpu.average;
    const memoryValue = results.resourceUsage.memory.average;
    const cpuThreshold = this.gateCriteria.cpuThreshold;
    const memoryThreshold = this.gateCriteria.memoryThreshold;

    const cpuBaseline = baseline.resourceUsage.cpu.average;
    const memoryBaseline = baseline.resourceUsage.memory.average;

    const cpuDeviation = ((cpuValue - cpuBaseline) / cpuBaseline) * 100;
    const memoryDeviation = ((memoryValue - memoryBaseline) / memoryBaseline) * 100;

    const cpuStatus = this.determineStatus(cpuValue, cpuThreshold, cpuDeviation);
    const memoryStatus = this.determineStatus(memoryValue, memoryThreshold, memoryDeviation);

    // Combine CPU and memory results
    const combinedValue = (cpuValue + memoryValue) / 2;
    const combinedThreshold = (cpuThreshold + memoryThreshold) / 2;
    const combinedDeviation = (cpuDeviation + memoryDeviation) / 2;

    const overallStatus = this.combineStatuses([cpuStatus, memoryStatus]);

    return {
      status: overallStatus,
      value: combinedValue,
      threshold: combinedThreshold,
      deviation: combinedDeviation,
      score: this.calculateCombinedScore([cpuValue, memoryValue], [cpuThreshold, memoryThreshold])
    };
  }

  private calculateOverallGateResult(checks: GateCheckResult[]): 'passed' | 'failed' | 'warning' {
    const weights = this.gateCriteria.evaluationWeights;
    const weightedScores = {
      responseTime: checks[0].score * weights.responseTime,
      throughput: checks[1].score * weights.throughput,
      errorRate: checks[2].score * weights.errorRate,
      resourceUsage: checks[3].score * weights.resourceUsage
    };

    const totalScore = Object.values(weightedScores).reduce((sum, score) => sum + score, 0);

    if (totalScore >= 0.8) return 'passed';
    if (totalScore >= 0.6) return 'warning';
    return 'failed';
  }

  private async generateGateDecision(evaluation: GateEvaluationResult): Promise<GateDecision> {
    const failedChecks = this.getFailedChecks(evaluation);
    const warningChecks = this.getWarningChecks(evaluation);

    if (failedChecks.length > 0) {
      return {
        action: 'block',
        reason: `Failed ${failedChecks.length} performance criteria: ${failedChecks.join(', ')}`,
        recommendations: await this.generateFailureRecommendations(failedChecks),
        riskLevel: 'high',
        confidence: 0.9
      };
    }

    if (warningChecks.length > 0) {
      return {
        action: 'warn',
        reason: `Warning on ${warningChecks.length} performance criteria: ${warningChecks.join(', ')}`,
        recommendations: await this.generateWarningRecommendations(warningChecks),
        riskLevel: 'medium',
        confidence: 0.8
      };
    }

    return {
      action: 'allow',
      reason: 'All performance criteria passed',
      recommendations: [],
      riskLevel: 'low',
      confidence: 0.95
    };
  }

  private async logGateEvaluation(evaluation: {
    deployment: Deployment;
    performanceResults: PerformanceResults;
    evaluation: GateEvaluationResult;
    decision: GateDecision;
  }): Promise<void> {
    // Mock logging implementation
    console.log('Performance Gate Evaluation:', {
      gateId: this.generateGateId(),
      deployment: evaluation.deployment,
      results: evaluation.performanceResults,
      evaluation: evaluation.evaluation,
      decision: evaluation.decision,
      timestamp: new Date()
    });
  }

  private determineStatus(value: number, threshold: number, deviation: number): 'passed' | 'failed' | 'warning' {
    if (value > threshold) return 'failed';
    if (deviation > 10) return 'warning'; // 10% deviation from baseline
    return 'passed';
  }

  private determineStatusForThroughput(value: number, threshold: number, deviation: number): 'passed' | 'failed' | 'warning' {
    if (value < threshold) return 'failed';
    if (deviation < -10) return 'warning'; // 10% drop from baseline
    return 'passed';
  }

  private calculateScore(value: number, threshold: number, deviation: number): number {
    if (value > threshold) return 0;
    const deviationPenalty = Math.abs(deviation) / 100; // Normalize deviation
    return Math.max(0, 1 - deviationPenalty);
  }

  private calculateScoreForThroughput(value: number, threshold: number, deviation: number): number {
    if (value < threshold) return 0;
    const deviationBonus = Math.max(0, deviation) / 100; // Positive deviation is good
    return Math.min(1, 0.5 + deviationBonus);
  }

  private calculateCombinedScore(values: number[], thresholds: number[]): number {
    const scores = values.map((value, index) => {
      const threshold = thresholds[index];
      return value <= threshold ? 1 : Math.max(0, 1 - (value - threshold) / threshold);
    });
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private combineStatuses(statuses: ('passed' | 'failed' | 'warning')[]): 'passed' | 'failed' | 'warning' {
    if (statuses.includes('failed')) return 'failed';
    if (statuses.includes('warning')) return 'warning';
    return 'passed';
  }

  private getFailedChecks(evaluation: GateEvaluationResult): string[] {
    const failed: string[] = [];
    if (evaluation.responseTime.status === 'failed') failed.push('response time');
    if (evaluation.throughput.status === 'failed') failed.push('throughput');
    if (evaluation.errorRate.status === 'failed') failed.push('error rate');
    if (evaluation.resourceUsage.status === 'failed') failed.push('resource usage');
    return failed;
  }

  private getWarningChecks(evaluation: GateEvaluationResult): string[] {
    const warnings: string[] = [];
    if (evaluation.responseTime.status === 'warning') warnings.push('response time');
    if (evaluation.throughput.status === 'warning') warnings.push('throughput');
    if (evaluation.errorRate.status === 'warning') warnings.push('error rate');
    if (evaluation.resourceUsage.status === 'warning') warnings.push('resource usage');
    return warnings;
  }

  private async generateFailureRecommendations(failedChecks: string[]): Promise<string[]> {
    const recommendations: string[] = [];

    for (const check of failedChecks) {
      switch (check) {
        case 'response time':
          recommendations.push('Optimize database queries and implement caching');
          recommendations.push('Consider horizontal scaling of application servers');
          break;
        case 'throughput':
          recommendations.push('Review load balancer configuration');
          recommendations.push('Optimize concurrent connection handling');
          break;
        case 'error rate':
          recommendations.push('Review error handling and logging');
          recommendations.push('Check for failing external service dependencies');
          break;
        case 'resource usage':
          recommendations.push('Monitor and optimize memory usage patterns');
          recommendations.push('Review CPU-intensive operations');
          break;
      }
    }

    return recommendations;
  }

  private async generateWarningRecommendations(warningChecks: string[]): Promise<string[]> {
    const recommendations: string[] = [];

    for (const check of warningChecks) {
      recommendations.push(`Monitor ${check} trends closely in production`);
      recommendations.push(`Consider optimization opportunities for ${check}`);
    }

    return recommendations;
  }

  private async executePerformanceTestSuite(deployment: Deployment): Promise<any> {
    // Mock performance test execution
    return {
      responseTime: {
        average: 850,
        p50: 800,
        p95: 1200,
        p99: 1500,
        max: 2000,
        baseline: 800
      },
      throughput: {
        requestsPerSecond: 120,
        concurrentUsers: 100,
        baseline: 100
      },
      errorRate: {
        totalErrors: 5,
        errorRate: 0.025,
        baseline: 0.02
      },
      resourceUsage: {
        cpu: { average: 65, peak: 80, baseline: 60 },
        memory: { average: 70, peak: 85, baseline: 65 },
        disk: { readIOPS: 1000, writeIOPS: 800, baseline: 900 },
        network: { inbound: 50, outbound: 30, baseline: 40 }
      },
      duration: 300,
      status: 'passed'
    };
  }

  private generateGateId(): string {
    return `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Type definition for PerformanceBaseline (assuming it's defined elsewhere)
export interface PerformanceBaseline {
  responseTime: ResponseTimeMetrics;
  throughput: ThroughputMetrics;
  errorRate: ErrorRateMetrics;
  resourceUsage: ResourceUsageMetrics;
}