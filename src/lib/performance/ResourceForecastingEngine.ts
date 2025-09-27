// src/lib/performance/ResourceForecastingEngine.ts
import { PerformanceMetrics, PerformancePredictions, SystemArchitecture } from './PredictivePerformanceEngine';

export interface ResourceAllocation {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
}

export interface BusinessRequirements {
  availability: number;
  performance: number;
  cost: number;
}

export interface ResourceRequirements {
  cpu: number;
  memory: number;
  storage: number;
}

export interface OptimizedAllocation {
  allocation: ResourceAllocation;
  costSavings: number;
  performanceImpact: number;
  availabilityImpact: number;
}

export interface ResourceForecast {
  requirements: ResourceRequirements;
  optimizedAllocation: OptimizedAllocation;
  scalingRecommendations: ScalingRecommendation[];
  riskAssessment: ResourceRiskAssessment;
}

export interface ScalingRecommendation {
  resource: string;
  currentValue: number;
  recommendedValue: number;
  reasoning: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  costImpact: number;
}

export interface ResourceRiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  risks: ResourceRisk[];
  mitigationStrategies: string[];
}

export interface ResourceRisk {
  resource: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  probability: number;
}

export class ResourceForecastingEngine {
  private costOptimizer: CostOptimizer;
  private performanceOptimizer: PerformanceOptimizer;
  private availabilityOptimizer: AvailabilityOptimizer;

  constructor() {
    this.costOptimizer = new CostOptimizer();
    this.performanceOptimizer = new PerformanceOptimizer();
    this.availabilityOptimizer = new AvailabilityOptimizer();
  }

  public async forecastResourceRequirements(
    performancePredictions: PerformancePredictions,
    currentResources: ResourceAllocation,
    businessRequirements: BusinessRequirements
  ): Promise<ResourceForecast> {
    // Forecast CPU requirements
    const cpuForecast = await this.forecastCPURequirements(performancePredictions);

    // Forecast memory requirements
    const memoryForecast = await this.forecastMemoryRequirements(performancePredictions);

    // Forecast storage requirements
    const storageForecast = await this.forecastStorageRequirements(performancePredictions);

    // Optimize resource allocation
    const optimizedAllocation = await this.optimizeResourceAllocation({
      cpu: cpuForecast,
      memory: memoryForecast,
      storage: storageForecast
    }, businessRequirements);

    return {
      requirements: { cpu: cpuForecast, memory: memoryForecast, storage: storageForecast },
      optimizedAllocation,
      scalingRecommendations: await this.generateScalingRecommendations(optimizedAllocation),
      riskAssessment: await this.assessResourceRisks(optimizedAllocation)
    };
  }

  private async forecastCPURequirements(performancePredictions: PerformancePredictions): Promise<number> {
    const currentCPU = 0.6; // 60% average CPU usage
    const predictedLoad = performancePredictions.forecasts.throughput.predicted.reduce((sum, val) => sum + val, 0) /
                         performancePredictions.forecasts.throughput.predicted.length;

    // Simple linear scaling based on throughput predictions
    const scalingFactor = predictedLoad / performancePredictions.forecasts.throughput.current;
    const forecastedCPU = currentCPU * scalingFactor;

    // Add buffer for peak loads
    return Math.min(forecastedCPU * 1.2, 0.95); // Cap at 95% to leave headroom
  }

  private async forecastMemoryRequirements(performancePredictions: PerformancePredictions): Promise<number> {
    const currentMemory = 0.7; // 70% average memory usage
    const predictedConcurrentUsers = performancePredictions.forecasts.throughput.predicted.length * 10; // Assume 10 users per request/sec

    // Memory scales with concurrent users and response time
    const avgResponseTime = performancePredictions.forecasts.responseTime.predicted.reduce((sum, val) => sum + val, 0) /
                           performancePredictions.forecasts.responseTime.predicted.length;

    const scalingFactor = (predictedConcurrentUsers / 100) * (avgResponseTime / 1000);
    const forecastedMemory = currentMemory * (1 + scalingFactor * 0.1);

    return Math.min(forecastedMemory * 1.15, 0.90); // Add 15% buffer, cap at 90%
  }

