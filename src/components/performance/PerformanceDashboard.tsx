// src/components/performance/PerformanceDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PredictivePerformanceEngine } from '@/lib/performance/PredictivePerformanceEngine';
import { AnomalyDetectionEngine } from '@/lib/performance/AnomalyDetectionEngine';

interface PerformanceDashboardProps {
  system: any;
  timeRange: '24h' | '7d' | '30d';
}

interface PerformanceAnalysis {
  predictions: any;
  anomalies: any;
  overallScore: number;
  lastUpdated: Date;
}

export function PerformanceDashboard({ system, timeRange }: PerformanceDashboardProps) {
  const [performanceAnalysis, setPerformanceAnalysis] = useState<PerformanceAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  const predictiveEngine = new PredictivePerformanceEngine();
  const anomalyEngine = new AnomalyDetectionEngine();

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
       errorRate: { mean: 0.01, threshold: 0.05 },
       resourceUsage: { cpu: 70, memory: 80 }
     };

     const anomalies = await anomalyEngine.detectPerformanceAnomalies(historicalMetrics, baseline);

     setPerformanceAnalysis({
       predictions,
       anomalies,
       overallScore: calculateOverallPerformanceScore({ predictions, anomalies }),
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

      {/* Performance Predictions */}
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

      {/* Performance Anomalies */}
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
                {performanceAnalysis.anomalies.recommendations.map((rec: string, index: number) => (
                  <div key={index} className="p-2 border rounded">
                    {rec}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
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
      }
    });
  }

  return metrics;
}