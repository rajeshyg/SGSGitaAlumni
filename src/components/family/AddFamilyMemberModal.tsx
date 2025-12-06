import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createFamilyMember, updateBirthDate, type CreateFamilyMemberRequest, type FamilyMember } from '../../services/familyMemberService';

interface AddFamilyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded?: () => void;
  /** For edit mode: pass the member to edit (only birth date can be updated) */
  editMember?: FamilyMember | null;
  /** Called when birth date is updated in edit mode */
  onBirthDateUpdated?: (updatedMember: FamilyMember) => void;
}

/**
 * Modal for adding a new family member OR editing birth date
 *
 * Features:
 * - Collects name, birthdate, relationship (add mode)
 * - Collects birth date only (edit mode when editMember is provided)
 * - Auto-calculates age and access level
 * - Shows COPPA messaging for different age groups
 */
const AddFamilyMemberModal: React.FC<AddFamilyMemberModalProps> = ({
  isOpen,
  onClose,
  onMemberAdded,
  editMember,
  onBirthDateUpdated
}) => {
  const isEditMode = !!editMember;
  const [formData, setFormData] = useState<CreateFamilyMemberRequest>({
    firstName: '',
    lastName: '',
    displayName: '',
    birthDate: '',
    relationship: 'child'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);

  // Populate form when in edit mode
  useEffect(() => {
    if (editMember && isOpen) {
      setFormData({
        firstName: editMember.first_name,
        lastName: editMember.last_name,
        displayName: editMember.display_name,
        birthDate: editMember.birth_date || '',
        relationship: editMember.relationship === 'self' ? 'child' : editMember.relationship
      });
      // Calculate age if birth date exists
      if (editMember.birth_date) {
        setCalculatedAge(calculateAge(editMember.birth_date));
      }
    } else if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        firstName: '',
        lastName: '',
        displayName: '',
        birthDate: '',
        relationship: 'child'
      });
      setCalculatedAge(null);
      setError(null);
    }
  }, [editMember, isOpen]);

  const calculateAge = (birthDate: string): number | null => {
    if (!birthDate) return null;
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-generate display name
    if (name === 'firstName' || name === 'lastName') {
      const firstName = name === 'firstName' ? value : formData.firstName;
      const lastName = name === 'lastName' ? value : formData.lastName;
      setFormData(prev => ({
        ...prev,
        displayName: `${firstName} ${lastName}`.trim()
      }));
    }
    
    // Calculate age when birthdate changes
    if (name === 'birthDate') {
      const age = calculateAge(value);
      setCalculatedAge(age);
    }
  };

  const getAgeMessage = (): { text: string; color: string } | null => {
    if (calculatedAge === null) return null;
    
    if (calculatedAge < 14) {
      return {
        text: 'Under 14: This member will not be able to access the platform (COPPA compliance)',
        color: 'text-red-500'
      };
    } else if (calculatedAge < 18) {
      return {
        text: `Age ${calculatedAge}: Parent consent required for platform access`,
        color: 'text-yellow-500'
      };
    } else {
      return {
        text: `Age ${calculatedAge}: Full platform access will be granted`,
        color: 'text-green-500'
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Edit mode: only update birth date
    if (isEditMode && editMember) {
      if (!formData.birthDate) {
        setError('Birth date is required');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const updatedMember = await updateBirthDate(editMember.id, formData.birthDate);

        if (onBirthDateUpdated) {
          onBirthDateUpdated(updatedMember);
        }

        onClose();
      } catch (err) {
        setError('Failed to update birth date');
        console.error('Error updating birth date:', err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Add mode: create new member
    if (!formData.firstName || !formData.lastName) {
      setError('First name and last name are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createFamilyMember(formData);

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        displayName: '',
        birthDate: '',
        relationship: 'child'
      });
      setCalculatedAge(null);

      if (onMemberAdded) {
        onMemberAdded();
      }

      onClose();
    } catch (err) {
      setError('Failed to add family member');
      console.error('Error adding family member:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const ageMessage = getAgeMessage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-[--foreground]">
            {isEditMode ? 'Age Verification Required' : 'Add Family Member'}
          </h2>
          <button
            onClick={onClose}
            className="text-[--muted-foreground] hover:text-[--foreground] transition-colors"
            title="Close"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-[--destructive-bg] border border-[--destructive-border] text-[--destructive-foreground] px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Edit Mode: Show member info card */}
          {isEditMode && editMember && (
            <div className="bg-[--muted] rounded-lg p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl font-bold">
                  {editMember.first_name.charAt(0).toUpperCase()}
                  {editMember.last_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-[--foreground]">{editMember.display_name}</p>
                <p className="text-sm text-[--muted-foreground]">
                  Please provide your birth date to verify your age
                </p>
              </div>
            </div>
          )}

          {/* Add Mode: Name fields */}
          {!isEditMode && (
            <>
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-[--muted-foreground] mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-[--border] rounded-md focus:outline-none focus:ring-2 focus:ring-[--ring]"
                />
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-[--muted-foreground] mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-[--border] rounded-md focus:outline-none focus:ring-2 focus:ring-[--ring]"
                />
              </div>

              {/* Display Name */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-[--muted-foreground] mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="Auto-generated from first & last name"
                  className="w-full px-3 py-2 border border-[--border] rounded-md focus:outline-none focus:ring-2 focus:ring-[--ring]"
                />
              </div>

              {/* Relationship */}
              <div>
                <label htmlFor="relationship" className="block text-sm font-medium text-[--muted-foreground] mb-1">
                  Relationship
                </label>
                <select
                  id="relationship"
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-[--border] rounded-md focus:outline-none focus:ring-2 focus:ring-[--ring]"
                >
                  <option value="child">Child</option>
                  <option value="spouse">Spouse</option>
                  <option value="sibling">Sibling</option>
                  <option value="guardian">Guardian</option>
                </select>
              </div>
            </>
          )}

          {/* Birth Date - always shown */}
          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-[--muted-foreground] mb-1">
              Birth Date {isEditMode ? '*' : ''}
            </label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              max={new Date().toISOString().split('T')[0]}
              required={isEditMode}
              className="w-full px-3 py-2 border border-[--border] rounded-md focus:outline-none focus:ring-2 focus:ring-[--ring]"
            />
            {ageMessage && (
              <p className={`text-sm mt-2 ${ageMessage.color} font-medium`}>
                {ageMessage.text}
              </p>
            )}
          </div>

          {/* COPPA Notice */}
          <div className="bg-[--info-bg] border border-[--info-border] rounded-md p-4">
            <p className="text-sm text-[--info-foreground]">
              <strong>Age Verification:</strong> Members under 14 cannot access the platform per COPPA requirements.
              Members aged 14-17 require parent consent.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-[--border] rounded-md text-[--muted-foreground] hover:bg-[--muted] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (isEditMode && !formData.birthDate)}
              className="px-4 py-2 bg-[--primary] text-[--primary-foreground] rounded-md hover:bg-[--primary]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? (isEditMode ? 'Verifying...' : 'Adding...')
                : (isEditMode ? 'Verify Age' : 'Add Member')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFamilyMemberModal;