  private async forecastStorageRequirements(performancePredictions: PerformancePredictions): Promise<number> {
    const currentStorage = 0.5; // 50% storage usage
    const growthRate = 0.05; // 5% monthly growth
    const timeHorizon = performancePredictions.timeHorizon; // days

    // Project storage needs over time horizon
    const monthlyGrowth = growthRate * (timeHorizon / 30);
    const forecastedStorage = currentStorage * (1 + monthlyGrowth);

    return Math.min(forecastedStorage * 1.1, 0.85); // Add 10% buffer, cap at 85%
  }

  private async optimizeResourceAllocation(
    requirements: ResourceRequirements,
    businessReqs: BusinessRequirements
  ): Promise<OptimizedAllocation> {
    // Apply cost optimization
    const costOptimized = await this.costOptimizer.optimizeForCost(requirements);

    // Apply performance optimization
    const performanceOptimized = await this.performanceOptimizer.optimizeForPerformance(costOptimized);

    // Apply availability requirements
    const availabilityOptimized = await this.availabilityOptimizer.optimizeForAvailability(performanceOptimized, businessReqs.availability);

    return {
      allocation: availabilityOptimized,
      costSavings: this.calculateCostSavings(requirements, availabilityOptimized),
      performanceImpact: this.calculatePerformanceImpact(requirements, availabilityOptimized),
      availabilityImpact: this.calculateAvailabilityImpact(availabilityOptimized, businessReqs)
    };
  }

