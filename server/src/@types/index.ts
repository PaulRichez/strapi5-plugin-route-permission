import type { Core } from '@strapi/strapi';

export interface StrapiContext {
  strapi: Core.Strapi;
}

export interface Permission {
  action: string;
  role?: any;
}

export interface Role {
  id: number;
  type: string;
  permissions?: Permission[];
}

export interface RoutePermission {
  action: string;
  role?: {
    id: number;
  };
}

export interface RoutePermissionResult {
  permission: string;
  role: string;
  status: 'active' | 'inactive' | 'role-not-found' | 'external';
}

export interface TransformedRoute {
  perm_action: string;
  roles: string[];
}

export interface RoutePermissionsService {
  deleteConfiguredRoutesHistory(): Promise<void>;
  syncPermissions(): Promise<{ createdCount: number; syncedCount: number }>;
}

export interface RoutesService {
  getRoutesWithRolesConfigured(): TransformedRoute[];
}
