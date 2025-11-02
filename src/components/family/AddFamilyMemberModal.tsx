import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createFamilyMember, type CreateFamilyMemberRequest } from '../../services/familyMemberService';

interface AddFamilyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded?: () => void;
}

/**
 * Modal for adding a new family member
 * 
 * Features:
 * - Collects name, birthdate, relationship
 * - Auto-calculates age and access level
 * - Shows COPPA messaging for different age groups
 */
const AddFamilyMemberModal: React.FC<AddFamilyMemberModalProps> = ({
  isOpen,
  onClose,
  onMemberAdded
}) => {
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
          <h2 className="text-2xl font-bold text-gray-900">Add Family Member</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              placeholder="Auto-generated from first & last name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Relationship */}
          <div>
            <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 mb-1">
              Relationship
            </label>
            <select
              id="relationship"
              name="relationship"
              value={formData.relationship}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="child">Child</option>
              <option value="spouse">Spouse</option>
              <option value="sibling">Sibling</option>
              <option value="guardian">Guardian</option>
            </select>
          </div>

          {/* Birth Date */}
          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
              Birth Date
            </label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {ageMessage && (
              <p className={`text-sm mt-2 ${ageMessage.color} font-medium`}>
                {ageMessage.text}
              </p>
            )}
          </div>

          {/* COPPA Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
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
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFamilyMemberModal;
