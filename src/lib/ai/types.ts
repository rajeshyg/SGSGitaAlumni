// src/lib/ai/types.ts

export interface QualityMetrics {
  score: number;
  issues: number;
  coverage: number;
  complexity: number;
  maintainability: number;
  timestamp: Date;
}

export interface QualityTrends {
  codeTrends: TrendAnalysis;
  architectureTrends: TrendAnalysis;
  securityTrends: TrendAnalysis;
  performanceTrends: TrendAnalysis;
  accessibilityTrends: TrendAnalysis;
  scalabilityTrends: TrendAnalysis;
}

export interface TrendAnalysis {
  trend: 'improving' | 'declining' | 'stable';
  slope: number;
  volatility: number;
  prediction: number;
}

export interface QualityPredictions {
  metricForecasts: { [dimension: string]: { [metric: string]: number } };
  issuePredictions: IssuePrediction[];
  riskAssessment: RiskAssessment;
  earlyWarnings: EarlyWarning[];
  timeHorizon: number;
  confidence: number;
}

export interface IssuePrediction {
  dimension: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: number;
  timeToImpact: number;
  description: string;
}

export interface RiskAssessment {
  overall: 'low' | 'medium' | 'high' | 'critical';
  breakdown: { [dimension: string]: RiskBreakdown };
}

export interface RiskBreakdown {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  issues: number;
}

export interface EarlyWarning {
  dimension: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  actionRequired: 'immediate' | 'urgent' | 'scheduled';
}

export interface QualityInsights {
  overallScore: number;
  passingChecks: number;
  warningChecks: number;
  failingChecks: number;
  totalChecks: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface QualityRecommendations {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedImpact: 'Low' | 'Medium' | 'High';
  estimatedEffort: 'Low' | 'Medium' | 'High';
  actions: string[];
}[]

export interface RemediationStrategy {
  issue: QualityIssue;
  strategy: RemediationPlan;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
}

export interface QualityIssue {
  id: string;
  dimension: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  location?: string;
}

export interface RemediationPlan {
  steps: RemediationStep[];
  estimatedDuration: number;
  resourceRequirements: string[];
  successCriteria: string[];
  rollbackPlan?: string;
}

export interface RemediationStep {
  id: string;
  description: string;
  type: 'automated' | 'manual' | 'review';
  duration: number;
  dependencies: string[];
}

export interface DecisionContext {
  situation: string;
  options: DecisionOption[];
  constraints: string[];
  preferences: string[];
  historicalOutcomes?: DecisionOutcome[];
}

export interface DecisionOption {
  id: string;
  description: string;
  pros: string[];
  cons: string[];
  estimatedImpact: number;
  estimatedRisk: number;
}

export interface DecisionOutcome {
  decision: string;
  outcome: 'success' | 'failure' | 'partial';
  impact: number;
  lessons: string[];
}

export interface FeedbackPattern {
  pattern: string;
  frequency: number;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  recommendations: string[];
}

export interface LearningResult {
  patterns: FeedbackPattern[];
  improvements: string[];
  nextActions: string[];
  confidence: number;
}