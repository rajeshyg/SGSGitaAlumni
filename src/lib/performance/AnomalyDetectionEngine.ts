// src/lib/performance/AnomalyDetectionEngine.ts
import { PerformanceMetrics, PerformanceBaseline, AnomalySensitivity } from './PredictivePerformanceEngine';

export interface AnomalyDetectionResult {
  anomalies: CorrelatedAnomaly[];
  falsePositiveRate: number;
  detectionAccuracy: number;
  recommendations: AnomalyRecommendation[];
}

export interface CorrelatedAnomaly {
  anomalies: AnomalySet[];
  correlation: AnomalyCorrelation;
  rootCause: RootCauseAnalysis;
  impact: AnomalyImpact;
}

export interface AnomalySet {
  timestamp: Date;
  metric: string;
  value: number;
  expected: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  detectionMethod: string;
}

export interface AnomalyCorrelation {
  confidence: number;
  relatedMetrics: string[];
  correlationType: 'temporal' | 'causal' | 'contextual';
  strength: number;
}

export interface RootCauseAnalysis {
  primaryCause: string;
  contributingFactors: string[];
  confidence: number;
  evidence: string[];
}

export interface AnomalyImpact {
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedComponents: string[];
  userImpact: number;
  businessImpact: number;
  estimatedRecoveryTime: number;
}

export interface AnomalyRecommendation {
  action: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  expectedResolution: string;
  preventiveMeasures: string[];
}

export class AnomalyDetectionEngine {
  private statisticalAnalyzer: StatisticalAnalyzer;
  private mlEngine: MLEngine;
  private patternRecognizer: PatternRecognizer;

  constructor() {
    this.statisticalAnalyzer = new StatisticalAnalyzer();
    this.mlEngine = new MLEngine();
    this.patternRecognizer = new PatternRecognizer();
  }

  public async detectPerformanceAnomalies(
    metrics: PerformanceMetrics[],
    baseline: PerformanceBaseline,
    sensitivity: AnomalySensitivity = 'medium'
  ): Promise<AnomalyDetectionResult> {
    // Apply statistical anomaly detection
    const statisticalAnomalies = await this.statisticalAnalyzer.detectAnomalies(metrics, baseline, sensitivity);

    // Apply ML-based anomaly detection
    const mlAnomalies = await this.mlEngine.detectAnomalies(metrics, baseline);

    // Apply pattern recognition
    const patternAnomalies = await this.patternRecognizer.detectPatterns(metrics, baseline);

    // Correlate anomalies
    const correlatedAnomalies = await this.correlateAnomalies([statisticalAnomalies, mlAnomalies, patternAnomalies]);

    // Prioritize anomalies
    const prioritizedAnomalies = this.prioritizeAnomalies(correlatedAnomalies);

    return {
      anomalies: prioritizedAnomalies,
      falsePositiveRate: this.calculateFalsePositiveRate(prioritizedAnomalies),
      detectionAccuracy: this.calculateDetectionAccuracy(prioritizedAnomalies),
      recommendations: await this.generateAnomalyRecommendations(prioritizedAnomalies)
    };
  }

  private async correlateAnomalies(anomalySets: AnomalySet[][]): Promise<CorrelatedAnomaly[]> {
    const correlated: CorrelatedAnomaly[] = [];

    const groupedAnomalies = this.groupAnomaliesByTimeAndMetric(anomalySets);

    for (const group of groupedAnomalies) {
      const correlation = this.calculateAnomalyCorrelation(group);
      if (correlation.confidence > 0.7) {
        correlated.push({
          anomalies: group.anomalies,
          correlation: correlation,
          rootCause: await this.identifyRootCause(group),
          impact: this.assessAnomalyImpact(group)
        });
      }
    }

    return correlated;
  }

