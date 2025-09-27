// src/lib/performance/CapacityPlanningEngine.ts
import { PerformanceForecasts, ResourceCapacity, BusinessGrowthProjection, BudgetConstraints } from './PredictivePerformanceEngine';

export interface CapacityRequirements {
  userLoad: UserLoadProjection;
  resources: ResourceCapacity;
  buffered: BufferedCapacity;
  confidence: number;
}

export interface UserLoadProjection {
  currentUsers: number;
  projectedUsers: number[];
  growthRate: number;
  peakUsage: number;
  seasonalFactors: SeasonalFactor[];
}

export interface SeasonalFactor {
  period: string;
  multiplier: number;
  description: string;
}

export interface BufferedCapacity {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
  bufferPercentage: number;
}

export interface ScalabilityOptions {
  horizontalScaling: ScalingOption;
  verticalScaling: ScalingOption;
  hybridScaling: ScalingOption;
  cloudScaling: ScalingOption;
}

export interface ScalingOption {
  name: string;
  description: string;
  cost: number;
  timeframe: number;
  complexity: 'low' | 'medium' | 'high';
  benefits: string[];
  drawbacks: string[];
}

export interface ScalingStrategies {
  immediate: ScalingStrategy[];
  shortTerm: ScalingStrategy[];
  longTerm: ScalingStrategy[];
}

export interface ScalingStrategy {
  option: ScalingOption;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeframe: number;
  cost: number;
  expectedImprovement: number;
  implementationSteps: string[];
}

export interface CapacityPlan {
  requirements: CapacityRequirements;
  currentCapacity: ResourceCapacity;
  scalingStrategies: ScalingStrategies;
  optimizedPlan: OptimizedCapacityPlan;
  costProjection: CostProjection;
  riskAssessment: CapacityRiskAssessment;
  implementationTimeline: ImplementationTimeline;
}

export interface OptimizedCapacityPlan {
  targetCapacity: ResourceCapacity;
  scalingApproach: string;
  totalCost: number;
  timeframe: number;
  phases: CapacityPhase[];
}

export interface CapacityPhase {
  name: string;
  duration: number;
  capacityChanges: ResourceCapacity;
  cost: number;
  expectedOutcome: string;
}

export interface CostProjection {
  totalCost: number;
  monthlyCost: number;
  costBreakdown: CostBreakdown;
  roiProjection: ROIProjection;
}

export interface CostBreakdown {
  infrastructure: number;
  licensing: number;
  maintenance: number;
  training: number;
  migration: number;
}

export interface ROIProjection {
  paybackPeriod: number; // months
  threeYearROI: number;
  fiveYearROI: number;
  npv: number; // Net Present Value
}

export interface CapacityRiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  risks: CapacityRisk[];
  mitigationStrategies: string[];
}

export interface CapacityRisk {
  area: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  probability: number;
  mitigation: string;
}

export interface ImplementationTimeline {
  phases: TimelinePhase[];
  milestones: TimelineMilestone[];
  dependencies: TimelineDependency[];
}

export interface TimelinePhase {
  name: string;
  startDay: number;
  endDay: number;
  deliverables: string[];
  resources: string[];
}

export interface TimelineMilestone {
  name: string;
  day: number;
  deliverables: string[];
  successCriteria: string[];
}

export interface TimelineDependency {
  phase: string;
  dependsOn: string[];
  risk: 'low' | 'medium' | 'high';
}

export class CapacityPlanningEngine {
  private forecastingModel: ForecastingModel;
  private costModel: CostModel;
  private riskAnalyzer: RiskAnalyzer;

  constructor() {
    this.forecastingModel = new ForecastingModel();
    this.costModel = new CostModel();
    this.riskAnalyzer = new RiskAnalyzer();
  }