  private async generateScalingRecommendations(optimizedAllocation: OptimizedAllocation): Promise<ScalingRecommendation[]> {
    const recommendations: ScalingRecommendation[] = [];
    const allocation = optimizedAllocation.allocation;

    // CPU recommendations
    if (allocation.cpu > 0.8) {
      recommendations.push({
        resource: 'cpu',
        currentValue: 0.6,
        recommendedValue: allocation.cpu,
        reasoning: 'High CPU utilization detected, scale up to maintain performance',
        priority: allocation.cpu > 0.9 ? 'critical' : 'high',
        costImpact: (allocation.cpu - 0.6) * 1000 // Simplified cost calculation
      });
    }

    // Memory recommendations
    if (allocation.memory > 0.85) {
      recommendations.push({
        resource: 'memory',
        currentValue: 0.7,
        recommendedValue: allocation.memory,
        reasoning: 'High memory utilization detected, scale up to prevent OOM',
        priority: allocation.memory > 0.9 ? 'critical' : 'high',
        costImpact: (allocation.memory - 0.7) * 800
      });
    }

    // Storage recommendations
    if (allocation.storage > 0.8) {
      recommendations.push({
        resource: 'storage',
        currentValue: 0.5,
        recommendedValue: allocation.storage,
        reasoning: 'Storage utilization growing rapidly, plan capacity increase',
        priority: 'medium',
        costImpact: (allocation.storage - 0.5) * 200
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private async assessResourceRisks(optimizedAllocation: OptimizedAllocation): Promise<ResourceRiskAssessment> {
    const risks: ResourceRisk[] = [];
    const allocation = optimizedAllocation.allocation;

    // CPU risk assessment
    if (allocation.cpu > 0.85) {
      risks.push({
        resource: 'cpu',
        riskLevel: allocation.cpu > 0.95 ? 'critical' : 'high',
        description: 'CPU utilization approaching critical levels',
        impact: 'Performance degradation and increased response times',
        probability: allocation.cpu > 0.9 ? 0.9 : 0.7
      });
    }

    // Memory risk assessment
    if (allocation.memory > 0.9) {
      risks.push({
        resource: 'memory',
        riskLevel: 'critical',
        description: 'Memory utilization at critical levels',
        impact: 'Out of memory errors and application crashes',
        probability: 0.95
      });
    }

    // Storage risk assessment
    if (allocation.storage > 0.85) {
      risks.push({
        resource: 'storage',
        riskLevel: 'medium',
        description: 'Storage capacity running low',
        impact: 'Application failures when storage is exhausted',
        probability: 0.6
      });
    }

    const overallRisk = this.calculateOverallRisk(risks);

    return {
      overallRisk,
      risks,
      mitigationStrategies: await this.generateMitigationStrategies(risks)
    };
  }

  private calculateOverallRisk(risks: ResourceRisk[]): 'low' | 'medium' | 'high' | 'critical' {
    if (risks.length === 0) return 'low';

    const criticalCount = risks.filter(r => r.riskLevel === 'critical').length;
    const highCount = risks.filter(r => r.riskLevel === 'high').length;

    if (criticalCount > 0) return 'critical';
    if (highCount > 1) return 'high';
    if (highCount === 1 || risks.filter(r => r.riskLevel === 'medium').length > 2) return 'medium';

    return 'low';
  }

  private async generateMitigationStrategies(risks: ResourceRisk[]): Promise<string[]> {
    const strategies: string[] = [];

    for (const risk of risks) {
      switch (risk.resource) {
        case 'cpu':
          strategies.push('Implement auto-scaling for CPU resources');
          strategies.push('Optimize application code for better CPU efficiency');
          break;
        case 'memory':
          strategies.push('Implement memory leak detection and prevention');
          strategies.push('Optimize memory usage patterns in application');
          break;
        case 'storage':
          strategies.push('Implement data archiving strategy');
          strategies.push('Consider storage tiering for cost optimization');
          break;
      }
    }

    return [...new Set(strategies)]; // Remove duplicates
  }

  private calculateCostSavings(original: ResourceRequirements, optimized: ResourceAllocation): number {
    // Simplified cost calculation - in reality would use cloud provider pricing
    const originalCost = original.cpu * 100 + original.memory * 80 + original.storage * 20;
    const optimizedCost = optimized.cpu * 100 + optimized.memory * 80 + optimized.storage * 20;

    return Math.max(0, originalCost - optimizedCost);
  }

  private calculatePerformanceImpact(original: ResourceRequirements, optimized: ResourceAllocation): number {
    // Simplified performance impact calculation
    const cpuImpact = (optimized.cpu - original.cpu) * 0.1;
    const memoryImpact = (optimized.memory - original.memory) * 0.15;
    const storageImpact = (optimized.storage - original.storage) * 0.05;

    return Math.max(-0.5, Math.min(0.5, cpuImpact + memoryImpact + storageImpact));
  }

  private calculateAvailabilityImpact(optimized: ResourceAllocation, businessReqs: BusinessRequirements): number {
    // Higher resource allocation generally improves availability
    const resourceScore = (optimized.cpu + optimized.memory + optimized.storage) / 3;
    const targetAvailability = businessReqs.availability;

    return Math.min(0.2, resourceScore * targetAvailability * 0.1);
  }
}

// Supporting classes with simplified implementations
class CostOptimizer {
  async optimizeForCost(requirements: ResourceRequirements): Promise<ResourceRequirements> {
    // Apply cost optimization strategies
    return {
      cpu: Math.max(requirements.cpu * 0.9, 0.3), // Reduce by 10% but not below 30%
      memory: Math.max(requirements.memory * 0.95, 0.4), // Reduce by 5% but not below 40%
      storage: requirements.storage // Storage optimization is more complex
    };
  }
}

class PerformanceOptimizer {
  async optimizeForPerformance(requirements: ResourceRequirements): Promise<ResourceRequirements> {
    // Apply performance optimization strategies
    return {
      cpu: Math.min(requirements.cpu * 1.1, 0.95), // Increase by 10% but not above 95%
      memory: Math.min(requirements.memory * 1.05, 0.90), // Increase by 5% but not above 90%
      storage: requirements.storage
    };
  }
}

class AvailabilityOptimizer {
  async optimizeForAvailability(requirements: ResourceRequirements, targetAvailability: number): Promise<ResourceAllocation> {
    // Adjust based on availability requirements
    const availabilityMultiplier = targetAvailability > 0.99 ? 1.2 : targetAvailability > 0.95 ? 1.1 : 1.0;

    return {
      cpu: Math.min(requirements.cpu * availabilityMultiplier, 0.95),
      memory: Math.min(requirements.memory * availabilityMultiplier, 0.90),
      storage: Math.min(requirements.storage * availabilityMultiplier, 0.85),
      network: 0.7 // Simplified network allocation
    };
  }
}