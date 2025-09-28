// ============================================================================
// ACCESS CONTROL SERVICE
// ============================================================================
// Role-Based Access Control (RBAC) implementation

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage' | 'view' | 'edit';
  conditions?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  hierarchy: string[]; // Parent role IDs
  description?: string;
}

export interface UserPermissions {
  userId: string;
  roles: string[];
  directPermissions: Permission[];
  effectivePermissions: Permission[];
}

export interface AccessRequest {
  userId: string;
  resource: string;
  action: string;
  context?: Record<string, any>;
}

export interface AccessDecision {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: Permission[];
  userPermissions?: Permission[];
}

export class AccessControlService {
  private roles: Map<string, Role> = new Map();
  private userPermissions: Map<string, UserPermissions> = new Map();

  /**
   * Add a role to the system
   */
  addRole(role: Role): void {
    this.roles.set(role.id, role);
  }

  /**
   * Remove a role from the system
   */
  removeRole(roleId: string): void {
    this.roles.delete(roleId);
    // Remove role from all users
    for (const [userId, userPerms] of this.userPermissions) {
      userPerms.roles = userPerms.roles.filter(role => role !== roleId);
      this.updateEffectivePermissions(userId);
    }
  }

  /**
   * Assign roles to a user
   */
  assignRolesToUser(userId: string, roleIds: string[]): void {
    let userPerms = this.userPermissions.get(userId);
    if (!userPerms) {
      userPerms = {
        userId,
        roles: [],
        directPermissions: [],
        effectivePermissions: []
      };
      this.userPermissions.set(userId, userPerms);
    }

    userPerms.roles = [...new Set([...userPerms.roles, ...roleIds])];
    this.updateEffectivePermissions(userId);
  }

  /**
   * Remove roles from a user
   */
  removeRolesFromUser(userId: string, roleIds: string[]): void {
    const userPerms = this.userPermissions.get(userId);
    if (userPerms) {
      userPerms.roles = userPerms.roles.filter(role => !roleIds.includes(role));
      this.updateEffectivePermissions(userId);
    }
  }

  /**
   * Grant direct permissions to a user
   */
  grantDirectPermissions(userId: string, permissions: Permission[]): void {
    let userPerms = this.userPermissions.get(userId);
    if (!userPerms) {
      userPerms = {
        userId,
        roles: [],
        directPermissions: [],
        effectivePermissions: []
      };
      this.userPermissions.set(userId, userPerms);
    }

    // Add permissions, avoiding duplicates
    for (const permission of permissions) {
      if (!userPerms.directPermissions.some(p =>
        p.resource === permission.resource && p.action === permission.action
      )) {
        userPerms.directPermissions.push(permission);
      }
    }

    this.updateEffectivePermissions(userId);
  }

  /**
   * Revoke direct permissions from a user
   */
  revokeDirectPermissions(userId: string, permissions: Permission[]): void {
    const userPerms = this.userPermissions.get(userId);
    if (userPerms) {
      userPerms.directPermissions = userPerms.directPermissions.filter(existing =>
        !permissions.some(revoke =>
          revoke.resource === existing.resource && revoke.action === existing.action
        )
      );
      this.updateEffectivePermissions(userId);
    }
  }

  /**
   * Check if a user has permission for a specific action on a resource
   */
  async checkPermission(request: AccessRequest): Promise<AccessDecision> {
    const userPerms = this.userPermissions.get(request.userId);

    if (!userPerms) {
      return {
        allowed: false,
        reason: 'User not found or no permissions assigned'
      };
    }

    // Check direct permissions first
    const directMatch = userPerms.directPermissions.find(p =>
      this.matchesPermission(p, request.resource, request.action, request.context)
    );

    if (directMatch) {
      return {
        allowed: true,
        userPermissions: [directMatch]
      };
    }

    // Check role-based permissions
    const roleMatches: Permission[] = [];
    for (const roleId of userPerms.roles) {
      const role = this.roles.get(roleId);
      if (role) {
        const rolePermission = role.permissions.find(p =>
          this.matchesPermission(p, request.resource, request.action, request.context)
        );
        if (rolePermission) {
          roleMatches.push(rolePermission);
        }
      }
    }

    if (roleMatches.length > 0) {
      return {
        allowed: true,
        userPermissions: roleMatches
      };
    }

    // Check hierarchical permissions (parent roles)
    const hierarchicalMatches: Permission[] = [];
    for (const roleId of userPerms.roles) {
      const role = this.roles.get(roleId);
      if (role) {
        for (const parentRoleId of role.hierarchy) {
          const parentRole = this.roles.get(parentRoleId);
          if (parentRole) {
            const parentPermission = parentRole.permissions.find(p =>
              this.matchesPermission(p, request.resource, request.action, request.context)
            );
            if (parentPermission) {
              hierarchicalMatches.push(parentPermission);
            }
          }
        }
      }
    }

    if (hierarchicalMatches.length > 0) {
      return {
        allowed: true,
        userPermissions: hierarchicalMatches
      };
    }

    return {
      allowed: false,
      reason: 'Insufficient permissions',
      requiredPermissions: [{
        resource: request.resource,
        action: request.action as any
      }]
    };
  }