  public async createCapacityPlan(
    performanceForecasts: PerformanceForecasts,
    currentCapacity: ResourceCapacity,
    businessGrowth: BusinessGrowthProjection,
    budgetConstraints: BudgetConstraints
  ): Promise<CapacityPlan> {
    // Forecast capacity requirements
    const capacityRequirements = await this.forecastCapacityRequirements(performanceForecasts, businessGrowth);

    // Analyze scalability options
    const scalabilityOptions = await this.analyzeScalabilityOptions(currentCapacity);

    // Generate scaling strategies
    const scalingStrategies = await this.generateScalingStrategies(
      capacityRequirements,
      scalabilityOptions,
      budgetConstraints
    );

    // Optimize capacity plan
    const optimizedPlan = await this.optimizeCapacityPlan(scalingStrategies, budgetConstraints);

    return {
      requirements: capacityRequirements,
      currentCapacity,
      scalingStrategies,
      optimizedPlan,
      costProjection: await this.costModel.projectCosts(optimizedPlan),
      riskAssessment: await this.riskAnalyzer.assessCapacityRisks(optimizedPlan),
      implementationTimeline: this.createImplementationTimeline(optimizedPlan)
    };
  }

  private async forecastCapacityRequirements(
    forecasts: PerformanceForecasts,
    growth: BusinessGrowthProjection
  ): Promise<CapacityRequirements> {
    // Calculate user load projections
    const userLoadProjection = this.calculateUserLoadProjection(growth);

    // Calculate resource requirements
    const resourceRequirements = await this.calculateResourceRequirements(forecasts, userLoadProjection);

    // Account for redundancy and buffer
    const bufferedRequirements = this.applyCapacityBuffers(resourceRequirements);

    return {
      userLoad: userLoadProjection,
      resources: resourceRequirements,
      buffered: bufferedRequirements,
      confidence: this.calculateForecastConfidence(forecasts)
    };
  }

  private calculateUserLoadProjection(growth: BusinessGrowthProjection): UserLoadProjection {
    const currentUsers = growth.currentUsers || 1000;
    const growthRate = growth.projectedGrowth || 0.15; // 15% default growth
    const timeHorizon = 90; // days

    const projectedUsers: number[] = [];
    for (let i = 1; i <= timeHorizon; i++) {
      const dailyGrowth = Math.pow(1 + growthRate, i / 365);
      projectedUsers.push(Math.round(currentUsers * dailyGrowth));
    }

    const finalUsers = projectedUsers[projectedUsers.length - 1];
    const peakUsage = finalUsers * 1.3; // 30% peak usage factor

    return {
      currentUsers,
      projectedUsers,
      growthRate,
      peakUsage,
      seasonalFactors: [
        { period: 'holiday-season', multiplier: 1.5, description: 'Holiday season peak' },
        { period: 'business-hours', multiplier: 1.2, description: 'Business hours peak' },
        { period: 'weekends', multiplier: 0.8, description: 'Weekend lower usage' }
      ]
    };
  }

  private async calculateResourceRequirements(
    forecasts: PerformanceForecasts,
    userLoad: UserLoadProjection
  ): Promise<ResourceCapacity> {
    const avgResponseTime = forecasts.responseTime.predicted.reduce((sum, val) => sum + val, 0) /
                           forecasts.responseTime.predicted.length;
    const avgThroughput = forecasts.throughput.predicted.reduce((sum, val) => sum + val, 0) /
                         forecasts.throughput.predicted.length;
    const avgResourceUsage = forecasts.resourceUsage.predicted.reduce((sum, val) => sum + val, 0) /
                            forecasts.resourceUsage.predicted.length;

    // Calculate CPU requirements based on throughput and response time
    const cpuBase = avgThroughput / 100; // Base CPU per 100 requests/sec
    const cpuResponseFactor = avgResponseTime > 1000 ? 1.2 : 1.0; // Penalty for slow response
    const cpuRequirement = cpuBase * cpuResponseFactor;

    // Calculate memory requirements based on concurrent users
    const memoryBase = userLoad.peakUsage / 1000; // Base memory per 1000 users
    const memoryRequirement = memoryBase * 1.1; // 10% buffer

    // Calculate storage requirements based on data growth
    const storageBase = 100; // Base storage in GB
    const storageGrowth = userLoad.growthRate * 50; // Additional storage per growth rate
    const storageRequirement = storageBase + storageGrowth;

    return {
      cpu: Math.min(cpuRequirement, 0.95),
      memory: Math.min(memoryRequirement, 0.90),
      storage: Math.min(storageRequirement / 1000, 0.85), // Convert to TB
      network: Math.min(avgThroughput / 1000, 0.80) // Network bandwidth in Gbps
    };
  }

