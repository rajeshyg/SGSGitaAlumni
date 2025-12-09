import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Legacy route wrapper: redirect to unified profile hub
const FamilySettingsPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/onboarding', { replace: true });
  }, [navigate]);

  return null;
};

export default FamilySettingsPage;