  private groupAnomaliesByTimeAndMetric(anomalySets: AnomalySet[][]): AnomalyGroup[] {
    const groups: AnomalyGroup[] = [];
    const timeWindow = 5 * 60 * 1000; // 5 minutes

    // Flatten all anomalies
    const allAnomalies: AnomalySet[] = [];
    anomalySets.forEach(set => allAnomalies.push(...set));

    // Group by time window
    const sortedAnomalies = allAnomalies.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    let currentGroup: AnomalySet[] = [];
    let currentWindowStart = sortedAnomalies[0]?.timestamp.getTime() || 0;

    for (const anomaly of sortedAnomalies) {
      if (anomaly.timestamp.getTime() - currentWindowStart > timeWindow) {
        if (currentGroup.length > 0) {
          groups.push({ anomalies: currentGroup, timeWindow: currentWindowStart });
        }
        currentGroup = [anomaly];
        currentWindowStart = anomaly.timestamp.getTime();
      } else {
        currentGroup.push(anomaly);
      }
    }

    if (currentGroup.length > 0) {
      groups.push({ anomalies: currentGroup, timeWindow: currentWindowStart });
    }

    return groups;
  }

  private calculateAnomalyCorrelation(group: AnomalyGroup): AnomalyCorrelation {
    const metrics = group.anomalies.map(a => a.metric);
    const uniqueMetrics = [...new Set(metrics)];

    // Calculate correlation strength based on metric relationships
    let correlationStrength = 0;
    if (uniqueMetrics.includes('response_time') && uniqueMetrics.includes('throughput')) {
      correlationStrength = 0.8; // High correlation between response time and throughput
    } else if (uniqueMetrics.includes('cpu') && uniqueMetrics.includes('memory')) {
      correlationStrength = 0.7; // Medium correlation between CPU and memory
    } else {
      correlationStrength = 0.5; // Default correlation
    }

    return {
      confidence: Math.min(group.anomalies.length * 0.1, 1.0),
      relatedMetrics: uniqueMetrics,
      correlationType: 'temporal',
      strength: correlationStrength
    };
  }

  private async identifyRootCause(group: AnomalyGroup): Promise<RootCauseAnalysis> {
    const metrics = group.anomalies.map(a => a.metric);
    const severity = Math.max(...group.anomalies.map(a => a.deviation));

    let primaryCause = 'Unknown';
    const contributingFactors: string[] = [];
    const evidence: string[] = [];

    // Analyze metric patterns to identify root cause
    if (metrics.includes('response_time') && metrics.includes('cpu')) {
      primaryCause = 'High CPU utilization affecting response times';
      contributingFactors.push('Increased concurrent users', 'Resource contention');
      evidence.push('CPU and response time anomalies occurred simultaneously');
    } else if (metrics.includes('memory') && severity > 3) {
      primaryCause = 'Memory leak or excessive memory consumption';
      contributingFactors.push('Application memory leak', 'Large data processing');
      evidence.push('Memory usage deviated significantly from baseline');
    } else if (metrics.includes('throughput') && metrics.includes('error_rate')) {
      primaryCause = 'Application errors reducing throughput';
      contributingFactors.push('Code issues', 'External service failures');
      evidence.push('Error rate spike correlated with throughput drop');
    }

    return {
      primaryCause,
      contributingFactors,
      confidence: 0.75,
      evidence
    };
  }

  private assessAnomalyImpact(group: AnomalyGroup): AnomalyImpact {
    const maxSeverity = Math.max(...group.anomalies.map(a => {
      const severityMap = { low: 1, medium: 2, high: 3, critical: 4 };
      return severityMap[a.severity];
    }));

    const affectedComponents = [...new Set(group.anomalies.map(a => a.metric))];
    const avgDeviation = group.anomalies.reduce((sum, a) => sum + a.deviation, 0) / group.anomalies.length;

    // Calculate user and business impact based on severity and deviation
    const userImpact = Math.min(avgDeviation * 0.1, 1.0);
    const businessImpact = maxSeverity * 0.2;

    return {
      severity: maxSeverity >= 4 ? 'critical' : maxSeverity >= 3 ? 'high' : maxSeverity >= 2 ? 'medium' : 'low',
      affectedComponents,
      userImpact,
      businessImpact,
      estimatedRecoveryTime: maxSeverity * 15 // minutes
    };
  }

  private prioritizeAnomalies(anomalies: CorrelatedAnomaly[]): CorrelatedAnomaly[] {
    return anomalies.map(anomaly => ({
      ...anomaly,
      priority: this.calculateAnomalyPriority(anomaly),
      urgency: this.calculateAnomalyUrgency(anomaly),
      businessImpact: this.assessBusinessImpact(anomaly)
    })).sort((a, b) => b.priority - a.priority);
  }

