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

  console.log('[ProfileSelectionPage] 🔍 Component loaded');
  console.log('[ProfileSelectionPage] User:', user);
  console.log('[ProfileSelectionPage] is_family_account:', user?.is_family_account);
  console.log('[ProfileSelectionPage] Type:', typeof user?.is_family_account);

  // Verify this is a family account
  const isFamilyAccount = user?.is_family_account === 1 || user?.is_family_account === true;
  
  console.log('[ProfileSelectionPage] isFamilyAccount check:', isFamilyAccount);

  if (!isFamilyAccount) {
    console.log('[ProfileSelectionPage] ❌ Not a family account, redirecting to dashboard');
    // If not a family account, redirect to dashboard
    navigate('/dashboard', { replace: true });
    return null;
  }

  console.log('[ProfileSelectionPage] ✅ Family account verified, showing profile selector');

  const handleProfileSelected = (_member: FamilyMember) => {
    console.log('[ProfileSelectionPage] Profile selected:', _member);
    // After profile selection, navigate to appropriate dashboard
    const userRole = user?.role?.toLowerCase();
    const defaultRedirect = userRole === 'admin' ? '/admin' : '/dashboard';
    console.log('[ProfileSelectionPage] Redirecting to:', defaultRedirect);
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
