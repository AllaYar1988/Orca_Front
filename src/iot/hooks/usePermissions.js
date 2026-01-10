import { useMemo } from 'react';
import { useIotAuth } from '../context/IotAuthContext';
import {
  ROLES,
  PERMISSIONS,
  hasPermission as checkPermission,
  canEdit as checkCanEdit,
  canManage as checkCanManage,
  isViewer as checkIsViewer,
  ROLE_LABELS
} from '../config/roles';

/**
 * Hook for checking user permissions
 * @returns {Object} Permission checking functions and user role info
 */
export const usePermissions = () => {
  const { iotUser } = useIotAuth();

  // Get user's role (default to 'user' if not set)
  const role = useMemo(() => {
    return iotUser?.role || ROLES.USER;
  }, [iotUser]);

  // Get role label for display
  const roleLabel = useMemo(() => {
    return ROLE_LABELS[role] || 'User';
  }, [role]);

  // Check if user has a specific permission
  const hasPermission = (permission) => {
    return checkPermission(role, permission);
  };

  // Check if user can edit (admin or user, not viewer)
  const canEdit = useMemo(() => {
    return checkCanEdit(role);
  }, [role]);

  // Check if user can manage (admin only)
  const canManage = useMemo(() => {
    return checkCanManage(role);
  }, [role]);

  // Check if user is viewer (read-only)
  const isViewer = useMemo(() => {
    return checkIsViewer(role);
  }, [role]);

  // Check if user is admin
  const isAdmin = useMemo(() => {
    return role === ROLES.ADMIN;
  }, [role]);

  // Check if user is regular user role
  const isUser = useMemo(() => {
    return role === ROLES.USER;
  }, [role]);

  return {
    role,
    roleLabel,
    hasPermission,
    canEdit,
    canManage,
    isViewer,
    isAdmin,
    isUser,
    // Export permission constants for convenience
    PERMISSIONS
  };
};

export default usePermissions;
