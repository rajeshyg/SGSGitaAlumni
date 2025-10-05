// ============================================================================
// OTP TEST PANEL COMPONENT
// ============================================================================
// Admin UI component for testing OTP functionality
// Displays generated OTP codes and provides copy-to-clipboard functionality

import React, { useState } from 'react';
import { Copy, Check, Smartphone, Mail, MessageSquare } from 'lucide-react';
import { MultiFactorOTPService, OTPMethod } from '../../services/MultiFactorOTPService';

interface AdminOTPTestData {
  id: string;
  email: string;
  otpCode: string;
  generatedAt: Date;
  expiresAt: Date;
  type: 'email' | 'sms' | 'totp';
  secret?: string;
  qrCodeUrl?: string;
  testUrl?: string;
}

const OTPTestPanel: React.FC = () => {
  const [testEmail, setTestEmail] = useState('');
  const [testData, setTestData] = useState<AdminOTPTestData[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const multiFactorOTPService = new MultiFactorOTPService();

  const generateTestOTP = async (email: string, method: OTPMethod) => {
    if (!email) return;

    setLoading(true);
    try {
      const result = await multiFactorOTPService.generateTestOTP(email, method);

      const testItem: AdminOTPTestData = {
        id: `test-${Date.now()}-${method}`,
        email: result.email,
        otpCode: result.otpCode,
        generatedAt: result.generatedAt,
        expiresAt: result.expiresAt,
        type: result.type,
        secret: result.secret,
        qrCodeUrl: result.qrCodeUrl,
        testUrl: result.type === 'email' ? `/otp-test?code=${result.otpCode}&email=${email}` : undefined
      };

      setTestData(prev => [testItem, ...prev.slice(0, 9)]); // Keep last 10 items
    } catch (error) {
      console.error('Failed to generate test OTP:', error);
      // In a real app, show error toast
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4" />;
      case 'totp':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const getMethodColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'sms':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'totp':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">OTP Testing Panel</h2>
        <p className="text-gray-600">
          Generate and test OTP codes for development and debugging purposes.
        </p>
      </div>

      {/* Test Controls */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Generate Test OTP</h3>

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="email"
              placeholder="Test email address"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => generateTestOTP(testEmail, 'email')}
              disabled={loading || !testEmail}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email OTP
            </button>

            <button
              onClick={() => generateTestOTP(testEmail, 'sms')}
              disabled={loading || !testEmail}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              SMS OTP
            </button>

            <button
              onClick={() => generateTestOTP(testEmail, 'totp')}
              disabled={loading || !testEmail}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              TOTP Setup
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-sm text-gray-600">
            Generating OTP...
          </div>
        )}
      </div>

      {/* Test Results */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Generated OTPs ({testData.length})
        </h3>

        {testData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No OTPs generated yet. Use the controls above to create test OTPs.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {testData.map((item) => (
              <div
                key={item.id}
                className={`border rounded-lg p-4 ${getMethodColor(item.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getMethodIcon(item.type)}
                    <div>
                      <div className="font-semibold text-gray-900">
                        {item.type.toUpperCase()} OTP
                      </div>
                      <div className="text-sm text-gray-600">
                        {item.email}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-gray-900">
                      {item.otpCode}
                    </div>
                    <div className="text-xs text-gray-500">
                      Expires in: {formatTimeRemaining(item.expiresAt)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Generated: {item.generatedAt.toLocaleTimeString()}
                  </div>

                  <div className="flex gap-2">
                    {item.testUrl && (
                      <a
                        href={item.testUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-2 py-1 bg-white text-blue-600 rounded border hover:bg-blue-50 transition-colors"
                      >
                        Test Link
                      </a>
                    )}

                    {item.qrCodeUrl && (
                      <a
                        href={item.qrCodeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-2 py-1 bg-white text-purple-600 rounded border hover:bg-purple-50 transition-colors"
                      >
                        QR Code
                      </a>
                    )}

                    <button
                      onClick={() => copyToClipboard(item.otpCode, item.id)}
                      className="flex items-center gap-1 text-xs px-2 py-1 bg-white text-gray-600 rounded border hover:bg-gray-50 transition-colors"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {item.secret && (
                  <div className="mt-2 text-xs text-gray-500">
                    <strong>Secret:</strong> {item.secret}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear Button */}
      {testData.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setTestData([])}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Clear All Test OTPs
          </button>
        </div>
      )}
    </div>
  );
};

export default OTPTestPanel;