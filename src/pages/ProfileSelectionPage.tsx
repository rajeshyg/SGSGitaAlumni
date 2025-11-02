import { useNavigate } from 'react-router-dom';
import FamilyProfileSelector from '../components/family/FamilyProfileSelector';
import { useAuth } from '../contexts/AuthContext';
import type { FamilyMember } from '../services/familyMemberService';

/**
 * ProfileSelectionPage - Netflix-style profile selection for family accounts
 * 
 * This page is shown after login for family accounts (is_family_account=1).
 * Users with multiple family members under one email credential select which
 * family member profile they want to use.
 */
export function ProfileSelectionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Verify this is a family account
  const isFamilyAccount = user?.is_family_account === 1 || user?.is_family_account === true;

  if (!isFamilyAccount) {
    // If not a family account, redirect to dashboard
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleProfileSelected = (_member: FamilyMember) => {
    // After profile selection, navigate to appropriate dashboard
    const userRole = user?.role?.toLowerCase();
    const defaultRedirect = userRole === 'admin' ? '/admin' : '/dashboard';
    navigate(defaultRedirect, { replace: true });
  };

  return (
    <FamilyProfileSelector 
      onProfileSelected={handleProfileSelected}
      showAddButton={true}
    />
  );
}

export default ProfileSelectionPage;
