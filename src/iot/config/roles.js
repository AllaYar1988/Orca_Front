/**
 * User Roles Configuration
 * Defines access levels and their permissions
 */

// Role constants
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer'
};

// Role display labels
export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.USER]: 'User',
  [ROLES.VIEWER]: 'Viewer'
};

// Role descriptions
export const ROLE_DESCRIPTIONS = {
  [ROLES.ADMIN]: 'Full access: can view, edit, configure, and manage users',
  [ROLES.USER]: 'Standard access: can view and edit devices/settings',
  [ROLES.VIEWER]: 'Read-only access: can only view dashboards and data'
};

// Permission definitions
export const PERMISSIONS = {
  // Viewing permissions
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_DEVICES: 'view_devices',
  VIEW_LOGS: 'view_logs',
  VIEW_CONFIG: 'view_config',

  // Editing permissions
  EDIT_DEVICES: 'edit_devices',
  EDIT_CONFIG: 'edit_config',

  // Management permissions (admin only)
  MANAGE_USERS: 'manage_users',
  MANAGE_COMPANIES: 'manage_companies'
};

// Role-to-permissions mapping
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_DEVICES,
    PERMISSIONS.VIEW_LOGS,
    PERMISSIONS.VIEW_CONFIG,
    PERMISSIONS.EDIT_DEVICES,
    PERMISSIONS.EDIT_CONFIG,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_COMPANIES
  ],
  [ROLES.USER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_DEVICES,
    PERMISSIONS.VIEW_LOGS,
    PERMISSIONS.VIEW_CONFIG,
    PERMISSIONS.EDIT_DEVICES,
    PERMISSIONS.EDIT_CONFIG
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_DEVICES,
    PERMISSIONS.VIEW_LOGS,
    PERMISSIONS.VIEW_CONFIG
  ]
};

/**
 * Check if a role has a specific permission
 * @param {string} role - The user's role
 * @param {string} permission - The permission to check
 * @returns {boolean}
 */
export const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
};

/**
 * Check if a role can edit (admin or user)
 * @param {string} role - The user's role
 * @returns {boolean}
 */
export const canEdit = (role) => {
  return role === ROLES.ADMIN || role === ROLES.USER;
};

/**
 * Check if a role can manage (admin only)
 * @param {string} role - The user's role
 * @returns {boolean}
 */
export const canManage = (role) => {
  return role === ROLES.ADMIN;
};

/**
 * Check if role is viewer (read-only)
 * @param {string} role - The user's role
 * @returns {boolean}
 */
export const isViewer = (role) => {
  return role === ROLES.VIEWER;
};

export default {
  ROLES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  canEdit,
  canManage,
  isViewer
};
