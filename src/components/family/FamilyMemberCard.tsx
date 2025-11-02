import React from 'react';
import { Edit, Trash2, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import type { FamilyMember } from '../../services/familyMemberService';

interface FamilyMemberCardProps {
  member: FamilyMember;
  onEdit?: (member: FamilyMember) => void;
  onDelete?: (memberId: string) => void;
  onGrantConsent?: (memberId: string) => void;
  onRevokeConsent?: (memberId: string) => void;
  showActions?: boolean;
}

export const FamilyMemberCard: React.FC<FamilyMemberCardProps> = ({
  member,
  onEdit,
  onDelete,
  onGrantConsent,
  onRevokeConsent,
  showActions = true,
}) => {
  // Get access level color
  const getAccessLevelColor = () => {
    if (!member.can_access_platform) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (member.requires_parent_consent) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    return 'bg-green-100 text-green-800 border-green-200';
  };

  // Get access level icon
  const getAccessLevelIcon = () => {
    if (!member.can_access_platform) {
      return <XCircle className="w-4 h-4" />;
    }
    if (member.requires_parent_consent) {
      return <AlertCircle className="w-4 h-4" />;
    }
    return <CheckCircle className="w-4 h-4" />;
  };

  // Get access level text
  const getAccessLevelText = () => {
    if (!member.can_access_platform) {
      return 'Cannot Access';
    }
    if (member.requires_parent_consent) {
      if (member.parent_consent_given) {
        return 'Supervised Access';
      }
      return 'Needs Consent';
    }
    return 'Full Access';
  };

  // Get status badge
  const getStatusBadge = () => {
    if (member.status === 'inactive') {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
          Inactive
        </span>
      );
    }
    if (member.is_primary_contact) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
          Parent
        </span>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="flex items-start gap-4">
        {/* Profile Image/Avatar */}
        <div className="flex-shrink-0">
          {member.profile_image_url ? (
            <img
              src={member.profile_image_url}
              alt={member.display_name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {member.first_name.charAt(0).toUpperCase()}
                {member.last_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Member Info */}
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-grow min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {member.display_name}
              </h3>
              <p className="text-sm text-gray-600">
                {member.first_name} {member.last_name}
              </p>
            </div>
            {getStatusBadge()}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <p className="text-xs text-gray-500">Age</p>
              <p className="text-sm font-medium text-gray-900">{member.current_age} years</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Relationship</p>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {member.relationship}
              </p>
            </div>
          </div>

          {/* Access Level */}
          <div className="mt-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${getAccessLevelColor()}`}>
              {getAccessLevelIcon()}
              <span className="text-sm font-medium">{getAccessLevelText()}</span>
            </div>
          </div>

          {/* Consent Renewal Warning */}
          {member.consent_renewal_required && (
            <div className="mt-3 flex items-center gap-2 text-yellow-700 bg-yellow-50 px-3 py-2 rounded border border-yellow-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs">Consent renewal required</span>
            </div>
          )}

          {/* Actions */}
          {showActions && !member.is_primary_contact && (
            <div className="mt-4 flex items-center gap-2">
              {/* Edit Button */}
              {onEdit && (
                <button
                  onClick={() => onEdit(member)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                  title="Edit member"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}

              {/* Consent Actions for 14-17 year olds */}
              {member.requires_parent_consent && (
                <>
                  {member.parent_consent_given ? (
                    onRevokeConsent && (
                      <button
                        onClick={() => onRevokeConsent(member.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-50 rounded hover:bg-orange-100 transition-colors"
                        title="Revoke consent"
                      >
                        <XCircle className="w-4 h-4" />
                        Revoke Consent
                      </button>
                    )
                  ) : (
                    onGrantConsent && (
                      <button
                        onClick={() => onGrantConsent(member.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded hover:bg-green-100 transition-colors"
                        title="Grant consent"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Grant Consent
                      </button>
                    )
                  )}
                </>
              )}

              {/* Delete Button */}
              {onDelete && (
                <button
                  onClick={() => onDelete(member.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors ml-auto"
                  title="Delete member"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
