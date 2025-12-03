import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Copy, FileJson, AlertTriangle, Shield } from 'lucide-react';

interface SessionData {
  session_id: string;
  timestamp: string;
  files_read?: string[];
  files_modified?: string[];
  files_created?: string[];
  commands_run?: Array<string | { command: string; background?: boolean }>;
  searches_performed?: Array<{ type: string; query: string }>;
  stats?: { total_tool_calls: number; blocked_count?: number };
  tool_summary?: Record<string, number>;
  blocked_operations?: Array<{
    tool: string;
    file_path?: string;
    reason: string;
  }>;
  framework_violations?: Array<{
    severity: string;
    rule: string;
    message: string;
    recommendation?: string;
  }>;
  framework_checks?: Record<string, { passed: boolean }>;
  _filename?: string;
}

export function SessionViewer() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'files' | 'commands' | 'searches' | 'violations' | 'raw'>('overview');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Auto-load recent sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('recentSessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setCurrentSession(parsed[0]);
        }
      } catch (e) {
        console.warn('Failed to restore recent sessions:', e);
      }
    }
  }, []);

  // Handle drag and drop
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const items = e.dataTransfer?.items;
      if (!items) return;

      const files: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file && file.name.endsWith('.json')) {
            files.push(file);
          }
        }
      }

      if (files.length > 0) {
        await loadFiles(files);
      }
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  const loadFiles = async (files: File[]) => {
    setLoading(true);
    const newSessions: SessionData[] = [];

    for (const file of files) {
      try {
        const text = await file.text();
        const data = JSON.parse(text) as SessionData;
        if (data.session_id || data.timestamp) {
          data._filename = file.name;
          newSessions.push(data);
        }
      } catch (e) {
        console.warn(`Failed to parse ${file.name}:`, e);
      }
    }

    // Sort by timestamp descending
    newSessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setSessions(newSessions);
    if (newSessions.length > 0) {
      setCurrentSession(newSessions[0]);
    }

    // Save to localStorage
    try {
      localStorage.setItem('recentSessions', JSON.stringify(newSessions.slice(0, 10)));
    } catch (e) {
      console.warn('Failed to cache sessions:', e);
    }

    setLoading(false);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    await loadFiles(Array.from(files));
  };

  const handleFolderSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    const jsonFiles = Array.from(files).filter(f => f.name.endsWith('.json'));
    await loadFiles(jsonFiles);
  };

  const copyJSON = useCallback(() => {
    if (!currentSession) return;
    navigator.clipboard.writeText(JSON.stringify(currentSession, null, 2));
  }, [currentSession]);

  const renderSessionListItem = (session: SessionData, index: number) => {
    const date = new Date(session.timestamp);
    const hasViolations = (session.framework_violations?.length || 0) > 0;
    const hasErrors = session.framework_violations?.some(v => v.severity === 'error');
    const filesModified = (session.files_modified?.length || 0) + (session.files_created?.length || 0);

    return (
      <div
        key={session.session_id || index}
        onClick={() => setCurrentSession(session)}
        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
          currentSession?.session_id === session.session_id
            ? 'bg-primary/10 border-primary'
            : 'hover:bg-muted'
        } ${hasErrors ? 'border-l-4 border-l-destructive' : hasViolations ? 'border-l-4 border-l-warning' : ''}`}
      >
        <div className="text-sm font-medium">
          {date.toLocaleDateString()} {date.toLocaleTimeString()}
        </div>
        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
          <span>📁 {session.files_read?.length || 0} read</span>
          <span>✏️ {filesModified} modified</span>
          <span>🔧 {session.stats?.total_tool_calls || 0} tools</span>
        </div>
        {hasViolations && (
          <div className="mt-1 text-xs text-warning">
            ⚠️ {session.framework_violations?.length} violation(s)
          </div>
        )}
      </div>
    );
  };

  const renderOverview = (session: SessionData) => {
    const filesModified = session.files_modified?.length || 0;
    const filesCreated = session.files_created?.length || 0;
    const filesRead = session.files_read?.length || 0;
    const commandsRun = session.commands_run?.length || 0;
    const searchCount = session.searches_performed?.length || 0;
    const toolCount = session.stats?.total_tool_calls || 0;
    const blockedCount = (session.blocked_operations?.length || 0) + (session.stats?.blocked_count || 0);

    return (
      <div className="space-y-6">
        {/* Blocked Operations Success Section */}
        {session.blocked_operations && session.blocked_operations.length > 0 && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                <Shield className="h-5 w-5" />
                🛡️ Blocked Operations (Constraints Enforced)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {session.blocked_operations.map((op, idx) => (
                <div key={idx} className="p-3 bg-white dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-300 font-bold">✓ BLOCKED:</span>
                    <div className="flex-1">
                      <div className="font-medium">{op.tool}</div>
                      {op.file_path && (
                        <div className="text-sm text-muted-foreground font-mono">
                          {op.file_path.split(/[/\\]/).pop()}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground mt-1">
                        Reason: {op.reason}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-sm text-green-700 dark:text-green-200 mt-4">
                ✅ These operations were properly blocked by the PreToolUse constraint hook
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{filesRead}</div>
              <div className="text-xs text-muted-foreground">Files Read</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{filesModified}</div>
              <div className="text-xs text-muted-foreground">Modified</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{filesCreated}</div>
              <div className="text-xs text-muted-foreground">Created</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{commandsRun}</div>
              <div className="text-xs text-muted-foreground">Commands</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{searchCount}</div>
              <div className="text-xs text-muted-foreground">Searches</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{toolCount}</div>
              <div className="text-xs text-muted-foreground">Total Tools</div>
            </CardContent>
          </Card>
          {blockedCount > 0 && (
            <Card className="border-green-500 bg-green-50 dark:bg-green-950">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{blockedCount}</div>
                <div className="text-xs text-green-700 dark:text-green-300">🛡️ Blocked</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tool Usage */}
        {session.tool_summary && Object.keys(session.tool_summary).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tool Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(session.tool_summary)
                  .sort((a, b) => b[1] - a[1])
                  .map(([tool, count]) => {
                    const maxCount = Math.max(...Object.values(session.tool_summary!));
                    const percentage = (count / maxCount) * 100;
                    return (
                      <div key={tool} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{tool}</span>
                          <span className="font-bold">{count}</span>
                        </div>
                        <Progress value={percentage} />
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderFiles = (session: SessionData) => {
    const hasFiles = (session.files_created?.length || 0) + (session.files_modified?.length || 0) + (session.files_read?.length || 0) > 0;

    if (!hasFiles) {
      return <Alert><AlertDescription>No file operations in this session</AlertDescription></Alert>;
    }

    return (
      <div className="space-y-4">
        {session.files_created && session.files_created.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Created Files ({session.files_created.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {session.files_created.map((file, idx) => (
                  <div key={idx} className="text-sm font-mono p-2 bg-green-50 dark:bg-green-950 border-l-2 border-green-500 rounded">
                    ✨ {file}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {session.files_modified && session.files_modified.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Modified Files ({session.files_modified.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {session.files_modified.map((file, idx) => (
                  <div key={idx} className="text-sm font-mono p-2 bg-yellow-50 dark:bg-yellow-950 border-l-2 border-yellow-500 rounded">
                    ✏️ {file}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {session.files_read && session.files_read.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Read Files ({session.files_read.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {session.files_read.map((file, idx) => (
                  <div key={idx} className="text-sm font-mono p-2 bg-blue-50 dark:bg-blue-950 border-l-2 border-blue-500 rounded">
                    📖 {file}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderCommands = (session: SessionData) => {
    if (!session.commands_run || session.commands_run.length === 0) {
      return <Alert><AlertDescription>No commands run in this session</AlertDescription></Alert>;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Commands ({session.commands_run.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {session.commands_run.map((cmd, idx) => {
              const command = typeof cmd === 'string' ? cmd : cmd.command;
              const isBackground = typeof cmd === 'object' && cmd.background;
              return (
                <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded font-mono text-sm">
                  <span className="flex-1 truncate">{command}</span>
                  {isBackground && <Badge variant="outline">bg</Badge>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSearches = (session: SessionData) => {
    if (!session.searches_performed || session.searches_performed.length === 0) {
      return <Alert><AlertDescription>No searches performed in this session</AlertDescription></Alert>;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Searches ({session.searches_performed.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {session.searches_performed.map((search, idx) => (
              <div key={idx} className="p-3 bg-muted rounded border-l-2 border-blue-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-xs font-medium text-muted-foreground mb-1">[{search.type}]</div>
                    <div className="text-sm font-mono">{search.query}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderRaw = (session: SessionData) => {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Raw JSON</CardTitle>
            <Button variant="outline" size="sm" onClick={copyJSON}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg overflow-x-auto max-h-96 overflow-y-auto font-mono text-sm">
            <pre>{JSON.stringify(session, null, 2)}</pre>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderViolations = (session: SessionData) => {
    const violations = session.framework_violations || [];
    const checks = session.framework_checks || {};

    if (violations.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>✅ Framework Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(checks).map(([key, check]) => (
                <div key={key} className="flex items-center gap-2">
                  {check.passed ? (
                    <Badge variant="default" className="bg-green-500">✓</Badge>
                  ) : (
                    <Badge variant="destructive">✗</Badge>
                  )}
                  <span className="text-sm">{key.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    const hasError = violations.some(v => v.severity === 'error');

    return (
      <div className="space-y-4">
        <Alert variant={hasError ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {hasError ? '🔴' : '🟡'} {violations.length} Framework Violation(s) Detected
          </AlertDescription>
        </Alert>

        {violations.map((v, idx) => (
          <Card key={idx} className={v.severity === 'error' ? 'border-destructive' : 'border-warning'}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                {v.severity === 'error' ? '❌' : '⚠️'}
                <span className="uppercase">{v.rule}</span>
                <Badge variant={v.severity === 'error' ? 'destructive' : 'default'}>{v.severity}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{v.message}</p>
              {v.recommendation && (
                <div className="text-sm p-2 bg-green-50 dark:bg-green-950 rounded border-l-2 border-green-500">
                  💡 {v.recommendation}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6" onDragEnter={() => setDragActive(true)} onDragLeave={() => setDragActive(false)}>
      <Card className={dragActive ? 'border-2 border-primary bg-primary/5' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                Session Analyzer
              </CardTitle>
              <CardDescription>
                View and analyze Claude Code session logs from .claude/session-logs/ (or drag & drop files)
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={folderInputRef}
                type="file"
                webkitdirectory=""
                directory=""
                multiple
                onChange={handleFolderSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => folderInputRef.current?.click()}
                disabled={loading}
              >
                📂 Load Folder
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                📄 Load Files
              </Button>
              {currentSession && (
                <Button variant="outline" onClick={copyJSON}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy JSON
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileJson className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Sessions Loaded</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Load session logs from .claude/session-logs/ to view analysis
            </p>
            <Button onClick={() => document.getElementById('session-file-input')?.click()}>
              📂 Load Session Files
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Session List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sessions ({sessions.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {sessions.map((session, index) => renderSessionListItem(session, index))}
              </CardContent>
            </Card>
          </div>

          {/* Session Details */}
          <div className="lg:col-span-3">
            {currentSession && (
              <div className="space-y-6">
                {/* Tabs */}
                <div className="flex gap-2 border-b overflow-x-auto">
                  <button
                    onClick={() => setSelectedTab('overview')}
                    className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                      selectedTab === 'overview'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setSelectedTab('files')}
                    className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                      selectedTab === 'files'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Files
                  </button>
                  <button
                    onClick={() => setSelectedTab('commands')}
                    className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                      selectedTab === 'commands'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Commands
                  </button>
                  <button
                    onClick={() => setSelectedTab('searches')}
                    className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                      selectedTab === 'searches'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Searches
                  </button>
                  <button
                    onClick={() => setSelectedTab('violations')}
                    className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                      selectedTab === 'violations'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Compliance
                  </button>
                  <button
                    onClick={() => setSelectedTab('raw')}
                    className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                      selectedTab === 'raw'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Raw JSON
                  </button>
                </div>

                {/* Tab Content */}
                {selectedTab === 'overview' && renderOverview(currentSession)}
                {selectedTab === 'files' && renderFiles(currentSession)}
                {selectedTab === 'commands' && renderCommands(currentSession)}
                {selectedTab === 'searches' && renderSearches(currentSession)}
                {selectedTab === 'violations' && renderViolations(currentSession)}
                {selectedTab === 'raw' && renderRaw(currentSession)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
