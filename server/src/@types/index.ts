import type { Core } from '@strapi/strapi';

export interface StrapiContext {
  strapi: Core.Strapi;
}

export interface Permission {
  id: number;
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
  cleanupExternalPermissions(mode: 'soft' | 'hard'): Promise<{ deletedCount: number; preservedCount: number }>;
}

export interface RoutesService {
  getRoutesWithRolesConfigured(): TransformedRoute[];
}

export type BootstrapMode = 'default' | 'restore' | 'soft' | 'hard';

export interface PluginConfig {
  bootstrapMode?: BootstrapMode;
}
