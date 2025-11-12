import React, { useState, useEffect } from 'react';
import { useAuth, StorageUtils } from '../contexts/AuthContext';
import { AlertCircle, CheckCircle, XCircle, Eye, EyeOff, RefreshCw } from 'lucide-react';

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

/**
 * Mobile Debug Overlay Component
 * 
 * Displays authentication state and storage information on mobile devices
 * for debugging login redirect issues. Shows:
 * - Authentication status
 * - Token presence and length
 * - Storage availability (localStorage/sessionStorage)
 * - User information
 * - Server-side auth verification
 */
export const MobileDebugOverlay: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [serverVerification, setServerVerification] = useState<AuthVerificationResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Storage state
  const [storageInfo, setStorageInfo] = useState({
    authToken: '',
    refreshToken: '',
    localStorageAvailable: false,
    sessionStorageAvailable: false,
    localStorageKeys: [] as string[],
    sessionStorageKeys: [] as string[]
  });

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
      console.error('[MobileDebug] localStorage not available:', e);
    }

    try {
      sessionStorage.setItem('test', 'test');
      sessionStorage.removeItem('test');
      sessionStorageAvailable = true;
      sessionStorageKeys = Object.keys(sessionStorage);
    } catch (e) {
      console.error('[MobileDebug] sessionStorage not available:', e);
    }

    setStorageInfo({
      authToken,
      refreshToken,
      localStorageAvailable,
      sessionStorageAvailable,
      localStorageKeys,
      sessionStorageKeys
    });
  };

  // Verify auth with server
  const verifyWithServer = async () => {
    setIsVerifying(true);
    try {
      const token = StorageUtils.getItem('authToken');
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setServerVerification(data);
      console.log('[MobileDebug] Server verification:', data);
    } catch (error) {
      console.error('[MobileDebug] Server verification failed:', error);
      setServerVerification({
        authenticated: false,
        reason: 'network_error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Update on mount and when auth state changes
  useEffect(() => {
    updateStorageInfo();
    const interval = setInterval(updateStorageInfo, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  // Auto-show on mobile if not authenticated
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && !isAuthenticated && !isLoading) {
      setIsVisible(true);
    }
  }, [isAuthenticated, isLoading]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg z-50 hover:bg-blue-700 transition-colors"
        aria-label="Show debug info"
      >
        <Eye size={20} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 text-white p-4 overflow-auto z-50 text-xs font-mono">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-600">
          <h2 className="text-lg font-bold">🔍 Mobile Debug Info</h2>
          <button
            onClick={() => setIsVisible(false)}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            aria-label="Hide debug overlay"
          >
            <EyeOff size={16} />
          </button>
        </div>

        {/* Refresh Button */}
        <div className="space-y-2 mb-4">
          <button
            onClick={() => {
              updateStorageInfo();
              verifyWithServer();
            }}
            disabled={isVerifying}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-600 flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} className={isVerifying ? 'animate-spin' : ''} />
            {isVerifying ? 'Verifying...' : 'Refresh & Verify with Server'}
          </button>
          
          <button
            onClick={async () => {
              const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
              alert(`Testing connection to: ${apiUrl}/api/auth/verify`);
              try {
                const response = await fetch(`${apiUrl}/api/auth/verify`, {
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();
                alert(`✅ SUCCESS! Status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`);
              } catch (error) {
                alert(`❌ FAILED!\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }}
            className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
          >
            🧪 Test Direct API Connection
          </button>
        </div>

        {/* Authentication Status */}
        <div className="mb-4 p-3 bg-gray-800 rounded">
          <h3 className="font-bold mb-2 flex items-center gap-2">
            {isAuthenticated ? (
              <CheckCircle size={16} className="text-green-500" />
            ) : (
              <XCircle size={16} className="text-red-500" />
            )}
            Client Auth Status
          </h3>
          <div className="space-y-1">
            <div>Authenticated: <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>{isAuthenticated ? 'YES' : 'NO'}</span></div>
            <div>Loading: <span className={isLoading ? 'text-yellow-400' : 'text-green-400'}>{isLoading ? 'YES' : 'NO'}</span></div>
            {user && (
              <>
                <div>User ID: {user.id}</div>
                <div>Email: {user.email}</div>
                <div>Role: {user.role}</div>
                <div>Name: {user.firstName} {user.lastName}</div>
              </>
            )}
          </div>
        </div>

        {/* Server Verification */}
        {serverVerification && (
          <div className="mb-4 p-3 bg-gray-800 rounded">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              {serverVerification.authenticated ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <AlertCircle size={16} className="text-red-500" />
              )}
              Server Auth Status
            </h3>
            <div className="space-y-1">
              <div>Authenticated: <span className={serverVerification.authenticated ? 'text-green-400' : 'text-red-400'}>
                {serverVerification.authenticated ? 'YES' : 'NO'}
              </span></div>
              {serverVerification.reason && (
                <div>Reason: <span className="text-yellow-400">{serverVerification.reason}</span></div>
              )}
              {serverVerification.message && (
                <div>Message: <span className="text-gray-400">{serverVerification.message}</span></div>
              )}
              {serverVerification.user && (
                <>
                  <div>Server User ID: {serverVerification.user.id}</div>
                  <div>Server Email: {serverVerification.user.email}</div>
                  <div>Server Role: {serverVerification.user.role}</div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Token Information */}
        <div className="mb-4 p-3 bg-gray-800 rounded">
          <h3 className="font-bold mb-2">🔑 Tokens</h3>
          <div className="space-y-1">
            <div>Auth Token: {storageInfo.authToken ? (
              <span className="text-green-400">Present ({storageInfo.authToken.length} chars)</span>
            ) : (
              <span className="text-red-400">MISSING</span>
            )}</div>
            <div>Refresh Token: {storageInfo.refreshToken ? (
              <span className="text-green-400">Present ({storageInfo.refreshToken.length} chars)</span>
            ) : (
              <span className="text-red-400">MISSING</span>
            )}</div>
            {storageInfo.authToken && (
              <div className="mt-2 p-2 bg-gray-900 rounded break-all text-[10px]">
                Token: {storageInfo.authToken.substring(0, 50)}...
              </div>
            )}
          </div>
        </div>

        {/* Storage Availability */}
        <div className="mb-4 p-3 bg-gray-800 rounded">
          <h3 className="font-bold mb-2">💾 Storage</h3>
          <div className="space-y-1">
            <div>localStorage: {storageInfo.localStorageAvailable ? (
              <span className="text-green-400">Available ({storageInfo.localStorageKeys.length} keys)</span>
            ) : (
              <span className="text-red-400">NOT AVAILABLE</span>
            )}</div>
            <div>sessionStorage: {storageInfo.sessionStorageAvailable ? (
              <span className="text-green-400">Available ({storageInfo.sessionStorageKeys.length} keys)</span>
            ) : (
              <span className="text-red-400">NOT AVAILABLE</span>
            )}</div>
            {storageInfo.localStorageKeys.length > 0 && (
              <div className="mt-2">
                <div className="text-gray-400">localStorage keys:</div>
                <div className="pl-2 text-[10px]">{storageInfo.localStorageKeys.join(', ')}</div>
              </div>
            )}
            {storageInfo.sessionStorageKeys.length > 0 && (
              <div className="mt-2">
                <div className="text-gray-400">sessionStorage keys:</div>
                <div className="pl-2 text-[10px]">{storageInfo.sessionStorageKeys.join(', ')}</div>
              </div>
            )}
          </div>
        </div>

        {/* Browser Info */}
        <div className="mb-4 p-3 bg-gray-800 rounded">
          <h3 className="font-bold mb-2">🌐 Browser</h3>
          <div className="space-y-1 break-all text-[10px]">
            <div>UserAgent: {navigator.userAgent}</div>
            <div>Location: {window.location.href}</div>
            <div>Timestamp: {new Date().toISOString()}</div>
          </div>
        </div>

        {/* Diagnostic Summary */}
        <div className="p-3 bg-yellow-900 border border-yellow-600 rounded">
          <h3 className="font-bold mb-2">📊 Diagnostic Summary</h3>
          <div className="space-y-1 text-[11px]">
            {!storageInfo.authToken && (
              <div className="text-red-300">⚠️ Auth token is missing - login may have failed to store token</div>
            )}
            {!storageInfo.localStorageAvailable && !storageInfo.sessionStorageAvailable && (
              <div className="text-red-300">⚠️ Both localStorage and sessionStorage are unavailable</div>
            )}
            {isAuthenticated && !storageInfo.authToken && (
              <div className="text-red-300">⚠️ Client thinks user is authenticated but no token found in storage</div>
            )}
            {!isAuthenticated && storageInfo.authToken && (
              <div className="text-red-300">⚠️ Token exists in storage but client shows not authenticated</div>
            )}
            {serverVerification && !serverVerification.authenticated && storageInfo.authToken && (
              <div className="text-red-300">⚠️ Token exists but server says invalid: {serverVerification.reason}</div>
            )}
            {isAuthenticated && storageInfo.authToken && (!serverVerification || serverVerification.authenticated) && (
              <div className="text-green-300">✅ Everything looks good!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
