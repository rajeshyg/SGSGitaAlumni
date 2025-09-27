// src/components/performance/PerformanceDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PredictivePerformanceEngine } from '@/lib/performance/PredictivePerformanceEngine';
import { AnomalyDetectionEngine } from '@/lib/performance/AnomalyDetectionEngine';
import { ResourceForecastingEngine } from '@/lib/performance/ResourceForecastingEngine';
import { OptimizationRecommendationEngine } from '@/lib/performance/OptimizationRecommendationEngine';
import { CapacityPlanningEngine } from '@/lib/performance/CapacityPlanningEngine';
import { UserExperienceCorrelationEngine } from '@/lib/performance/UserExperienceCorrelationEngine';

interface PerformanceDashboardProps {
  system: any;
  timeRange: '24h' | '7d' | '30d';
}

interface PerformanceAnalysis {
  predictions: any;
  anomalies: any;
  resourceForecast?: any;
  optimizationRecommendations?: any;
  capacityPlan?: any;
  uxCorrelation?: any;
  overallScore: number;
  lastUpdated: Date;
}

export function PerformanceDashboard({ system, timeRange }: PerformanceDashboardProps) {
  const [performanceAnalysis, setPerformanceAnalysis] = useState<PerformanceAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  const predictiveEngine = new PredictivePerformanceEngine();
  const anomalyEngine = new AnomalyDetectionEngine();
  const resourceEngine = new ResourceForecastingEngine();
  const optimizationEngine = new OptimizationRecommendationEngine();
  const capacityEngine = new CapacityPlanningEngine();
  const uxEngine = new UserExperienceCorrelationEngine();

 const loadPerformanceAnalysis = useCallback(async () => {
   try {
     setLoading(true);

     // Get historical metrics (mock data for now)
     const historicalMetrics = generateMockMetrics(timeRange);

     // Generate performance predictions
     const predictions = await predictiveEngine.predictPerformanceTrends(historicalMetrics, system);

     // Detect anomalies
     const baseline = {
       responseTime: { mean: 500, stdDev: 100 },
       throughput: { mean: 100, stdDev: 20 },
       resourceUsage: { mean: 75, stdDev: 10 },
       errorRate: { mean: 0.01, stdDev: 0.005 }
     };

     const anomalies = await anomalyEngine.detectPerformanceAnomalies(historicalMetrics, baseline);

     // Generate resource forecast
     const currentResources = {
       cpu: 0.6,
       memory: 0.7,
       storage: 0.5,
       network: 0.7
     };
     const businessRequirements = {
       availability: 0.99,
       performance: 0.8,
       cost: 0.6
     };
     const resourceForecast = await resourceEngine.forecastResourceRequirements(
       predictions,
       currentResources,
       businessRequirements
     );

     // Generate optimization recommendations
     const systemConstraints = {
       budget: 50000,
       timeline: 90,
       technical: ['cloud-native', 'microservices'],
       operational: ['24/7-availability', 'auto-scaling']
     };
     const businessPriorities = {
       userExperience: 0.8,
       costOptimization: 0.6,
       performance: 0.9,
       availability: 0.95
     };
     const optimizationRecommendations = await optimizationEngine.generateOptimizationRecommendations(
       { predictions, anomalies, uxCorrelation: null, overallScore: 0, bottlenecks: [] },
       systemConstraints,
       businessPriorities
     );

     // Generate capacity plan
     const businessGrowth = {
       currentUsers: 1000,
       projectedGrowth: 0.15,
       marketFactors: ['seasonal-demand'],
       seasonalTrends: ['holiday-peaks']
     };
     const budgetConstraints = {
       totalBudget: 100000,
       monthlyBudget: 10000,
       costCenters: ['infrastructure', 'licensing'],
       approvalRequired: true
     };
     const capacityPlan = await capacityEngine.createCapacityPlan(
       predictions.forecasts,
       currentResources,
       businessGrowth,
       budgetConstraints
     );

     // Generate UX correlation (mock user data for now)
     const mockUserBehaviorData = generateMockUserBehaviorData();
     const mockBusinessMetrics = generateMockBusinessMetrics();
     const uxCorrelation = await uxEngine.correlatePerformanceWithUserExperience(
       historicalMetrics,
       mockUserBehaviorData,
       mockBusinessMetrics
     );

     setPerformanceAnalysis({
       predictions,
       anomalies,
       resourceForecast,
       optimizationRecommendations,
       capacityPlan,
       uxCorrelation,
       overallScore: calculateOverallPerformanceScore({
         predictions,
         anomalies,
         resourceForecast,
         optimizationRecommendations,
         capacityPlan,
         uxCorrelation
       }),
       lastUpdated: new Date()
     });
   } catch (error) {
     // eslint-disable-next-line no-console
     console.error('Failed to load performance analysis:', error);
   } finally {
     setLoading(false);
   }
 }, [system, timeRange]);

 useEffect(() => {
   loadPerformanceAnalysis();
 }, [loadPerformanceAnalysis]);

 if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Analyzing performance metrics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Performance Dashboard</h1>
        <p className="text-muted-foreground">
          Last updated: {performanceAnalysis?.lastUpdated.toLocaleString()}
        </p>
      </div>

      {/* Overall Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Performance Health Score
            <Badge variant={getPerformanceBadgeVariant(performanceAnalysis?.overallScore || 0)}>
              {performanceAnalysis?.overallScore || 0}/100
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={performanceAnalysis?.overallScore || 0} className="mb-4" />

          {/* Performance Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {performanceAnalysis?.predictions.forecasts.responseTime.current || 0}ms
              </div>
              <div className="text-sm text-muted-foreground">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {performanceAnalysis?.predictions.forecasts.throughput.current || 0}
              </div>
              <div className="text-sm text-muted-foreground">Requests/sec</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {performanceAnalysis?.anomalies.anomalies.filter((a: any) => a.severity === 'high').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Performance Anomalies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((1 - (performanceAnalysis?.anomalies.falsePositiveRate || 0)) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Detection Accuracy</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Interface for Detailed Analysis */}
      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="capacity">Capacity</TabsTrigger>
          <TabsTrigger value="ux">User Experience</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions">
          <Card>
            <CardHeader>
              <CardTitle>Performance Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Response Time Trend</h4>
                    <p className="text-sm text-muted-foreground">
                      Current: {performanceAnalysis?.predictions.forecasts.responseTime.current}ms
                    </p>
                    <p className="text-sm">
                      90-day forecast: {performanceAnalysis?.predictions.forecasts.responseTime.predicted.slice(-1)[0]}ms
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Throughput Trend</h4>
                    <p className="text-sm text-muted-foreground">
                      Current: {performanceAnalysis?.predictions.forecasts.throughput.current} req/sec
                    </p>
                    <p className="text-sm">
                      90-day forecast: {performanceAnalysis?.predictions.forecasts.throughput.predicted.slice(-1)[0]} req/sec
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold">Prediction Confidence</h4>
                  <Progress value={(performanceAnalysis?.predictions.confidence || 0) * 100} className="mt-2" />
                  <p className="text-sm text-muted-foreground mt-1">
                    {Math.round((performanceAnalysis?.predictions.confidence || 0) * 100)}% confidence
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies">
          <Card>
            <CardHeader>
              <CardTitle>Performance Anomalies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {performanceAnalysis?.anomalies.anomalies.filter((a: any) => a.severity === 'critical').length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Critical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {performanceAnalysis?.anomalies.anomalies.filter((a: any) => a.severity === 'high').length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">High</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {performanceAnalysis?.anomalies.anomalies.filter((a: any) => a.severity === 'medium').length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Medium</div>
                  </div>
                </div>

                {performanceAnalysis?.anomalies.recommendations && performanceAnalysis.anomalies.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Recommendations</h4>
                    {performanceAnalysis.anomalies.recommendations.map((rec: any, index: number) => (
                      <div key={index} className="p-2 border rounded">
                        {rec.action || rec}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Resource Forecasting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">CPU Forecast</h4>
                    <p className="text-sm text-muted-foreground">
                      Current: {(performanceAnalysis?.resourceForecast?.requirements?.cpu * 100 || 0).toFixed(1)}%
                    </p>
                    <p className="text-sm">
                      Optimized: {(performanceAnalysis?.resourceForecast?.optimizedAllocation?.allocation?.cpu * 100 || 0).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Memory Forecast</h4>
                    <p className="text-sm text-muted-foreground">
                      Current: {(performanceAnalysis?.resourceForecast?.requirements?.memory * 100 || 0).toFixed(1)}%
                    </p>
                    <p className="text-sm">
                      Optimized: {(performanceAnalysis?.resourceForecast?.optimizedAllocation?.allocation?.memory * 100 || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {performanceAnalysis?.resourceForecast?.scalingRecommendations && (
                  <div>
                    <h4 className="font-semibold">Scaling Recommendations</h4>
                    {performanceAnalysis.resourceForecast.scalingRecommendations.map((rec: any, index: number) => (
                      <div key={index} className="p-2 border rounded mt-2">
                        <strong>{rec.resource.toUpperCase()}:</strong> {rec.reasoning}
                        <br />
                        <span className="text-sm text-muted-foreground">
                          Priority: {rec.priority}, Cost Impact: ${rec.costImpact}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceAnalysis?.optimizationRecommendations?.recommendations && (
                  <div>
                    <h4 className="font-semibold">Top Recommendations</h4>
                    {performanceAnalysis.optimizationRecommendations.recommendations.slice(0, 3).map((rec: any, index: number) => (
                      <div key={index} className="p-3 border rounded mt-2">
                        <div className="flex justify-between items-center">
                          <strong>{rec.strategy.approach}</strong>
                          <Badge variant={rec.priority === 'high' ? 'default' : 'secondary'}>
                            Priority: {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{rec.strategy.implementation}</p>
                        <p className="text-sm mt-1">
                          Expected Improvement: {(rec.strategy.expectedImprovement * 100).toFixed(1)}% |
                          Cost: ${rec.strategy.cost.toLocaleString()} |
                          Timeframe: {rec.strategy.timeframe} days
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {performanceAnalysis?.optimizationRecommendations?.expectedOutcomes && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold">Expected Outcomes</h4>
                      <ul className="text-sm space-y-1 mt-2">
                        <li>Performance: +{(performanceAnalysis.optimizationRecommendations.expectedOutcomes.performanceImprovement * 100).toFixed(1)}%</li>
                        <li>Cost Reduction: ${(performanceAnalysis.optimizationRecommendations.expectedOutcomes.costReduction).toLocaleString()}</li>
                        <li>Availability: +{(performanceAnalysis.optimizationRecommendations.expectedOutcomes.availabilityImprovement * 100).toFixed(1)}%</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold">Implementation Plan</h4>
                      <p className="text-sm text-muted-foreground">
                        Total Cost: ${performanceAnalysis.optimizationRecommendations.implementationPlan.totalCost.toLocaleString()}
                      </p>
                      <p className="text-sm">
                        Timeframe: {performanceAnalysis.optimizationRecommendations.implementationPlan.totalTimeframe} days
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capacity">
          <Card>
            <CardHeader>
              <CardTitle>Capacity Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Current Capacity</h4>
                    <p className="text-sm text-muted-foreground">CPU: {(performanceAnalysis?.capacityPlan?.currentCapacity?.cpu * 100 || 0).toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Memory: {(performanceAnalysis?.capacityPlan?.currentCapacity?.memory * 100 || 0).toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Storage: {(performanceAnalysis?.capacityPlan?.currentCapacity?.storage * 100 || 0).toFixed(1)}%</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Target Capacity</h4>
                    <p className="text-sm text-muted-foreground">CPU: {(performanceAnalysis?.capacityPlan?.optimizedPlan?.targetCapacity?.cpu * 100 || 0).toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Memory: {(performanceAnalysis?.capacityPlan?.optimizedPlan?.targetCapacity?.memory * 100 || 0).toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Storage: {(performanceAnalysis?.capacityPlan?.optimizedPlan?.targetCapacity?.storage * 100 || 0).toFixed(1)}%</p>
                  </div>
                </div>

                {performanceAnalysis?.capacityPlan?.costProjection && (
                  <div>
                    <h4 className="font-semibold">Cost Projection</h4>
                    <p className="text-sm">Total Cost: ${performanceAnalysis.capacityPlan.costProjection.totalCost.toLocaleString()}</p>
                    <p className="text-sm">Monthly Cost: ${performanceAnalysis.capacityPlan.costProjection.monthlyCost.toLocaleString()}</p>
                    <p className="text-sm">ROI: {(performanceAnalysis.capacityPlan.costProjection.roiProjection.threeYearROI * 100).toFixed(1)}% (3-year)</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ux">
          <Card>
            <CardHeader>
              <CardTitle>User Experience Correlation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">User Satisfaction</h4>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round((performanceAnalysis?.uxCorrelation?.experienceImpact?.overallUserSatisfaction || 0) * 100)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Based on performance correlation</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Performance Influence</h4>
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round((performanceAnalysis?.uxCorrelation?.experienceImpact?.performanceInfluence || 0) * 100)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Impact on user experience</p>
                  </div>
                </div>

                {performanceAnalysis?.uxCorrelation?.experienceImpact?.keyDrivers && (
                  <div>
                    <h4 className="font-semibold">Key Drivers</h4>
                    <ul className="text-sm space-y-1 mt-2">
                      {performanceAnalysis.uxCorrelation.experienceImpact.keyDrivers.map((driver: string, index: number) => (
                        <li key={index} className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {driver}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {performanceAnalysis?.uxCorrelation?.optimizationOpportunities && (
                  <div>
                    <h4 className="font-semibold">Optimization Opportunities</h4>
                    {performanceAnalysis.uxCorrelation.optimizationOpportunities.map((opp: any, index: number) => (
                      <div key={index} className="p-2 border rounded mt-2">
                        <strong>{opp.metric}:</strong> {opp.currentValue} → {opp.targetValue}
                        <br />
                        <span className="text-sm text-muted-foreground">
                          Expected: +{(opp.expectedImprovement * 100).toFixed(1)}% improvement
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getPerformanceBadgeVariant(score: number): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 90) return "default";
  if (score >= 70) return "secondary";
  if (score >= 50) return "outline";
  return "destructive";
}

function calculateOverallPerformanceScore(analysis: any): number {
  const predictionScore = (analysis.predictions.confidence || 0) * 100;
  const anomalyScore = Math.max(0, 100 - (analysis.anomalies.anomalies.length * 5));
  return Math.round((predictionScore + anomalyScore) / 2);
}

function generateMockMetrics(timeRange: string): any[] {
  const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
  const metrics = [];

  for (let i = 0; i < hours; i++) {
    metrics.push({
      timestamp: new Date(Date.now() - i * 60 * 60 * 1000),
      responseTime: 400 + Math.random() * 200, // 400-600ms
      throughput: 80 + Math.random() * 40, // 80-120 req/sec
      errorRate: Math.random() * 0.02, // 0-2% error rate
      resourceUsage: {
        cpu: 60 + Math.random() * 20,
        memory: 70 + Math.random() * 15
      },
      concurrentUsers: 100 + Math.random() * 50
    });
  }

  return metrics;
}

function generateMockUserBehaviorData(): any[] {
  const sessions = 50;
  const userData = [];

  for (let i = 0; i < sessions; i++) {
    userData.push({
      userId: `user_${i}`,
      sessionId: `session_${i}`,
      timestamp: new Date(Date.now() - i * 30 * 60 * 1000),
      pageViews: Math.floor(Math.random() * 10) + 1,
      timeOnPage: Math.floor(Math.random() * 300) + 30, // 30-330 seconds
      bounceRate: Math.random(),
      conversionRate: Math.random() * 0.1,
      userActions: [
        {
          action: 'click',
          timestamp: new Date(),
          duration: Math.random() * 5,
          success: Math.random() > 0.1
        }
      ],
      deviceType: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)],
      browser: ['chrome', 'firefox', 'safari'][Math.floor(Math.random() * 3)],
      location: 'US'
    });
  }

  return userData;
}

function generateMockBusinessMetrics(): any[] {
  const days = 30;
  const metrics = [];

  for (let i = 0; i < days; i++) {
    metrics.push({
      timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      revenue: Math.floor(Math.random() * 10000) + 5000,
      conversionRate: Math.random() * 0.05,
      customerSatisfaction: Math.random() * 0.3 + 0.7,
      retentionRate: Math.random() * 0.2 + 0.8,
      churnRate: Math.random() * 0.05
    });
  }

  return metrics;
}