  private calculateAnomalyPriority(anomaly: CorrelatedAnomaly): number {
    const severityWeight = anomaly.impact.severity === 'critical' ? 4 :
                          anomaly.impact.severity === 'high' ? 3 :
                          anomaly.impact.severity === 'medium' ? 2 : 1;

    const impactWeight = (anomaly.impact.userImpact + anomaly.impact.businessImpact) / 2;
    const correlationWeight = anomaly.correlation.confidence;

    return (severityWeight * 0.4 + impactWeight * 0.4 + correlationWeight * 0.2) * 100;
  }

  private calculateAnomalyUrgency(anomaly: CorrelatedAnomaly): number {
    const timeCriticality = anomaly.impact.estimatedRecoveryTime < 30 ? 1.0 :
                           anomaly.impact.estimatedRecoveryTime < 60 ? 0.8 : 0.6;

    const userImpact = anomaly.impact.userImpact;
    const businessImpact = anomaly.impact.businessImpact;

    return (timeCriticality * 0.4 + userImpact * 0.3 + businessImpact * 0.3);
  }

  private assessBusinessImpact(anomaly: CorrelatedAnomaly): number {
    const baseImpact = anomaly.impact.businessImpact;
    const componentMultiplier = anomaly.impact.affectedComponents.length * 0.1;
    const correlationMultiplier = anomaly.correlation.strength * 0.2;

    return Math.min(baseImpact + componentMultiplier + correlationMultiplier, 1.0);
  }

  private calculateFalsePositiveRate(anomalies: CorrelatedAnomaly[]): number {
    if (anomalies.length === 0) return 0;

    // Simplified false positive calculation based on confidence scores
    const totalAnomalies = anomalies.reduce((sum, a) => sum + a.anomalies.length, 0);
    const lowConfidenceAnomalies = anomalies.filter(a => a.correlation.confidence < 0.6).length;

    return lowConfidenceAnomalies / totalAnomalies;
  }

  private calculateDetectionAccuracy(anomalies: CorrelatedAnomaly[]): number {
    if (anomalies.length === 0) return 1.0;

    // Calculate accuracy based on correlation confidence and root cause confidence
    const avgCorrelationConfidence = anomalies.reduce((sum, a) => sum + a.correlation.confidence, 0) / anomalies.length;
    const avgRootCauseConfidence = anomalies.reduce((sum, a) => sum + a.rootCause.confidence, 0) / anomalies.length;

    return (avgCorrelationConfidence + avgRootCauseConfidence) / 2;
  }

  private async generateAnomalyRecommendations(anomalies: CorrelatedAnomaly[]): Promise<AnomalyRecommendation[]> {
    const recommendations: AnomalyRecommendation[] = [];

    for (const anomaly of anomalies) {
      // Generate recommendations based on root cause and impact
      if (anomaly.rootCause.primaryCause.includes('CPU')) {
        recommendations.push({
          action: 'Scale CPU resources or optimize CPU-intensive operations',
          priority: anomaly.impact.severity,
          effort: 'medium',
          expectedResolution: 'Reduce CPU utilization and improve response times',
          preventiveMeasures: [
            'Implement auto-scaling for CPU',
            'Optimize database queries',
            'Cache frequently accessed data'
          ]
        });
      }

      if (anomaly.rootCause.primaryCause.includes('memory')) {
        recommendations.push({
          action: 'Investigate and fix memory leaks',
          priority: anomaly.impact.severity,
          effort: 'high',
          expectedResolution: 'Stabilize memory usage and prevent crashes',
          preventiveMeasures: [
            'Implement memory monitoring',
            'Regular memory leak detection',
            'Optimize memory allocation patterns'
          ]
        });
      }

      if (anomaly.impact.userImpact > 0.5) {
        recommendations.push({
          action: 'Implement user notification system for service degradation',
          priority: 'high',
          effort: 'low',
          expectedResolution: 'Keep users informed during performance issues',
          preventiveMeasures: [
            'Set up performance monitoring alerts',
            'Create status page for service health',
            'Implement graceful degradation'
          ]
        });
      }
    }

    return recommendations;
  }
}

