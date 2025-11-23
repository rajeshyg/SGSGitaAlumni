import { apiClient } from '../../lib/api';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { TanStackAdvancedTable } from '../ui/tanstack-advanced-table';
import { ColumnDef } from '@tanstack/react-table';
import Badge from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ChevronDown, ChevronRight, CheckCircle, XCircle } from 'lucide-react';

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

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const s = status.toLowerCase();
    if (s.includes('complete') || s.includes('implement')) {
      return 'default'; // green
    }
    if (s.includes('progress')) {
      return 'secondary'; // yellow/amber
    }
    return 'destructive'; // red
  };

  const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('complete') || s.includes('implement')) return <CheckCircle className="h-3 w-3" />;
    if (s.includes('progress')) return <div className="h-2 w-2 rounded-full bg-yellow-500" />;
    return <XCircle className="h-3 w-3" />;
  };

  const renderStatusBadge = (status: string) => (
    <Badge variant={getStatusVariant(status)} className="text-xs">
      {status}
    </Badge>
  );

  const renderCheckIcon = (hasItem: boolean) => (
    hasItem ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-destructive" />
  );

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

  // Column definitions for features table
  const featureColumns: ColumnDef<Feature>[] = [
    {
      id: 'expand',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleFeature(row.original.id)}
          className="h-6 w-6 p-0"
        >
          {expandedFeatures.has(row.original.id) ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      ),
      size: 40,
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: 'Feature',
      cell: ({ row }) => <strong>{row.original.name}</strong>,
      size: 200,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => renderStatusBadge(row.original.status),
      size: 120,
    },
    {
      accessorKey: 'test',
      header: 'Test',
      cell: ({ row }) => renderCheckIcon(!!row.original.test),
      size: 80,
    },
    {
      accessorKey: 'diagram',
      header: 'Diagram',
      cell: ({ row }) => renderCheckIcon(!!row.original.diagram),
      size: 80,
    },
    {
      id: 'subFeatures',
      header: 'Sub-features',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.subFeatures.length} items
        </span>
      ),
      size: 120,
    },
  ];

  // Column definitions for technical tasks table
  const techColumns: ColumnDef<TechnicalTask>[] = [
    {
      id: 'expand',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleTech(row.original.spec)}
          className="h-6 w-6 p-0"
        >
          {expandedTech.has(row.original.spec) ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      ),
      size: 40,
      enableSorting: false,
    },
    {
      accessorKey: 'spec',
      header: 'Technical Spec',
      cell: ({ row }) => (
        <strong className="capitalize">
          {row.original.spec.replace(/-/g, ' ')}
        </strong>
      ),
      size: 200,
    },
    {
      id: 'tasks',
      header: 'Tasks',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.tasks.length} tasks
        </span>
      ),
      size: 120,
    },
  ];

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
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="implemented">Implemented</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Features Table */}
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <TanStackAdvancedTable
            data={filteredFeatures as unknown as Record<string, unknown>[]}
            columns={featureColumns as unknown as ColumnDef<Record<string, unknown>>[]}
            loading={false}
            emptyMessage="No features found"
            maxHeight="600px"
          />
        </CardContent>
      </Card>

      {/* Expanded Feature Details */}
      {Array.from(expandedFeatures).map(featureId => {
        const feature = data.features.find(f => f.id === featureId);
        if (!feature) return null;

        return (
          <Card key={featureId} className="mt-4">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="text-sm font-medium mb-2">Sub-features:</div>
                {feature.subFeatures.map((sf, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    {getStatusIcon(sf.status)}
                    <span>{sf.name}</span>
                    {renderStatusBadge(sf.status)}
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
            </CardContent>
          </Card>
        );
      })}

      {/* Technical Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Tasks</CardTitle>
          <CardDescription>Implementation tasks from technical specifications</CardDescription>
        </CardHeader>
        <CardContent>
          <TanStackAdvancedTable
            data={data.technicalTasks as unknown as Record<string, unknown>[]}
            columns={techColumns as unknown as ColumnDef<Record<string, unknown>>[]}
            loading={false}
            emptyMessage="No technical tasks found"
            maxHeight="400px"
          />
        </CardContent>
      </Card>

      {/* Expanded Technical Task Details */}
      {Array.from(expandedTech).map(techSpec => {
        const tech = data.technicalTasks.find(t => t.spec === techSpec);
        if (!tech) return null;

        return (
          <Card key={techSpec} className="mt-4">
            <CardContent className="pt-6">
              <div className="space-y-2">
                {tech.tasks.map((task, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    {getStatusIcon(task.status)}
                    <span>{task.name}</span>
                    {renderStatusBadge(task.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <p className="text-sm text-muted-foreground">
        Regenerate data: <code className="bg-muted px-2 py-1 rounded">node scripts/validation/audit-framework.cjs</code>
      </p>
    </div>
  );
};

export default StatusDashboard;
