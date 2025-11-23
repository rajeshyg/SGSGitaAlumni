import { apiClient } from '../../lib/api';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';

interface SubFeature {
  name: string;
  status: string;
}

interface Feature {
  id: string;
  name: string;
  status: string;
  spec: string;
  test: string;
  diagram: string;
  components: string[];
  subFeatures: SubFeature[];
}

interface TechnicalTask {
  spec: string;
  tasks: SubFeature[];
}

interface StatusData {
  generated: string;
  summary: {
    total: number;
    implemented: number;
    inProgress: number;
    pending: number;
    totalSubFeatures: number;
    totalTechnicalTasks: number;
  };
  features: Feature[];
  technicalTasks: TechnicalTask[];
}

const StatusDashboard: React.FC = () => {
  const [data, setData] = useState<StatusData | null>(null);
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const [expandedTech, setExpandedTech] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/api/feature-status')
      .then(response => setData(response))
      .catch(err => setError(err.message || 'Failed to fetch status'))
      .finally(() => setLoading(false));
  }, []);

  const toggleFeature = (id: string) => {
    setExpandedFeatures(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTech = (spec: string) => {
    setExpandedTech(prev => {
      const next = new Set(prev);
      if (next.has(spec)) next.delete(spec);
      else next.add(spec);
      return next;
    });
  };

  const getStatusClasses = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('complete') || s.includes('implement')) {
      return 'bg-green-500/10 text-green-700 dark:text-green-400';
    }
    if (s.includes('progress')) {
      return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
    }
    return 'bg-destructive/10 text-destructive';
  };

  const getStatusDot = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('complete') || s.includes('implement')) return 'bg-green-500';
    if (s.includes('progress')) return 'bg-yellow-500';
    return 'bg-destructive';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Feature Status Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Feature Status Dashboard</h2>
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Feature Status Dashboard</h2>
        <Alert>
          <AlertDescription>No data available</AlertDescription>
        </Alert>
      </div>
    );
  }

  const filteredFeatures = data.features.filter(f => {
    if (filter === 'all') return true;
    const s = f.status.toLowerCase();
    if (filter === 'implemented') return s.includes('implement') || s.includes('complete');
    if (filter === 'in-progress') return s.includes('progress');
    if (filter === 'pending') return !s.includes('implement') && !s.includes('complete') && !s.includes('progress');
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feature Status Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Auto-generated from specs on {new Date(data.generated).toLocaleDateString()}
          </p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Implemented</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{data.summary.implemented}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{data.summary.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{data.summary.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-totals */}
      <Card>
        <CardContent className="py-4">
          <div className="flex gap-6 text-sm">
            <span><strong>{data.summary.totalSubFeatures}</strong> sub-features tracked</span>
            <span><strong>{data.summary.totalTechnicalTasks}</strong> technical tasks tracked</span>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Filter:</span>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm bg-background border-input"
        >
          <option value="all">All</option>
          <option value="implemented">Implemented</option>
          <option value="in-progress">In Progress</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Features Table */}
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Feature</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Test</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Diagram</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Sub-features</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredFeatures.map(feature => (
                  <React.Fragment key={feature.id}>
                    <tr
                      className="hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => toggleFeature(feature.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {expandedFeatures.has(feature.id) ? '▼' : '▶'}
                          </span>
                          <strong>{feature.name}</strong>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusClasses(feature.status)}`}>
                          {feature.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {feature.test ? (
                          <span className="text-green-600 dark:text-green-400">✓</span>
                        ) : (
                          <span className="text-destructive">✗</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {feature.diagram ? (
                          <span className="text-green-600 dark:text-green-400">✓</span>
                        ) : (
                          <span className="text-destructive">✗</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {feature.subFeatures.length} items
                      </td>
                    </tr>
                    {expandedFeatures.has(feature.id) && (
                      <tr className="bg-muted/30">
                        <td colSpan={5} className="px-8 py-4">
                          <div className="space-y-3">
                            <div className="text-sm font-medium mb-2">Sub-features:</div>
                            {feature.subFeatures.map((sf, idx) => (
                              <div key={idx} className="flex items-center gap-3 text-sm">
                                <span className={`w-2 h-2 rounded-full ${getStatusDot(sf.status)}`}></span>
                                <span>{sf.name}</span>
                                <span className={`text-xs ${getStatusClasses(sf.status)} px-1.5 py-0.5 rounded`}>
                                  {sf.status}
                                </span>
                              </div>
                            ))}
                            {feature.components.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <div className="text-sm font-medium mb-2">Components:</div>
                                <div className="flex flex-wrap gap-2">
                                  {feature.components.map((c, idx) => (
                                    <code key={idx} className="text-xs bg-muted px-2 py-1 rounded">
                                      {c}
                                    </code>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="mt-2 text-xs">
                              <a href={feature.spec} className="text-primary hover:underline">
                                View Spec →
                              </a>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Technical Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Tasks</CardTitle>
          <CardDescription>Implementation tasks from technical specifications</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Technical Spec</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Tasks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.technicalTasks.map(tech => (
                  <React.Fragment key={tech.spec}>
                    <tr
                      className="hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => toggleTech(tech.spec)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {expandedTech.has(tech.spec) ? '▼' : '▶'}
                          </span>
                          <strong className="capitalize">{tech.spec.replace(/-/g, ' ')}</strong>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {tech.tasks.length} tasks
                      </td>
                    </tr>
                    {expandedTech.has(tech.spec) && (
                      <tr className="bg-muted/30">
                        <td colSpan={2} className="px-8 py-4">
                          <div className="space-y-2">
                            {tech.tasks.map((task, idx) => (
                              <div key={idx} className="flex items-center gap-3 text-sm">
                                <span className={`w-2 h-2 rounded-full ${getStatusDot(task.status)}`}></span>
                                <span>{task.name}</span>
                                <span className={`text-xs ${getStatusClasses(task.status)} px-1.5 py-0.5 rounded`}>
                                  {task.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Regenerate data: <code className="bg-muted px-2 py-1 rounded">node scripts/validation/audit-framework.cjs</code>
      </p>
    </div>
  );
};

export default StatusDashboard;
