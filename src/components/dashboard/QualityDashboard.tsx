// src/components/dashboard/QualityDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { QualityIntelligenceEngine } from '@/lib/ai/QualityIntelligenceEngine';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface QualityDashboardProps {
  projectId: string;
  timeRange: '7d' | '30d' | '90d';
  onRefresh?: () => void;
}

interface QualityAnalysis {
  metrics: any;
  trends: any;
  predictions: any;
  insights: any;
  recommendations: any;
  confidence: number;
}

export function QualityDashboard({ projectId, timeRange, onRefresh }: QualityDashboardProps) {
  const [qualityAnalysis, setQualityAnalysis] = useState<QualityAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<string>('overview');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const qualityEngine = new QualityIntelligenceEngine();

  useEffect(() => {
    loadQualityAnalysis();
  }, [projectId, timeRange]);

  const loadQualityAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const analysis = await qualityEngine.analyzeQualityLandscape();
      setQualityAnalysis(analysis);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load quality analysis';
      setError(errorMessage);
      console.error('Failed to load quality analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadQualityAnalysis();
    onRefresh?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg">Analyzing quality landscape...</div>
          <div className="text-sm text-muted-foreground mt-2">
            This may take a few moments
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 p-6 rounded-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-medium">Quality Analysis Unavailable</span>
            </div>
            <div className="text-red-700 mb-4">{error}</div>
            <div className="text-sm text-red-600 bg-red-100 p-3 rounded">
              <strong>What this means:</strong> The quality analysis tools are not currently providing data.
              This could be due to missing dependencies, configuration issues, or tool failures.
              Check the server logs for detailed error information.
            </div>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="ml-4">
            Retry Analysis
          </Button>
        </div>
      </div>
    );
  }

  if (!qualityAnalysis) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No quality data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quality Intelligence Dashboard</h1>
          <p className="text-muted-foreground">
            AI-powered quality analysis and insights
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Badge variant="outline" className="text-xs">
            {qualityAnalysis ? 'Live Analysis' : 'Analysis Pending'}
          </Badge>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Quality Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Overall Quality Score
            <Badge variant={getQualityBadgeVariant(qualityAnalysis.insights.overallScore)}>
              {qualityAnalysis.insights.overallScore}/100
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress
            value={qualityAnalysis.insights.overallScore}
            className="mb-4"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {qualityAnalysis.insights.passingChecks}
              </div>
              <div className="text-sm text-muted-foreground">Passing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {qualityAnalysis.insights.warningChecks}
              </div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {qualityAnalysis.insights.failingChecks}
              </div>
              <div className="text-sm text-muted-foreground">Failing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {qualityAnalysis.insights.totalChecks}
              </div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Early Warnings */}
      {qualityAnalysis.predictions.earlyWarnings.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Early Warning Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {qualityAnalysis.predictions.earlyWarnings.map((warning: any, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-orange-900">{warning.message}</div>
                    <div className="text-sm text-orange-700 mt-1">
                      Dimension: {warning.dimension} | Action Required: {warning.actionRequired}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quality Dimensions Tabs */}
      <Tabs value={selectedDimension} onValueChange={setSelectedDimension}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
          <TabsTrigger value="scalability">Scalability</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <QualityOverview analysis={qualityAnalysis} />
        </TabsContent>

        <TabsContent value="code">
          <CodeQualityView metrics={qualityAnalysis.metrics.code} trends={qualityAnalysis.trends.codeTrends} />
        </TabsContent>

        <TabsContent value="architecture">
          <ArchitectureQualityView metrics={qualityAnalysis.metrics.architecture} trends={qualityAnalysis.trends.architectureTrends} />
        </TabsContent>

        <TabsContent value="security">
          <SecurityQualityView metrics={qualityAnalysis.metrics.security} trends={qualityAnalysis.trends.securityTrends} />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceQualityView metrics={qualityAnalysis.metrics.performance} trends={qualityAnalysis.trends.performanceTrends} />
        </TabsContent>

        <TabsContent value="accessibility">
          <AccessibilityQualityView metrics={qualityAnalysis.metrics.accessibility} trends={qualityAnalysis.trends.accessibilityTrends} />
        </TabsContent>

        <TabsContent value="scalability">
          <ScalabilityQualityView metrics={qualityAnalysis.metrics.scalability} trends={qualityAnalysis.trends.scalabilityTrends} />
        </TabsContent>
      </Tabs>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {qualityAnalysis.recommendations.slice(0, 5).map((rec: any, index: number) => (
              <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                <Badge variant={getRecommendationPriorityVariant(rec.priority)} className="mt-1">
                  {rec.priority}
                </Badge>
                <div className="flex-1">
                  <h4 className="font-medium">{rec.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>Impact: {rec.estimatedImpact}</span>
                    <span>Effort: {rec.estimatedEffort}</span>
                  </div>
                  {rec.actions && rec.actions.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Suggested Actions:</div>
                      <ul className="text-xs space-y-1">
                        {rec.actions.slice(0, 2).map((action: string, actionIndex: number) => (
                          <li key={actionIndex} className="flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getQualityBadgeVariant(score: number): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 90) return "default";
  if (score >= 70) return "secondary";
  if (score >= 50) return "outline";
  return "destructive";
}

function getRecommendationPriorityVariant(priority: string): "default" | "secondary" | "destructive" {
  switch (priority.toLowerCase()) {
    case 'critical': return "destructive";
    case 'high': return "default";
    case 'medium': return "secondary";
    default: return "secondary";
  }
}

function QualityOverview({ analysis }: { analysis: QualityAnalysis }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Quality Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quality Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(analysis.trends).map(([key, trend]: [string, any]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm capitalize">{key.replace('Trends', '')}</span>
                <div className="flex items-center space-x-2">
                  {trend.trend === 'improving' && <TrendingUp className="h-4 w-4 text-green-600" />}
                  {trend.trend === 'declining' && <TrendingDown className="h-4 w-4 text-red-600" />}
                  <span className={`text-sm ${
                    trend.trend === 'improving' ? 'text-green-600' :
                    trend.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {trend.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Overall Risk</span>
              <Badge variant={
                analysis.predictions.riskAssessment.overall === 'critical' ? 'destructive' :
                analysis.predictions.riskAssessment.overall === 'high' ? 'default' : 'secondary'
              }>
                {analysis.predictions.riskAssessment.overall}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Based on current metrics and predictions
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Weaknesses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.insights.strengths.slice(0, 2).map((strength: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">{strength}</span>
              </div>
            ))}
            {analysis.insights.weaknesses.slice(0, 2).map((weakness: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm">{weakness}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CodeQualityView({ metrics, trends }: { metrics: any, trends: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.score}</div>
            <p className="text-xs text-muted-foreground">Quality Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.issues}</div>
            <p className="text-xs text-muted-foreground">Issues Found</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.coverage}%</div>
            <p className="text-xs text-muted-foreground">Test Coverage</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {trends.trend === 'improving' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : trends.trend === 'declining' ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : (
                <div className="h-4 w-4 rounded-full bg-gray-400" />
              )}
              <span className="capitalize">{trends.trend}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Slope: {trends.slope.toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ArchitectureQualityView({ metrics, trends }: { metrics: any, trends: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.score}</div>
            <p className="text-xs text-muted-foreground">Architecture Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.complexity.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Complexity</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.maintainability}</div>
            <p className="text-xs text-muted-foreground">Maintainability</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Architecture Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {trends.trend === 'improving' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : trends.trend === 'declining' ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : (
                <div className="h-4 w-4 rounded-full bg-gray-400" />
              )}
              <span className="capitalize">{trends.trend}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SecurityQualityView({ metrics, trends }: { metrics: any, trends: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.score}</div>
            <p className="text-xs text-muted-foreground">Security Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.issues}</div>
            <p className="text-xs text-muted-foreground">Security Issues</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.coverage}%</div>
            <p className="text-xs text-muted-foreground">Coverage</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PerformanceQualityView({ metrics, trends }: { metrics: any, trends: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.score}</div>
            <p className="text-xs text-muted-foreground">Performance Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.issues}</div>
            <p className="text-xs text-muted-foreground">Performance Issues</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.complexity.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Complexity</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AccessibilityQualityView({ metrics, trends }: { metrics: any, trends: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.score}</div>
            <p className="text-xs text-muted-foreground">Accessibility Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.issues}</div>
            <p className="text-xs text-muted-foreground">Accessibility Issues</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.coverage}%</div>
            <p className="text-xs text-muted-foreground">Coverage</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ScalabilityQualityView({ metrics, trends }: { metrics: any, trends: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.score}</div>
            <p className="text-xs text-muted-foreground">Scalability Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.issues}</div>
            <p className="text-xs text-muted-foreground">Scalability Issues</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.complexity.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Complexity</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}