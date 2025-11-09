import React, { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import { X, Maximize2, Minimize2, Trash2, Wifi, RefreshCw, Info } from 'lucide-react';
import { chatClient } from '../../lib/socket/chatClient';

export const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'logs' | 'socket'>('logs');
  const [socketStatus, setSocketStatus] = useState<{
    connected: boolean;
    queuedMessages: number;
    reconnectAttempts: number;
    socketUrl: string;
  }>({
    connected: false,
    queuedMessages: 0,
    reconnectAttempts: 0,
    socketUrl: window.location.origin
  });

  // Set default to minimized and make it collapsible
  const [isVisible, setIsVisible] = useState(() => {
    // Try to get the stored preference, default to false (minimized/button only)
    const stored = localStorage.getItem('log-viewer-visible');
    return stored ? JSON.parse(stored) : false;
  });
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Save visibility preference
    localStorage.setItem('log-viewer-visible', JSON.stringify(isVisible));
  }, [isVisible]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isVisible) {
        // Get logs from logger if available
        try {
          const logHistory = logger?.getLogHistory?.() || [];
          setLogs(logHistory);
        } catch (error) {
          console.error('Error getting log history:', error);
          setLogs([]);
        }

        if (activeTab === 'socket') {
          // Update socket status from chatClient
          try {
            const isConnected = chatClient?.isSocketConnected?.() || false;
            const status = chatClient?.getStatus?.() || {
              connected: isConnected,
              queuedMessages: 0,
              reconnectAttempts: 0
            };
            
            setSocketStatus({
              connected: status.connected,
              queuedMessages: status.queuedMessages || 0,
              reconnectAttempts: status.reconnectAttempts || 0,
              socketUrl: window.location.origin
            });
          } catch (error) {
            console.error('Error getting socket status:', error);
          }
        }
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isVisible, activeTab]);

  // Determine container classes based on maximized state
  const containerClasses = isMaximized
    ? 'fixed inset-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden flex flex-col z-50'
    : 'fixed bottom-4 right-4 w-96 h-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden flex flex-col z-50';

  if (!isVisible) {
    return (
      <button
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg cursor-pointer z-50 transition-all hover:scale-110"
        onClick={() => setIsVisible(true)}
        title="Show Debug Panel"
        aria-label="Open Debug Panel"
      >
        <Info className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className={containerClasses}>
      <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-900">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-2 py-1 rounded ${
              activeTab === 'logs'
                ? 'bg-blue-500 text-white'
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            Logs
          </button>
          <button
            onClick={() => setActiveTab('socket')}
            className={`px-2 py-1 rounded flex items-center gap-1 ${
              activeTab === 'socket'
                ? 'bg-blue-500 text-white'
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <Wifi className="w-3 h-3" /> Socket
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? 'Minimize' : 'Maximize'}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {activeTab === 'logs' && (
            <button
              onClick={() => { logger.clearLogHistory(); setLogs([]); }}
              title="Clear Logs"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeTab === 'logs' && (
        <div className="flex-1 overflow-auto p-2 text-xs">
          {logs.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 italic">No logs yet</div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`mb-1 p-1 rounded ${
                  log.level === 'error'
                    ? 'bg-red-100 dark:bg-red-900/20'
                    : log.level === 'debug'
                    ? 'bg-blue-100 dark:bg-blue-900/20'
                    : 'bg-green-100 dark:bg-green-900/20'
                }`}
              >
                <div className="font-mono">
                  <span className="opacity-50 text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`ml-1 font-bold ${
                    log.level === 'error'
                      ? 'text-red-600 dark:text-red-400'
                      : log.level === 'debug'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    [{log.level}]
                  </span>
                  <span className="ml-1">{log.message}</span>
                </div>
                {log.args.length > 0 && (
                  <div className="ml-4 font-mono opacity-75 overflow-x-auto whitespace-pre-wrap">
                    {log.args.join(' ')}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'socket' && (
        <div className="flex-1 overflow-auto p-2 text-xs">
          <div className="flex flex-col gap-3">
            {/* Socket Status */}
            <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded">
              <div className="font-bold mb-1">Socket Status</div>
              <div className="grid grid-cols-2 gap-1">
                <div>Connected:</div>
                <div className={socketStatus.connected ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  {socketStatus.connected ? "✅ Yes" : "❌ No"}
                </div>
                <div>Queued Messages:</div>
                <div className={socketStatus.queuedMessages > 0 ? "text-yellow-600" : "text-gray-600"}>
                  {socketStatus.queuedMessages}
                </div>
                <div>Reconnect Attempts:</div>
                <div className={socketStatus.reconnectAttempts > 0 ? "text-orange-600" : "text-gray-600"}>
                  {socketStatus.reconnectAttempts}
                </div>
                <div>URL:</div>
                <div className="truncate text-blue-600">{socketStatus.socketUrl}</div>
              </div>
            </div>

            {/* Connection Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-700">
              <div className="font-bold mb-1 text-blue-700 dark:text-blue-300">Expected Behavior</div>
              <div className="text-xs">
                <p className="mb-1">✅ Socket should connect to: <code className="bg-gray-200 dark:bg-gray-700 px-1">{window.location.origin}/socket.io</code></p>
                <p className="mb-1">✅ Backend server should be on: <code className="bg-gray-200 dark:bg-gray-700 px-1">http://localhost:3001</code></p>
                <p>✅ Vite proxy should forward <code className="bg-gray-200 dark:bg-gray-700 px-1">/socket.io</code> to backend</p>
              </div>
            </div>

            {/* Socket Actions */}
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => {
                  try {
                    logger.info('Getting socket connection status');
                    const status = chatClient.getStatus();
                    logger.info('Socket status:', JSON.stringify(status, null, 2));
                    const isConnected = chatClient.isSocketConnected();
                    logger.info('Is socket connected?', isConnected);
                  } catch (error) {
                    logger.error('Error getting socket info:', error);
                  }
                }}
                className="p-2 rounded bg-purple-200 text-purple-800 hover:bg-purple-300 flex items-center justify-center"
              >
                <Info className="w-3 h-3 mr-1" /> Log Socket Info
              </button>

              <button
                onClick={() => {
                  try {
                    logger.info('Testing Socket.IO server connectivity');
                    logger.info(`Checking: ${window.location.origin}/socket.io/`);

                    // Log current socket state
                    const status = chatClient.getStatus();
                    logger.info('Current socket status:', JSON.stringify(status, null, 2));

                    // Check if socket is connected
                    if (status.connected) {
                      logger.info('✅ Socket is connected!');
                    } else {
                      logger.error('❌ Socket is NOT connected');
                      logger.info('💡 Possible issues:');
                      logger.info('  1. Backend server not running on port 3001');
                      logger.info('  2. Socket.IO proxy not configured in vite.config.js');
                      logger.info('  3. CORS issues');
                      logger.info('  4. Authentication token not provided');
                    }
                  } catch (error) {
                    logger.error('Error checking socket server:', error);
                  }
                }}
                className="p-2 rounded bg-green-200 text-green-800 hover:bg-green-300 flex items-center justify-center"
              >
                <Info className="w-3 h-3 mr-1" /> Check Connection
              </button>

              <button
                onClick={() => {
                  try {
                    logger.info('Clearing message queue');
                    chatClient.clearMessageQueue();
                    logger.info('✅ Message queue cleared');
                  } catch (error) {
                    logger.error('Error clearing queue:', error);
                  }
                }}
                className="p-2 rounded bg-yellow-200 text-yellow-800 hover:bg-yellow-300 flex items-center justify-center"
                disabled={socketStatus.queuedMessages === 0}
              >
                <Trash2 className="w-3 h-3 mr-1" /> Clear Queue ({socketStatus.queuedMessages})
              </button>
            </div>

            {/* Troubleshooting Guide */}
            <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded border border-orange-200 dark:border-orange-700">
              <div className="font-bold mb-1 text-orange-700 dark:text-orange-300">Troubleshooting</div>
              <div className="text-xs space-y-1">
                <p>If socket is not connecting:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Check backend server is running: <code className="bg-gray-200 dark:bg-gray-700 px-1">npm start</code></li>
                  <li>Verify vite.config.js has /socket.io proxy</li>
                  <li>Check browser console for errors</li>
                  <li>Check browser Network tab for socket.io requests</li>
                  <li>Verify you're logged in (auth token required)</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
