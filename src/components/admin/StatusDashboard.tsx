import { APIService } from '../../services/APIService';
import React, { useState, useEffect } from 'react';

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
    APIService.request('GET', '/api/feature-status', {})
      setData(response);
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

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('complete') || s.includes('implement')) return 'text-green-600';
    if (s.includes('progress')) return 'text-orange-500';
    return 'text-red-600';
  };

  const getStatusBg = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('complete') || s.includes('implement')) return 'bg-green-100';
    if (s.includes('progress')) return 'bg-orange-100';
    return 'bg-red-100';
  };

  if (loading) return <div className="p-4">Loading status...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!data) return <div className="p-4">No data available</div>;

  const filteredFeatures = data.features.filter(f => {
    if (filter === 'all') return true;
    const s = f.status.toLowerCase();
    if (filter === 'implemented') return s.includes('implement') || s.includes('complete');
    if (filter === 'in-progress') return s.includes('progress');
    if (filter === 'pending') return !s.includes('implement') && !s.includes('complete') && !s.includes('progress');
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Feature Status Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">
        Auto-generated from specs on {new Date(data.generated).toLocaleDateString()}
      </p>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-2xl font-bold">{data.summary.total}</div>
          <div className="text-gray-600 text-sm">Total Features</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-2xl font-bold text-green-600">{data.summary.implemented}</div>
          <div className="text-gray-600 text-sm">Implemented</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <div className="text-2xl font-bold text-orange-500">{data.summary.inProgress}</div>
          <div className="text-gray-600 text-sm">In Progress</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="text-2xl font-bold text-red-600">{data.summary.pending}</div>
          <div className="text-gray-600 text-sm">Pending</div>
        </div>
      </div>

      {/* Sub-totals */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex gap-6 text-sm">
          <span><strong>{data.summary.totalSubFeatures}</strong> sub-features tracked</span>
          <span><strong>{data.summary.totalTechnicalTasks}</strong> technical tasks tracked</span>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <label className="mr-2 text-sm font-medium">Filter:</label>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="all">All</option>
          <option value="implemented">Implemented</option>
          <option value="in-progress">In Progress</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Features Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <table className="w-full">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-4 py-3 text-left text-sm">Feature</th>
              <th className="px-4 py-3 text-left text-sm">Status</th>
              <th className="px-4 py-3 text-left text-sm">Test</th>
              <th className="px-4 py-3 text-left text-sm">Diagram</th>
              <th className="px-4 py-3 text-left text-sm">Sub-features</th>
            </tr>
          </thead>
          <tbody>
            {filteredFeatures.map(feature => (
              <React.Fragment key={feature.id}>
                <tr
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleFeature(feature.id)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">
                        {expandedFeatures.has(feature.id) ? '▼' : '▶'}
                      </span>
                      <strong>{feature.name}</strong>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${getStatusBg(feature.status)} ${getStatusColor(feature.status)}`}>
                      {feature.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {feature.test ? (
                      <span className="text-green-600">✅</span>
                    ) : (
                      <span className="text-red-600">❌</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {feature.diagram ? (
                      <span className="text-green-600">✅</span>
                    ) : (
                      <span className="text-red-600">❌</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {feature.subFeatures.length} items
                  </td>
                </tr>
                {expandedFeatures.has(feature.id) && (
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="px-8 py-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700 mb-2">Sub-features:</div>
                        {feature.subFeatures.map((sf, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-sm">
                            <span className={`w-3 h-3 rounded-full ${
                              sf.status.includes('complete') ? 'bg-green-500' :
                              sf.status.includes('progress') ? 'bg-orange-500' : 'bg-red-500'
                            }`}></span>
                            <span>{sf.name}</span>
                            <span className={`text-xs ${getStatusColor(sf.status)}`}>
                              ({sf.status})
                            </span>
                          </div>
                        ))}
                        {feature.components.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-sm font-medium text-gray-700 mb-1">Components:</div>
                            <div className="flex flex-wrap gap-2">
                              {feature.components.map((c, idx) => (
                                <code key={idx} className="text-xs bg-gray-200 px-2 py-1 rounded">
                                  {c}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="mt-2 text-xs text-gray-500">
                          <a href={feature.spec} className="text-blue-600 hover:underline">
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

      {/* Technical Tasks */}
      <h2 className="text-xl font-bold mb-4">Technical Tasks</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700 text-white">
            <tr>
              <th className="px-4 py-3 text-left text-sm">Technical Spec</th>
              <th className="px-4 py-3 text-left text-sm">Tasks</th>
            </tr>
          </thead>
          <tbody>
            {data.technicalTasks.map(tech => (
              <React.Fragment key={tech.spec}>
                <tr
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleTech(tech.spec)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">
                        {expandedTech.has(tech.spec) ? '▼' : '▶'}
                      </span>
                      <strong className="capitalize">{tech.spec.replace(/-/g, ' ')}</strong>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {tech.tasks.length} tasks
                  </td>
                </tr>
                {expandedTech.has(tech.spec) && (
                  <tr className="bg-gray-50">
                    <td colSpan={2} className="px-8 py-4">
                      <div className="space-y-2">
                        {tech.tasks.map((task, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-sm">
                            <span className={`w-3 h-3 rounded-full ${
                              task.status.includes('complete') ? 'bg-green-500' :
                              task.status.includes('progress') ? 'bg-orange-500' : 'bg-red-500'
                            }`}></span>
                            <span>{task.name}</span>
                            <span className={`text-xs ${getStatusColor(task.status)}`}>
                              ({task.status})
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

      <p className="mt-6 text-sm text-gray-500">
        Regenerate data: <code className="bg-gray-100 px-2 py-1 rounded">node scripts/validation/audit-framework.cjs</code>
      </p>
    </div>
  );
};

export default StatusDashboard;