  private applyCapacityBuffers(requirements: ResourceCapacity): BufferedCapacity {
    const bufferPercentage = 0.15; // 15% buffer

    return {
      cpu: requirements.cpu * (1 + bufferPercentage),
      memory: requirements.memory * (1 + bufferPercentage),
      storage: requirements.storage * (1 + bufferPercentage),
      network: requirements.network * (1 + bufferPercentage),
      bufferPercentage
    };
  }

  private async analyzeScalabilityOptions(currentCapacity: ResourceCapacity): Promise<ScalabilityOptions> {
    return {
      horizontalScaling: {
        name: 'Horizontal Scaling',
        description: 'Add more servers/instances to distribute load',
        cost: 5000,
        timeframe: 7,
        complexity: 'medium',
        benefits: ['Linear scalability', 'Fault tolerance', 'No downtime upgrades'],
        drawbacks: ['Increased complexity', 'Network overhead', 'License costs']
      },
      verticalScaling: {
        name: 'Vertical Scaling',
        description: 'Increase resources on existing servers',
        cost: 3000,
        timeframe: 3,
        complexity: 'low',
        benefits: ['Simple implementation', 'No architecture changes', 'Lower latency'],
        drawbacks: ['Hardware limits', 'Single point of failure', 'Downtime required']
      },
      hybridScaling: {
        name: 'Hybrid Scaling',
        description: 'Combination of horizontal and vertical scaling',
        cost: 7000,
        timeframe: 14,
        complexity: 'high',
        benefits: ['Optimal resource utilization', 'Best performance', 'Flexible scaling'],
        drawbacks: ['High complexity', 'Management overhead', 'Higher costs']
      },
      cloudScaling: {
        name: 'Cloud Auto-scaling',
        description: 'Dynamic scaling using cloud provider auto-scaling',
        cost: 2000,
        timeframe: 1,
        complexity: 'low',
        benefits: ['Automatic scaling', 'Pay-per-use', 'No upfront investment'],
        drawbacks: ['Vendor lock-in', 'Variable costs', 'Network dependency']
      }
    };
  }

  private async generateScalingStrategies(
    requirements: CapacityRequirements,
    options: ScalabilityOptions,
    budget: BudgetConstraints
  ): Promise<ScalingStrategies> {
    const strategies: ScalingStrategies = {
      immediate: [],
      shortTerm: [],
      longTerm: []
    };

    // Immediate strategies (within 30 days)
    if (requirements.buffered.cpu > 0.8) {
      strategies.immediate.push({
        option: options.cloudScaling,
        priority: 'critical',
        timeframe: 1,
        cost: 2000,
        expectedImprovement: 0.3,
        implementationSteps: [
          'Configure cloud auto-scaling rules',
          'Set up monitoring and alerts',
          'Test scaling policies'
        ]
      });
    }

    // Short-term strategies (30-90 days)
    if (requirements.userLoad.projectedUsers[30] > requirements.userLoad.currentUsers * 1.5) {
      strategies.shortTerm.push({
        option: options.horizontalScaling,
        priority: 'high',
        timeframe: 30,
        cost: 5000,
        expectedImprovement: 0.5,
        implementationSteps: [
          'Design load balancer configuration',
          'Set up instance templates',
          'Implement health checks'
        ]
      });
    }

    // Long-term strategies (beyond 90 days)
    if (requirements.userLoad.projectedUsers[89] > requirements.userLoad.currentUsers * 2) {
      strategies.longTerm.push({
        option: options.hybridScaling,
        priority: 'medium',
        timeframe: 90,
        cost: 7000,
        expectedImprovement: 0.7,
        implementationSteps: [
          'Architect hybrid scaling solution',
          'Implement monitoring and automation',
          'Train operations team'
        ]
      });
    }

    return strategies;
  }