// Supporting interfaces and classes
interface AnomalyGroup {
  anomalies: AnomalySet[];
  timeWindow: number;
}

// Supporting classes with simplified implementations
class StatisticalAnalyzer {
  async detectAnomalies(
    metrics: PerformanceMetrics[],
    baseline: PerformanceBaseline,
    sensitivity: AnomalySensitivity
  ): Promise<AnomalySet[]> {
    const anomalies: AnomalySet[] = [];
    const sensitivityThreshold = sensitivity === 'low' ? 2.5 : sensitivity === 'medium' ? 2.0 : 1.5;

    for (const metric of metrics) {
      // Check response time anomalies
      const responseTimeDeviation = Math.abs(metric.responseTime - baseline.responseTime.mean) / baseline.responseTime.stdDev;
      if (responseTimeDeviation > sensitivityThreshold) {
        anomalies.push({
          timestamp: metric.timestamp,
          metric: 'response_time',
          value: metric.responseTime,
          expected: baseline.responseTime.mean,
          deviation: responseTimeDeviation,
          severity: responseTimeDeviation > 3 ? 'critical' : responseTimeDeviation > 2.5 ? 'high' : 'medium',
          confidence: Math.min(responseTimeDeviation / 3, 1.0),
          detectionMethod: 'statistical'
        });
      }

      // Check throughput anomalies
      const throughputDeviation = Math.abs(metric.throughput - baseline.throughput.mean) / baseline.throughput.stdDev;
      if (throughputDeviation > sensitivityThreshold) {
        anomalies.push({
          timestamp: metric.timestamp,
          metric: 'throughput',
          value: metric.throughput,
          expected: baseline.throughput.mean,
          deviation: throughputDeviation,
          severity: throughputDeviation > 3 ? 'critical' : throughputDeviation > 2.5 ? 'high' : 'medium',
          confidence: Math.min(throughputDeviation / 3, 1.0),
          detectionMethod: 'statistical'
        });
      }

      // Check resource usage anomalies
      const resourceUsage = (metric.resourceUsage.cpu + metric.resourceUsage.memory) / 2;
      const resourceDeviation = Math.abs(resourceUsage - baseline.resourceUsage.mean) / baseline.resourceUsage.stdDev;
      if (resourceDeviation > sensitivityThreshold) {
        anomalies.push({
          timestamp: metric.timestamp,
          metric: 'resource_usage',
          value: resourceUsage,
          expected: baseline.resourceUsage.mean,
          deviation: resourceDeviation,
          severity: resourceDeviation > 3 ? 'critical' : resourceDeviation > 2.5 ? 'high' : 'medium',
          confidence: Math.min(resourceDeviation / 3, 1.0),
          detectionMethod: 'statistical'
        });
      }
    }

    return anomalies;
  }
}

class MLEngine {
  async detectAnomalies(metrics: PerformanceMetrics[], baseline: PerformanceBaseline): Promise<AnomalySet[]> {
    const anomalies: AnomalySet[] = [];

    // Simplified ML-based anomaly detection using isolation forest approach
    for (const metric of metrics) {
      const featureVector = [
        metric.responseTime,
        metric.throughput,
        metric.resourceUsage.cpu,
        metric.resourceUsage.memory,
        metric.concurrentUsers
      ];

      // Calculate anomaly score using simplified isolation forest
      const anomalyScore = this.calculateIsolationForestScore(featureVector, baseline);

      if (anomalyScore > 0.6) {
        const primaryMetric = this.identifyPrimaryAnomalousMetric(featureVector, baseline);

        anomalies.push({
          timestamp: metric.timestamp,
          metric: primaryMetric,
          value: this.getMetricValue(metric, primaryMetric),
          expected: this.getBaselineValue(baseline, primaryMetric),
          deviation: anomalyScore,
          severity: anomalyScore > 0.8 ? 'critical' : anomalyScore > 0.7 ? 'high' : 'medium',
          confidence: anomalyScore,
          detectionMethod: 'ml'
        });
      }
    }

    return anomalies;
  }

