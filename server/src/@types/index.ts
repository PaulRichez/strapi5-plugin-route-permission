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

export interface TransformedRoute {
  perm_action: string;
  roles: string[];
}

export interface RoutePermissionsService {
  deleteConfiguredRoutesHistory(): Promise<void>;
}

export interface RoutesService {
  getRoutesWithRolesConfigured(): TransformedRoute[];
}