  private async optimizeCapacityPlan(
    strategies: ScalingStrategies,
    budget: BudgetConstraints
  ): Promise<OptimizedCapacityPlan> {
    // Select optimal strategies based on budget and requirements
    const selectedStrategies = [
      ...strategies.immediate,
      ...strategies.shortTerm.filter(s => s.cost <= budget.monthlyBudget * 0.5),
      ...strategies.longTerm.filter(s => s.cost <= budget.monthlyBudget * 0.3)
    ];

    const totalCost = selectedStrategies.reduce((sum, s) => sum + s.cost, 0);
    const avgTimeframe = selectedStrategies.reduce((sum, s) => sum + s.timeframe, 0) / selectedStrategies.length;

    // Create implementation phases
    const phases = this.createCapacityPhases(selectedStrategies);

    return {
      targetCapacity: this.calculateTargetCapacity(selectedStrategies),
      scalingApproach: selectedStrategies.length > 0 ? selectedStrategies[0].option.name : 'No scaling required',
      totalCost,
      timeframe: avgTimeframe,
      phases
    };
  }

  private createCapacityPhases(strategies: ScalingStrategy[]): CapacityPhase[] {
    const phases: CapacityPhase[] = [];
    let currentDay = 0;

    // Group strategies by timeframe
    const immediateStrategies = strategies.filter(s => s.timeframe <= 7);
    const shortTermStrategies = strategies.filter(s => s.timeframe > 7 && s.timeframe <= 30);
    const longTermStrategies = strategies.filter(s => s.timeframe > 30);

    if (immediateStrategies.length > 0) {
      phases.push({
        name: 'Immediate Scaling',
        duration: 7,
        capacityChanges: this.calculateCapacityIncrease(immediateStrategies),
        cost: immediateStrategies.reduce((sum, s) => sum + s.cost, 0),
        expectedOutcome: 'Handle current capacity constraints'
      });
      currentDay = 7;
    }

    if (shortTermStrategies.length > 0) {
      phases.push({
        name: 'Short-term Optimization',
        duration: 30,
        capacityChanges: this.calculateCapacityIncrease(shortTermStrategies),
        cost: shortTermStrategies.reduce((sum, s) => sum + s.cost, 0),
        expectedOutcome: 'Support projected growth for next 30 days'
      });
      currentDay = 30;
    }

    if (longTermStrategies.length > 0) {
      phases.push({
        name: 'Long-term Scaling',
        duration: 90,
        capacityChanges: this.calculateCapacityIncrease(longTermStrategies),
        cost: longTermStrategies.reduce((sum, s) => sum + s.cost, 0),
        expectedOutcome: 'Support sustained growth beyond 90 days'
      });
    }

    return phases;
  }

  private calculateCapacityIncrease(strategies: ScalingStrategy[]): ResourceCapacity {
    const avgImprovement = strategies.reduce((sum, s) => sum + s.expectedImprovement, 0) / strategies.length;

    return {
      cpu: avgImprovement * 0.3,
      memory: avgImprovement * 0.25,
      storage: avgImprovement * 0.2,
      network: avgImprovement * 0.15
    };
  }

  private calculateTargetCapacity(strategies: ScalingStrategy[]): ResourceCapacity {
    const baseCapacity: ResourceCapacity = { cpu: 0.6, memory: 0.7, storage: 0.5, network: 0.7 };
    const capacityIncrease = this.calculateCapacityIncrease(strategies);

    return {
      cpu: Math.min(baseCapacity.cpu + capacityIncrease.cpu, 0.95),
      memory: Math.min(baseCapacity.memory + capacityIncrease.memory, 0.90),
      storage: Math.min(baseCapacity.storage + capacityIncrease.storage, 0.85),
      network: Math.min(baseCapacity.network + capacityIncrease.network, 0.80)
    };
  }