  private calculateIsolationForestScore(featureVector: number[], baseline: PerformanceBaseline): number {
    // Simplified isolation forest calculation
    let score = 0;

    for (const feature of featureVector) {
      const baselineMean = this.getBaselineMean(baseline, featureVector.indexOf(feature));
      const deviation = Math.abs(feature - baselineMean) / (baselineMean || 1);
      score += deviation;
    }

    return Math.min(score / featureVector.length, 1.0);
  }

  private identifyPrimaryAnomalousMetric(featureVector: number[], baseline: PerformanceBaseline): string {
    let maxDeviation = 0;
    let primaryMetric = 'response_time';

    const metrics = ['response_time', 'throughput', 'cpu', 'memory', 'concurrent_users'];

    featureVector.forEach((feature, index) => {
      const baselineMean = this.getBaselineMean(baseline, index);
      const deviation = Math.abs(feature - baselineMean) / (baselineMean || 1);

      if (deviation > maxDeviation) {
        maxDeviation = deviation;
        primaryMetric = metrics[index] || 'response_time';
      }
    });

    return primaryMetric;
  }

  private getMetricValue(metric: PerformanceMetrics, metricName: string): number {
    switch (metricName) {
      case 'response_time': return metric.responseTime;
      case 'throughput': return metric.throughput;
      case 'cpu': return metric.resourceUsage.cpu;
      case 'memory': return metric.resourceUsage.memory;
      case 'concurrent_users': return metric.concurrentUsers;
      default: return metric.responseTime;
    }
  }

  private getBaselineValue(baseline: PerformanceBaseline, metricName: string): number {
    switch (metricName) {
      case 'response_time': return baseline.responseTime.mean;
      case 'throughput': return baseline.throughput.mean;
      case 'resource_usage': return baseline.resourceUsage.mean;
      default: return 100;
    }
  }

  private getBaselineMean(baseline: PerformanceBaseline, index: number): number {
    switch (index) {
      case 0: return baseline.responseTime.mean;
      case 1: return baseline.throughput.mean;
      case 2: return baseline.resourceUsage.mean;
      case 3: return baseline.resourceUsage.mean;
      case 4: return 100; // concurrent users baseline
      default: return 100;
    }
  }
}

class PatternRecognizer {
  async detectPatterns(metrics: PerformanceMetrics[], baseline: PerformanceBaseline): Promise<AnomalySet[]> {
    const anomalies: AnomalySet[] = [];

    // Detect cyclical patterns and anomalies
    const responseTimePattern = this.analyzeCyclicalPattern(metrics.map(m => m.responseTime));
    const throughputPattern = this.analyzeCyclicalPattern(metrics.map(m => m.throughput));

    // Check for pattern breaks
    if (responseTimePattern.anomaly) {
      anomalies.push({
        timestamp: metrics[metrics.length - 1].timestamp,
        metric: 'response_time',
        value: metrics[metrics.length - 1].responseTime,
        expected: responseTimePattern.expected,
        deviation: responseTimePattern.deviation,
        severity: responseTimePattern.severity,
        confidence: 0.7,
        detectionMethod: 'pattern'
      });
    }

    if (throughputPattern.anomaly) {
      anomalies.push({
        timestamp: metrics[metrics.length - 1].timestamp,
        metric: 'throughput',
        value: metrics[metrics.length - 1].throughput,
        expected: throughputPattern.expected,
        deviation: throughputPattern.deviation,
        severity: throughputPattern.severity,
        confidence: 0.7,
        detectionMethod: 'pattern'
      });
    }

    return anomalies;
  }

  private analyzeCyclicalPattern(values: number[]): { anomaly: boolean; expected: number; deviation: number; severity: 'low' | 'medium' | 'high' | 'critical' } {
    if (values.length < 10) {
      return { anomaly: false, expected: 0, deviation: 0, severity: 'low' };
    }

    // Simple cyclical pattern detection
    const recent = values.slice(-5);
    const previous = values.slice(-10, -5);
    const expected = previous.reduce((sum, val) => sum + val, 0) / previous.length;
    const actual = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const deviation = Math.abs(actual - expected) / (expected || 1);

    const anomaly = deviation > 0.3; // 30% deviation threshold
    const severity = deviation > 0.6 ? 'critical' : deviation > 0.4 ? 'high' : deviation > 0.3 ? 'medium' : 'low';

    return { anomaly, expected, deviation, severity };
  }
}