import React, { useState, useEffect, useRef } from 'react';
import { useAuthSafe, StorageUtils } from '../../contexts/AuthContext';
import { logger } from '../../utils/logger';
import { chatClient } from '../../lib/socket/chatClient';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  GripHorizontal,
  Maximize2,
  Minimize2,
  Trash2,
  Wifi,
  X,
  RefreshCw,
} from 'lucide-react';

interface AuthVerificationResponse {
  authenticated: boolean;
  user?: {
    id: number;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
  reason?: string;
  message?: string;
  tokenValid?: boolean;
}

interface Position {
  x: number;
  y: number;
}

/**
 * Professional Draggable Debug Panel
 *
 * Consolidates MobileDebugOverlay and LogViewer into a single unified panel with:
 * - Draggable interface (can move to avoid blocking content)
 * - Tabbed layout (Auth, Tokens, Storage, Logs, Socket, System)
 * - Minimize/Maximize functionality
 * - Professional styling
 * - Development-only visibility
 */
export const DraggableDebugPanel: React.FC = () => {
  // Only show in development mode
  const isDevelopment = import.meta.env.DEV;

  // IMPORTANT: Hooks must be called unconditionally before any returns
  // Use safe version to avoid throwing during navigation transitions
  const auth = useAuthSafe();
  const user = auth?.user ?? null;
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const isLoading = auth?.isLoading ?? true;

  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // State Management
  const [isVisible, setIsVisible] = useState(() => {
    const stored = localStorage.getItem('debug-panel-visible');
    return stored ? JSON.parse(stored) : false;
  });
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'auth' | 'tokens' | 'storage' | 'logs' | 'socket' | 'system'
  >('auth');

  // Position Management
  const [position, setPosition] = useState<Position>(() => {
    const stored = localStorage.getItem('debug-panel-position');
    return stored
      ? JSON.parse(stored)
      : { x: window.innerWidth - 420, y: 20 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

  // Auth & Verification State
  const [serverVerification, setServerVerification] =
    useState<AuthVerificationResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Storage State
  const [storageInfo, setStorageInfo] = useState({
    authToken: '',
    refreshToken: '',
    localStorageAvailable: false,
    sessionStorageAvailable: false,
    localStorageKeys: [] as string[],
    sessionStorageKeys: [] as string[],
  });

  // Logs State
  const [logs, setLogs] = useState<any[]>([]);

  // Socket State
  const [socketStatus, setSocketStatus] = useState({
    connected: false,
    queuedMessages: 0,
    reconnectAttempts: 0,
    socketUrl: window.location.origin,
  });

  if (!isDevelopment) {
    return null;
  }

  // Persist visibility
  useEffect(() => {
    localStorage.setItem('debug-panel-visible', JSON.stringify(isVisible));
  }, [isVisible]);

  // Persist position
  useEffect(() => {
    localStorage.setItem('debug-panel-position', JSON.stringify(position));
  }, [position]);

  // Update storage info
  const updateStorageInfo = () => {
    const authToken = StorageUtils.getItem('authToken') || '';
    const refreshToken = StorageUtils.getItem('refreshToken') || '';

    let localStorageAvailable = false;
    let sessionStorageAvailable = false;
    let localStorageKeys: string[] = [];
    let sessionStorageKeys: string[] = [];

    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      localStorageAvailable = true;
      localStorageKeys = Object.keys(localStorage);
    } catch (e) {
      console.error('[DebugPanel] localStorage not available:', e);
    }

    try {
      sessionStorage.setItem('test', 'test');
      sessionStorage.removeItem('test');
      sessionStorageAvailable = true;
      sessionStorageKeys = Object.keys(sessionStorage);
    } catch (e) {
      console.error('[DebugPanel] sessionStorage not available:', e);
    }

    setStorageInfo({
      authToken,
      refreshToken,
      localStorageAvailable,
      sessionStorageAvailable,
      localStorageKeys,
      sessionStorageKeys,
    });
  };

  // Verify auth with server
  const verifyWithServer = async () => {
    setIsVerifying(true);
    try {
      const token = StorageUtils.getItem('authToken');

      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
        }/api/auth/verify`,
        {
          method: 'GET',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      setServerVerification(data);
      console.log('[DebugPanel] Server verification:', data);
    } catch (error) {
      console.error('[DebugPanel] Server verification failed:', error);
      setServerVerification({
        authenticated: false,
        reason: 'network_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Update logs and socket status
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isVisible) {
        updateStorageInfo();

        // Update logs
        try {
          const logHistory = logger?.getLogHistory?.() || [];
          setLogs(logHistory);
        } catch (error) {
          console.error('[DebugPanel] Error getting log history:', error);
        }

        // Update socket status
        try {
          const isConnected = chatClient?.isSocketConnected?.() || false;
          const status = chatClient?.getStatus?.() || {
            connected: isConnected,
            queuedMessages: 0,
            reconnectAttempts: 0,
          };

          setSocketStatus({
            connected: status.connected,
            queuedMessages: status.queuedMessages || 0,
            reconnectAttempts: status.reconnectAttempts || 0,
            socketUrl: window.location.origin,
          });
        } catch (error) {
          console.error('[DebugPanel] Error getting socket status:', error);
        }
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isVisible]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!headerRef.current?.contains(e.target as Node)) return;
    if ((e.target as HTMLElement).closest('button')) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      // Keep within viewport
      newX = Math.max(0, Math.min(newX, window.innerWidth - 400));
      newY = Math.max(0, Math.min(newY, window.innerHeight - 100));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Toggle Button (when collapsed)
  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed z-50 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
        style={{
          right: '16px',
          top: '16px',
        }}
        title="Show Debug Panel"
        aria-label="Show Debug Panel"
      >
        <AlertCircle size={20} />
      </button>
    );
  }

  // Main Panel
  const panelClasses = isMaximized
    ? 'fixed inset-4 flex flex-col'
    : 'fixed w-96 h-[600px] flex flex-col';

  return (
    <div
      ref={panelRef}
      className={`${panelClasses} bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-700 rounded-lg shadow-2xl z-50 font-mono text-xs text-gray-100`}
      style={
        !isMaximized
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
            }
          : undefined
      }
    >
      {/* Header - Draggable */}
      <div
        ref={headerRef}
        onMouseDown={handleMouseDown}
        className={`flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700 rounded-t-lg ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <div className="flex items-center gap-2 flex-1">
          <GripHorizontal size={16} className="text-gray-500" />
          <h2 className="text-sm font-bold text-white">Debug Panel</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="text-gray-400 hover:text-white transition-colors p-1"
            title={isMaximized ? 'Minimize' : 'Maximize'}
          >
            {isMaximized ? (
              <Minimize2 size={14} />
            ) : (
              <Maximize2 size={14} />
            )}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-red-400 transition-colors p-1"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-2 pt-2 border-b border-gray-700 overflow-x-auto">
        {(
          [
            { id: 'auth', label: 'Auth' },
            { id: 'tokens', label: 'Tokens' },
            { id: 'storage', label: 'Storage' },
            { id: 'logs', label: 'Logs' },
            { id: 'socket', label: 'Socket' },
            { id: 'system', label: 'System' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2 py-1 rounded text-[11px] whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-2 space-y-2">
        {/* Auth Tab */}
        {activeTab === 'auth' && (
          <div className="space-y-2">
            <div className="bg-gray-800 p-2 rounded border border-gray-700">
              <div className="font-bold text-white flex items-center gap-2 mb-1">
                {isAuthenticated ? (
                  <CheckCircle size={12} className="text-green-500" />
                ) : (
                  <XCircle size={12} className="text-red-500" />
                )}
                Client Auth
              </div>
              <div className="space-y-1 text-[10px]">
                <div>
                  Authenticated:{' '}
                  <span
                    className={
                      isAuthenticated ? 'text-green-400' : 'text-red-400'
                    }
                  >
                    {isAuthenticated ? 'YES' : 'NO'}
                  </span>
                </div>
                <div>
                  Loading:{' '}
                  <span
                    className={isLoading ? 'text-yellow-400' : 'text-green-400'}
                  >
                    {isLoading ? 'YES' : 'NO'}
                  </span>
                </div>
                {user && (
                  <>
                    <div>User ID: {user.id}</div>
                    <div>Email: {user.email}</div>
                    <div>Role: {user.role}</div>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                updateStorageInfo();
                verifyWithServer();
              }}
              disabled={isVerifying}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-2 py-1 rounded text-[10px] flex items-center justify-center gap-1 transition-colors"
            >
              <RefreshCw
                size={10}
                className={isVerifying ? 'animate-spin' : ''}
              />
              {isVerifying ? 'Verifying...' : 'Refresh & Verify'}
            </button>

            {serverVerification && (
              <div className="bg-gray-800 p-2 rounded border border-gray-700">
                <div className="font-bold text-white flex items-center gap-2 mb-1">
                  {serverVerification.authenticated ? (
                    <CheckCircle size={12} className="text-green-500" />
                  ) : (
                    <AlertCircle size={12} className="text-red-500" />
                  )}
                  Server Auth
                </div>
                <div className="space-y-1 text-[10px]">
                  <div>
                    Authenticated:{' '}
                    <span
                      className={
                        serverVerification.authenticated
                          ? 'text-green-400'
                          : 'text-red-400'
                      }
                    >
                      {serverVerification.authenticated ? 'YES' : 'NO'}
                    </span>
                  </div>
                  {serverVerification.reason && (
                    <div>Reason: {serverVerification.reason}</div>
                  )}
                  {serverVerification.message && (
                    <div>Message: {serverVerification.message}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tokens Tab */}
        {activeTab === 'tokens' && (
          <div className="bg-gray-800 p-2 rounded border border-gray-700 space-y-2">
            <div>
              <div className="font-bold text-white mb-1">Auth Token</div>
              <div className="text-[10px]">
                {storageInfo.authToken ? (
                  <div>
                    <span className="text-green-400">
                      Present ({storageInfo.authToken.length} chars)
                    </span>
                    <div className="mt-1 p-1 bg-gray-900 rounded break-all text-[9px] text-gray-400">
                      {storageInfo.authToken.substring(0, 40)}...
                    </div>
                  </div>
                ) : (
                  <span className="text-red-400">MISSING</span>
                )}
              </div>
            </div>

            <div>
              <div className="font-bold text-white mb-1">Refresh Token</div>
              <div className="text-[10px]">
                {storageInfo.refreshToken ? (
                  <span className="text-green-400">
                    Present ({storageInfo.refreshToken.length} chars)
                  </span>
                ) : (
                  <span className="text-red-400">MISSING</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Storage Tab */}
        {activeTab === 'storage' && (
          <div className="space-y-2">
            <div className="bg-gray-800 p-2 rounded border border-gray-700">
              <div className="font-bold text-white mb-1">Storage Available</div>
              <div className="space-y-1 text-[10px]">
                <div>
                  localStorage:{' '}
                  <span
                    className={
                      storageInfo.localStorageAvailable
                        ? 'text-green-400'
                        : 'text-red-400'
                    }
                  >
                    {storageInfo.localStorageAvailable
                      ? `Available (${storageInfo.localStorageKeys.length} keys)`
                      : 'NOT AVAILABLE'}
                  </span>
                </div>
                <div>
                  sessionStorage:{' '}
                  <span
                    className={
                      storageInfo.sessionStorageAvailable
                        ? 'text-green-400'
                        : 'text-red-400'
                    }
                  >
                    {storageInfo.sessionStorageAvailable
                      ? `Available (${storageInfo.sessionStorageKeys.length} keys)`
                      : 'NOT AVAILABLE'}
                  </span>
                </div>
              </div>
            </div>

            {storageInfo.localStorageKeys.length > 0 && (
              <div className="bg-gray-800 p-2 rounded border border-gray-700">
                <div className="font-bold text-white text-[10px] mb-1">
                  localStorage Keys
                </div>
                <div className="text-[9px] text-gray-400 break-all">
                  {storageInfo.localStorageKeys.join(', ')}
                </div>
              </div>
            )}

            {storageInfo.sessionStorageKeys.length > 0 && (
              <div className="bg-gray-800 p-2 rounded border border-gray-700">
                <div className="font-bold text-white text-[10px] mb-1">
                  sessionStorage Keys
                </div>
                <div className="text-[9px] text-gray-400 break-all">
                  {storageInfo.sessionStorageKeys.join(', ')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-1">
            <button
              onClick={() => {
                logger.clearLogHistory();
                setLogs([]);
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-[10px] flex items-center justify-center gap-1 transition-colors"
            >
              <Trash2 size={10} />
              Clear Logs
            </button>

            <div className="space-y-1">
              {logs.length === 0 ? (
                <div className="text-gray-500 text-[10px] italic">
                  No logs yet
                </div>
              ) : (
                logs.slice(-20).map((log, index) => (
                  <div
                    key={index}
                    className={`p-1 rounded text-[9px] ${
                      log.level === 'error'
                        ? 'bg-red-900/40 text-red-300'
                        : log.level === 'debug'
                        ? 'bg-blue-900/40 text-blue-300'
                        : 'bg-green-900/40 text-green-300'
                    }`}
                  >
                    <span className="opacity-50">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {' ['}
                    <span
                      className={
                        log.level === 'error'
                          ? 'text-red-400'
                          : log.level === 'debug'
                          ? 'text-blue-400'
                          : 'text-green-400'
                      }
                    >
                      {log.level}
                    </span>
                    {'] '}
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Socket Tab */}
        {activeTab === 'socket' && (
          <div className="space-y-2">
            <div className="bg-gray-800 p-2 rounded border border-gray-700">
              <div className="font-bold text-white flex items-center gap-2 mb-2">
                <Wifi size={12} />
                Socket Status
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <div>Connected:</div>
                <div
                  className={
                    socketStatus.connected
                      ? 'text-green-400 font-bold'
                      : 'text-red-400 font-bold'
                  }
                >
                  {socketStatus.connected ? '✅ Yes' : '❌ No'}
                </div>
                <div>Queued:</div>
                <div
                  className={
                    socketStatus.queuedMessages > 0
                      ? 'text-yellow-400'
                      : 'text-gray-400'
                  }
                >
                  {socketStatus.queuedMessages}
                </div>
                <div>Reconnects:</div>
                <div
                  className={
                    socketStatus.reconnectAttempts > 0
                      ? 'text-orange-400'
                      : 'text-gray-400'
                  }
                >
                  {socketStatus.reconnectAttempts}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                try {
                  const status = chatClient.getStatus();
                  logger.info('Socket status:', JSON.stringify(status, null, 2));
                } catch (error) {
                  logger.error('Error:', error);
                }
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-[10px] transition-colors"
            >
              Log Socket Info
            </button>

            <button
              onClick={() => {
                try {
                  logger.info('Testing Socket.IO connectivity');
                  const status = chatClient.getStatus();
                  if (status.connected) {
                    logger.info('✅ Socket is connected!');
                  } else {
                    logger.error('❌ Socket is NOT connected');
                  }
                } catch (error) {
                  logger.error('Error:', error);
                }
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-[10px] transition-colors"
            >
              Check Connection
            </button>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="space-y-2">
            <div className="bg-gray-800 p-2 rounded border border-gray-700">
              <div className="font-bold text-white mb-2 text-[10px]">
                System Info
              </div>
              <div className="space-y-1 text-[9px] break-all">
                <div>
                  <span className="text-gray-400">URL:</span>{' '}
                  {window.location.href}
                </div>
                <div>
                  <span className="text-gray-400">Origin:</span>{' '}
                  {window.location.origin}
                </div>
                <div>
                  <span className="text-gray-400">User Agent:</span>{' '}
                  {navigator.userAgent}
                </div>
                <div>
                  <span className="text-gray-400">Time:</span>{' '}
                  {new Date().toISOString()}
                </div>
              </div>
            </div>

            {/* Diagnostic Summary */}
            <div className="bg-yellow-900/40 border border-yellow-700/50 p-2 rounded">
              <div className="font-bold text-yellow-300 text-[10px] mb-1">
                Diagnostics
              </div>
              <div className="space-y-1 text-[9px]">
                {!storageInfo.authToken && (
                  <div className="text-red-300">
                    ⚠️ Auth token missing
                  </div>
                )}
                {isAuthenticated && !storageInfo.authToken && (
                  <div className="text-red-300">
                    ⚠️ Authenticated but no token
                  </div>
                )}
                {!isAuthenticated && storageInfo.authToken && (
                  <div className="text-red-300">
                    ⚠️ Token exists but not authenticated
                  </div>
                )}
                {socketStatus.reconnectAttempts > 5 && (
                  <div className="text-orange-300">
                    ⚠️ Multiple reconnection attempts
                  </div>
                )}
                {isAuthenticated &&
                  storageInfo.authToken &&
                  socketStatus.connected && (
                    <div className="text-green-300">
                      ✅ All systems operational
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