  private calculateForecastConfidence(forecasts: PerformanceForecasts): number {
    const responseTimeConfidence = forecasts.responseTime.confidence.reduce((sum, c) => sum + c, 0) /
                                  forecasts.responseTime.confidence.length;
    const throughputConfidence = forecasts.throughput.confidence.reduce((sum, c) => sum + c, 0) /
                               forecasts.throughput.confidence.length;
    const resourceConfidence = forecasts.resourceUsage.confidence.reduce((sum, c) => sum + c, 0) /
                              forecasts.resourceUsage.confidence.length;

    return (responseTimeConfidence + throughputConfidence + resourceConfidence) / 3;
  }

  private createImplementationTimeline(optimizedPlan: OptimizedCapacityPlan): ImplementationTimeline {
    const phases: TimelinePhase[] = [];
    const milestones: TimelineMilestone[] = [];
    const dependencies: TimelineDependency[] = [];

    let currentDay = 0;

    for (let i = 0; i < optimizedPlan.phases.length; i++) {
      const phase = optimizedPlan.phases[i];
      const startDay = currentDay;
      const endDay = currentDay + phase.duration;

      phases.push({
        name: phase.name,
        startDay,
        endDay,
        deliverables: [`${phase.name} implementation`, 'Testing and validation'],
        resources: ['Infrastructure team', 'Operations team']
      });

      milestones.push({
        name: `${phase.name} Complete`,
        day: endDay,
        deliverables: [phase.expectedOutcome],
        successCriteria: [
          'Capacity metrics meet targets',
          'Performance tests pass',
          'No regression in existing functionality'
        ]
      });

      if (i > 0) {
        dependencies.push({
          phase: phase.name,
          dependsOn: [optimizedPlan.phases[i - 1].name],
          risk: 'medium'
        });
      }

      currentDay = endDay;
    }

    return {
      phases,
      milestones,
      dependencies
    };
  }
}

// Supporting classes with simplified implementations
class ForecastingModel {
  async predictResourceNeeds(historicalData: any[], timeHorizon: number): Promise<any> {
    // Simplified forecasting implementation
    return {
      predicted: Array(timeHorizon).fill(0).map((_, i) => i * 0.1),
      confidence: Array(timeHorizon).fill(0.8)
    };
  }
}

class CostModel {
  async projectCosts(plan: OptimizedCapacityPlan): Promise<CostProjection> {
    const monthlyCost = plan.totalCost / (plan.timeframe / 30);

    return {
      totalCost: plan.totalCost,
      monthlyCost,
      costBreakdown: {
        infrastructure: plan.totalCost * 0.6,
        licensing: plan.totalCost * 0.2,
        maintenance: plan.totalCost * 0.1,
        training: plan.totalCost * 0.05,
        migration: plan.totalCost * 0.05
      },
      roiProjection: {
        paybackPeriod: 6,
        threeYearROI: 2.5,
        fiveYearROI: 4.2,
        npv: plan.totalCost * 3.5
      }
    };
  }
}

class RiskAnalyzer {
  async assessCapacityRisks(plan: OptimizedCapacityPlan): Promise<CapacityRiskAssessment> {
    const risks: CapacityRisk[] = [];

    if (plan.totalCost > 50000) {
      risks.push({
        area: 'budget',
        riskLevel: 'medium',
        description: 'High implementation cost may exceed budget',
        impact: 'Project delays or reduced scope',
        probability: 0.3,
        mitigation: 'Phased implementation with budget checkpoints'
      });
    }

    if (plan.timeframe > 90) {
      risks.push({
        area: 'timeline',
        riskLevel: 'medium',
        description: 'Long implementation timeframe increases risk of changes',
        impact: 'Requirements may change during implementation',
        probability: 0.4,
        mitigation: 'Regular reviews and agile approach'
      });
    }

    const overallRisk = risks.length === 0 ? 'low' :
                      risks.filter(r => r.riskLevel === 'critical').length > 0 ? 'critical' :
                      risks.filter(r => r.riskLevel === 'high').length > 0 ? 'high' : 'medium';

    return {
      overallRisk,
      risks,
      mitigationStrategies: risks.map(r => r.mitigation)
    };
  }
}