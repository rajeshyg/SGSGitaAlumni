// src/components/security/SecurityDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, XCircle } from 'lucide-react';
import { ThreatModelingEngine, type ApplicationArchitecture } from '@/lib/security/ThreatModelingEngine';
import { VulnerabilityPredictionEngine, type Codebase } from '@/lib/security/VulnerabilityPredictionEngine';
import { ZeroTrustEngine, type SystemArchitecture } from '@/lib/security/ZeroTrustEngine';
import { SecurityChaosEngine } from '@/lib/security/SecurityChaosEngine';
import { PrivacyAssessmentEngine } from '@/lib/security/PrivacyAssessmentEngine';
import { ComplianceAutomationEngine } from '@/lib/security/ComplianceAutomationEngine';

interface SecurityDashboardProps {
  system: SystemArchitecture & { dataFlows?: any[] };
  codebase: Codebase;
  applicationArchitecture: ApplicationArchitecture;
  timeRange: '24h' | '7d' | '30d';
}

interface SecurityAssessment {
  threatModel: any;
  vulnerabilityPredictions: any;
  zeroTrustAssessment: any;
  privacyAssessment: any;
  complianceReport: any;
  chaosResults: any;
  overallScore: number;
  lastUpdated: Date;
}

export function SecurityDashboard({
  system,
  codebase,
  applicationArchitecture,
  timeRange
}: SecurityDashboardProps) {
  const [securityAssessment, setSecurityAssessment] = useState<SecurityAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<string>('overview');
  const [runningAssessment, setRunningAssessment] = useState(false);

  // Initialize security engines
  const threatEngine = new ThreatModelingEngine();
  const vulnerabilityEngine = new VulnerabilityPredictionEngine();
  const zeroTrustEngine = new ZeroTrustEngine();
  const chaosEngine = new SecurityChaosEngine();
  const privacyEngine = new PrivacyAssessmentEngine();
  const complianceEngine = new ComplianceAutomationEngine();

  useEffect(() => {
    loadSecurityAssessment();
  }, [system, codebase, applicationArchitecture, timeRange]);

  const loadSecurityAssessment = async () => {
    try {
      setLoading(true);

      // Run all security assessments in parallel
      const [
        threatModel,
        vulnerabilityPredictions,
        zeroTrustAssessment,
        privacyAssessment,
        complianceReport,
        chaosResults
      ] = await Promise.all([
        threatEngine.generateThreatModel(applicationArchitecture),
        vulnerabilityEngine.predictVulnerabilities(codebase, []),
        zeroTrustEngine.validateZeroTrustCompliance(system, system.accessPatterns || []),
        privacyEngine.assessPrivacyImpact(system, system.dataFlows || []),
        complianceEngine.automateComplianceValidation(system, []),
        chaosEngine.runSecurityChaosExperiments(system, [])
      ]);

      const assessment: SecurityAssessment = {
        threatModel,
        vulnerabilityPredictions,
        zeroTrustAssessment,
        privacyAssessment,
        complianceReport,
        chaosResults,
        overallScore: calculateOverallSecurityScore({
          threatModel,
          vulnerabilityPredictions,
          zeroTrustAssessment,
          privacyAssessment,
          complianceReport,
          chaosResults
        }),
        lastUpdated: new Date()
      };

      setSecurityAssessment(assessment);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load security assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const runNewAssessment = async () => {
    setRunningAssessment(true);
    await loadSecurityAssessment();
    setRunningAssessment(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-blue-500 animate-pulse" />
          <div className="mt-4 text-lg">Analyzing security posture...</div>
          <div className="mt-2 text-sm text-muted-foreground">This may take a few minutes</div>
        </div>
      </div>
    );
  }

  if (!securityAssessment) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <div className="mt-4 text-lg">Failed to load security assessment</div>
          <Button onClick={runNewAssessment} className="mt-4">
            Retry Assessment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Last updated: {securityAssessment.lastUpdated.toLocaleString()}
          </p>
        </div>
        <Button
          onClick={runNewAssessment}
          disabled={runningAssessment}
          variant="outline"
        >
          {runningAssessment ? 'Running...' : 'Run New Assessment'}
        </Button>
      </div>

      {/* Overall Security Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Posture Score
            </div>
            <Badge variant={getSecurityBadgeVariant(securityAssessment.overallScore)}>
              {securityAssessment.overallScore}/100
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress
            value={securityAssessment.overallScore}
            className="mb-4"
          />

          {/* Security Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {securityAssessment.threatModel.threatScenarios.filter((t: any) => t.likelihood > 0.7).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">High Risk Threats</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {securityAssessment.vulnerabilityPredictions.predictions.filter((v: any) => v.priority > 7).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Critical Vulnerabilities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((securityAssessment.zeroTrustAssessment.overallCompliance || 0) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Zero Trust Compliance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {securityAssessment.threatModel.mitigations.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Active Mitigations</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      {getSecurityAlerts(securityAssessment).map((alert, index) => (
        <div key={index} className={`p-4 border rounded-lg ${alert.type === 'critical' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <div>
              <strong>{alert.type === 'critical' ? 'Critical' : 'Warning'}:</strong> {alert.message}
              <br />
              <span className="text-sm text-muted-foreground">
                {alert.details}
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* Detailed Security Views */}
      <Tabs value={selectedView} onValueChange={setSelectedView}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="threats">Threat Model</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
          <TabsTrigger value="zero-trust">Zero Trust</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="chaos">Chaos Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="threats">
          <ThreatModelView threatModel={securityAssessment.threatModel} />
        </TabsContent>

        <TabsContent value="vulnerabilities">
          <VulnerabilityView predictions={securityAssessment.vulnerabilityPredictions} />
        </TabsContent>

        <TabsContent value="zero-trust">
          <ZeroTrustView assessment={securityAssessment.zeroTrustAssessment} />
        </TabsContent>

        <TabsContent value="privacy">
          <PrivacyView assessment={securityAssessment.privacyAssessment} />
        </TabsContent>

        <TabsContent value="compliance">
          <ComplianceView report={securityAssessment.complianceReport} />
        </TabsContent>

        <TabsContent value="chaos">
          <ChaosView results={securityAssessment.chaosResults} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Components
function ThreatModelView({ threatModel }: { threatModel: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Threat Model Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{threatModel.threatScenarios.length}</div>
              <div className="text-sm text-muted-foreground">Total Threats</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {threatModel.threatScenarios.filter((t: any) => t.likelihood > 0.7).length}
              </div>
              <div className="text-sm text-muted-foreground">High Risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {threatModel.mitigations.length}
              </div>
              <div className="text-sm text-muted-foreground">Mitigations</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Top Threats</h4>
            {threatModel.threatScenarios.slice(0, 5).map((threat: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <div className="font-medium">{threat.title}</div>
                  <div className="text-sm text-muted-foreground">{threat.category}</div>
                </div>
                <Badge variant={threat.likelihood > 0.7 ? 'destructive' : 'secondary'}>
                  {(threat.likelihood * 100).toFixed(0)}% risk
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function VulnerabilityView({ predictions }: { predictions: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vulnerability Predictions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {predictions.predictions.filter((p: any) => p.severity === 'critical').length}
              </div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {predictions.predictions.filter((p: any) => p.severity === 'high').length}
              </div>
              <div className="text-sm text-muted-foreground">High</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {predictions.predictions.filter((p: any) => p.severity === 'medium').length}
              </div>
              <div className="text-sm text-muted-foreground">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {predictions.predictions.filter((p: any) => p.severity === 'low').length}
              </div>
              <div className="text-sm text-muted-foreground">Low</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Predicted Vulnerabilities</h4>
            {predictions.predictions.slice(0, 5).map((pred: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <div className="font-medium">{pred.type}</div>
                  <div className="text-sm text-muted-foreground">{pred.description}</div>
                </div>
                <Badge variant={getSeverityVariant(pred.severity)}>
                  {pred.severity}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ZeroTrustView({ assessment }: { assessment: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Zero Trust Assessment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((assessment.overallCompliance || 0) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Overall Compliance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {assessment.gaps?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Compliance Gaps</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {assessment.recommendations?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Recommendations</div>
            </div>
          </div>

          {assessment.gaps && assessment.gaps.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Compliance Gaps</h4>
              {assessment.gaps.slice(0, 3).map((gap: any, index: number) => (
                <div key={index} className="p-2 border rounded border-red-200 bg-red-50">
                  <div className="font-medium">{gap.area}</div>
                  <div className="text-sm text-muted-foreground">{gap.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PrivacyView({ assessment }: { assessment: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Assessment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {assessment.piiDetection?.instances.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">PII Instances</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {assessment.complianceStatus?.overall ? 'Compliant' : 'Needs Work'}
              </div>
              <div className="text-sm text-muted-foreground">Compliance Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {assessment.recommendations?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Recommendations</div>
            </div>
          </div>

          {assessment.piiDetection?.categories && (
            <div className="space-y-2">
              <h4 className="font-semibold">PII Categories Detected</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(assessment.piiDetection.categories).map(([category, count]) => (
                  <Badge key={category} variant="outline">
                    {category}: {count as number}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ComplianceView({ report }: { report: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((report.overallCompliance || 0) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Overall Compliance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {report.gaps?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Compliance Gaps</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {report.regulationResults?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Regulations Checked</div>
            </div>
          </div>

          {report.gaps && report.gaps.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Top Compliance Gaps</h4>
              {report.gaps.slice(0, 3).map((gap: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <div className="font-medium">{gap.regulation}: {gap.requirement}</div>
                    <div className="text-sm text-muted-foreground">{gap.description}</div>
                  </div>
                  <Badge variant={getSeverityVariant(gap.severity)}>
                    {gap.severity}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ChaosView({ results }: { results: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chaos Testing Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((results.overallResilience || 0) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">System Resilience</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {results.vulnerabilities?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Vulnerabilities Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {results.experiments?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Tests Run</div>
            </div>
          </div>

          {results.recommendations && results.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Chaos Testing Recommendations</h4>
              {results.recommendations.slice(0, 3).map((rec: any, index: number) => (
                <div key={index} className="p-2 border rounded">
                  <div className="font-medium">{rec.recommendation}</div>
                  <div className="text-sm text-muted-foreground">{rec.rationale}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions
function getSecurityBadgeVariant(score: number): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 90) return "default";
  if (score >= 70) return "secondary";
  if (score >= 50) return "outline";
  return "destructive";
}

function getSeverityVariant(severity: string): "default" | "secondary" | "destructive" | "outline" {
  switch (severity) {
    case 'critical': return 'destructive';
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
    default: return 'default';
  }
}

function calculateOverallSecurityScore(assessment: any): number {
  const threatScore = assessment.threatModel.residualRisk < 0.3 ? 90 :
                      assessment.threatModel.residualRisk < 0.5 ? 70 : 50;

  const vulnerabilityScore = assessment.vulnerabilityPredictions.predictions.length < 5 ? 90 :
                            assessment.vulnerabilityPredictions.predictions.length < 10 ? 70 : 50;

  const zeroTrustScore = (assessment.zeroTrustAssessment.overallCompliance || 0) * 100;
  const privacyScore = assessment.privacyAssessment.complianceStatus?.overall ? 80 : 60;
  const complianceScore = (assessment.complianceReport.overallCompliance || 0) * 100;
  const chaosScore = (assessment.chaosResults.overallResilience || 0) * 100;

  return Math.round((threatScore + vulnerabilityScore + zeroTrustScore + privacyScore + complianceScore + chaosScore) / 6);
}

function getSecurityAlerts(assessment: SecurityAssessment): Array<{ type: 'critical' | 'warning', message: string, details: string }> {
  const alerts: Array<{ type: 'critical' | 'warning', message: string, details: string }> = [];

  // Critical vulnerabilities
  const criticalVulns = assessment.vulnerabilityPredictions.predictions.filter((v: any) => v.severity === 'critical');
  if (criticalVulns.length > 0) {
    alerts.push({
      type: 'critical',
      message: `${criticalVulns.length} critical vulnerabilities predicted`,
      details: `Next: ${criticalVulns[0]?.predictedDate?.toLocaleDateString()}`
    });
  }

  // High risk threats
  const highRiskThreats = assessment.threatModel.threatScenarios.filter((t: any) => t.likelihood > 0.7);
  if (highRiskThreats.length > 0) {
    alerts.push({
      type: 'warning',
      message: `${highRiskThreats.length} high-risk threats identified`,
      details: 'Requires immediate mitigation planning'
    });
  }

  // Zero trust gaps
  if ((assessment.zeroTrustAssessment.overallCompliance || 0) < 0.8) {
    alerts.push({
      type: 'warning',
      message: 'Zero trust compliance below threshold',
      details: `${assessment.zeroTrustAssessment.gaps?.length || 0} gaps identified`
    });
  }

  return alerts;
}