  /**
   * Get all effective permissions for a user
   */
  getUserPermissions(userId: string): UserPermissions | null {
    return this.userPermissions.get(userId) || null;
  }

  /**
   * List all available roles
   */
  getAllRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  /**
   * Get a specific role by ID
   */
  getRole(roleId: string): Role | null {
    return this.roles.get(roleId) || null;
  }

  /**
   * Create predefined roles for the alumni system
   */
  initializeDefaultRoles(): void {
    // Admin role - full access
    this.addRole({
      id: 'admin',
      name: 'Administrator',
      permissions: [
        { resource: '*', action: 'manage' }
      ],
      hierarchy: [],
      description: 'Full system access'
    });

    // Alumni role - standard user
    this.addRole({
      id: 'alumni',
      name: 'Alumni Member',
      permissions: [
        { resource: 'profile', action: 'read' },
        { resource: 'profile', action: 'update' },
        { resource: 'posts', action: 'create' },
        { resource: 'posts', action: 'read' },
        { resource: 'posts', action: 'update', conditions: { owner: true } },
        { resource: 'conversations', action: 'create' },
        { resource: 'conversations', action: 'read' },
        { resource: 'directory', action: 'read' }
      ],
      hierarchy: [],
      description: 'Standard alumni member access'
    });

    // Moderator role - content moderation
    this.addRole({
      id: 'moderator',
      name: 'Moderator',
      permissions: [
        { resource: 'posts', action: 'read' },
        { resource: 'posts', action: 'update' },
        { resource: 'posts', action: 'delete' },
        { resource: 'conversations', action: 'read' },
        { resource: 'conversations', action: 'update' },
        { resource: 'reports', action: 'read' },
        { resource: 'reports', action: 'manage' }
      ],
      hierarchy: ['alumni'],
      description: 'Content moderation access'
    });

    // Parent role - for family invitations
    this.addRole({
      id: 'parent',
      name: 'Parent',
      permissions: [
        { resource: 'family', action: 'manage' },
        { resource: 'invitations', action: 'create' },
        { resource: 'children', action: 'read' },
        { resource: 'consent', action: 'manage' }
      ],
      hierarchy: ['alumni'],
      description: 'Parent access for family management'
    });
  }

  /**
   * Check if a permission matches the request
   */
  private matchesPermission(
    permission: Permission,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): boolean {
    // Check resource (support wildcards)
    if (permission.resource !== '*' && permission.resource !== resource) {
      return false;
    }

    // Check action
    if (permission.action !== action && permission.action !== 'manage') {
      return false;
    }

    // Check conditions
    if (permission.conditions && context) {
      for (const [key, expectedValue] of Object.entries(permission.conditions)) {
        if (context[key] !== expectedValue) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Update effective permissions for a user
   */
  private updateEffectivePermissions(userId: string): void {
    const userPerms = this.userPermissions.get(userId);
    if (!userPerms) return;

    const effectivePermissions: Permission[] = [
      ...userPerms.directPermissions
    ];

    // Add permissions from roles
    for (const roleId of userPerms.roles) {
      const role = this.roles.get(roleId);
      if (role) {
        effectivePermissions.push(...role.permissions);

        // Add permissions from parent roles
        for (const parentRoleId of role.hierarchy) {
          const parentRole = this.roles.get(parentRoleId);
          if (parentRole) {
            effectivePermissions.push(...parentRole.permissions);
          }
        }
      }
    }

    // Remove duplicates
    userPerms.effectivePermissions = effectivePermissions.filter((perm, index, arr) =>
      arr.findIndex(p => p.resource === perm.resource && p.action === perm.action) === index
    );
  }
}