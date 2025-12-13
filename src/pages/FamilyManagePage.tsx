import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ParentDashboard } from '../components/family/ParentDashboard';
import { Button } from '../components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';

/**
 * FamilyManagePage - Wrapper page for ParentDashboard component
 * 
 * Provides navigation and authentication checks for family management
 */
const FamilyManagePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user is a parent (using new relationship field)
  // MIGRATED: Uses relationship field instead of old flags
  const isParent = user?.relationship === 'parent';

  if (!isParent) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-2xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-6 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>

          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="ml-2">
              This feature is only available for family account holders. 
              Please contact support if you believe this is an error.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-bold">Family Management</h1>
            <div className="w-32" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Parent Dashboard Component */}
      <div className="container mx-auto px-6 py-8">
        <ParentDashboard />
      </div>
    </div>
  );
};

export default FamilyManagePage;
