import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Legacy route wrapper: redirect all profile selection requests to the unified hub
export function ProfileSelectionPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/onboarding', { replace: true });
  }, [navigate]);

  return null;
}

export default ProfileSelectionPage;
