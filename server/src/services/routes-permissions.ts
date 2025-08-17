import type { Core } from '@strapi/strapi';
import type { RoutePermissionsService, Role, RoutePermission, TransformedRoute } from '../@types';

export default ({ strapi }: { strapi: Core.Strapi }): RoutePermissionsService => ({
  async deleteConfiguredRoutesHistory(): Promise<void> {
    try {
      // Find all route permissions
      const routePermissions = await strapi.entityService.findMany('plugin::strapi5-plugin-route-permission.route-permission', {});
      
      // Delete each route permission
      if (Array.isArray(routePermissions)) {
        for (const permission of routePermissions) {
          await strapi.entityService.delete('plugin::strapi5-plugin-route-permission.route-permission', permission.id);
        }
      }
      
      strapi.log.info('Route permissions history cleared successfully');
    } catch (error) {
      strapi.log.error('Error clearing route permissions history:', error);
      throw error;
    }
  },

  async syncPermissions(): Promise<{ createdCount: number; syncedCount: number }> {
    try {
      // Check if route permission service is available
      const routeService = strapi.service('plugin::strapi5-plugin-route-permission.routes');
      if (!routeService) {
        throw new Error('Route permission service not found');
      }

      // Get Routes with roles on config
      const routes: TransformedRoute[] = routeService.getRoutesWithRolesConfigured();
      
      // Get Roles with permissions
      const roles = await strapi.entityService.findMany('plugin::users-permissions.role', { 
        populate: ['permissions'] 
      }) as Role[];
      
      // Get routes in db
      const prevsRouteConfig = await strapi.entityService.findMany('plugin::strapi5-plugin-route-permission.route-permission', { 
        populate: ['role'] 
      }) as unknown as RoutePermission[];
      
      strapi.log.info(`Found ${prevsRouteConfig.length} existing route permissions in database`);
      
      // Generate permission route/role
      let counterPermCreated = 0;
      let counterPermSynced = 0;
      
      for (const route of routes) {
        const promises = route.roles.map(async (role: string) => {
          const selectedRole = roles.find(r => r.type === role);
          if (selectedRole) {
            // Permission not found
            if (!selectedRole.permissions?.find(p => p.action === route.perm_action)) {
              if (prevsRouteConfig.find(r => r.action === route.perm_action && r.role?.id === selectedRole.id)) {
                strapi.log.info(`Permission on role ${role} ::::: ${route.perm_action} was removed from admin`);
                return null;
              } else {
                strapi.log.info(`Generating permission on role ${role} ::::: ${route.perm_action}`);
                counterPermCreated++;
                
                // Create the route permission entry in our plugin's table
                await strapi.entityService.create('plugin::strapi5-plugin-route-permission.route-permission', {
                  data: {
                    action: route.perm_action,
                    role: selectedRole,
                  },
                });
                
                // Create the users-permissions permission entry
                return await strapi.entityService.create('plugin::users-permissions.permission', {
                  data: {
                    action: route.perm_action,
                    role: selectedRole,
                  },
                });
              }
            } else {
              strapi.log.info(`Permission on role ${role} ::::: ${route.perm_action} already exists`);
              
              // Check if this permission exists in our plugin's database
              if (!prevsRouteConfig.find(r => r.action === route.perm_action && r.role?.id === selectedRole.id)) {
                strapi.log.info(`Adding existing permission to plugin database: ${role} ::::: ${route.perm_action}`);
                counterPermSynced++;
                
                // Create the route permission entry in our plugin's table
                await strapi.entityService.create('plugin::strapi5-plugin-route-permission.route-permission', {
                  data: {
                    action: route.perm_action,
                    role: selectedRole,
                  },
                });
              }
            }
          }
          return null;
        });
        
        await Promise.all(promises);
      }
      
      strapi.log.info(`Route permission sync ::::: ${counterPermCreated} created, ${counterPermSynced} synced permissions`);
      
      return {
        createdCount: counterPermCreated,
        syncedCount: counterPermSynced
      };
    } catch (error) {
      strapi.log.error('Error syncing route permissions:', error);
      throw error;
    }
  },

  async cleanupExternalPermissions(mode: 'soft' | 'hard'): Promise<{ deletedCount: number; preservedCount: number }> {
    try {
      // Get routes configured by our plugin
      const routeService = strapi.service('plugin::strapi5-plugin-route-permission.routes');
      if (!routeService) {
        throw new Error('Route permission service not found');
      }

      const routes: TransformedRoute[] = routeService.getRoutesWithRolesConfigured();
      const routePermissions = await strapi.entityService.findMany('plugin::strapi5-plugin-route-permission.route-permission', {
        populate: ['role'],
      }) as unknown as RoutePermission[];

      // Create set of all actions managed by our plugin
      const pluginActions = new Set<string>();
      routes.forEach(route => {
        pluginActions.add(route.perm_action);
      });
      routePermissions.forEach(permission => {
        pluginActions.add(permission.action);
      });

      // Define users-permissions native actions to preserve in soft mode
      const usersPermissionsNativeActions = [
        // User permissions
        'plugin::users-permissions.user.create',
        'plugin::users-permissions.user.read',
        'plugin::users-permissions.user.update',
        'plugin::users-permissions.user.destroy',
        'plugin::users-permissions.user.me',
        // Role permissions
        'plugin::users-permissions.role.create',
        'plugin::users-permissions.role.read',
        'plugin::users-permissions.role.update',
        'plugin::users-permissions.role.destroy',
        // Auth permissions
        'plugin::users-permissions.auth.register',
        'plugin::users-permissions.auth.callback',
        'plugin::users-permissions.auth.connect',
        'plugin::users-permissions.auth.forgot-password',
        'plugin::users-permissions.auth.reset-password',
        'plugin::users-permissions.auth.change-password',
        'plugin::users-permissions.auth.email-confirmation',
        'plugin::users-permissions.auth.send-email-confirmation'
      ];

      // Get all roles with their permissions
      const roles = await strapi.entityService.findMany('plugin::users-permissions.role', {
        populate: ['permissions'],
      }) as Role[];

      let deletedCount = 0;
      let preservedCount = 0;

      // Process each role
      for (const role of roles) {
        if (role.permissions) {
          for (const permission of role.permissions) {
            // Skip if this permission is managed by our plugin
            if (pluginActions.has(permission.action)) {
              continue;
            }

            let shouldDelete = false;

            if (mode === 'hard') {
              // Hard mode: delete all external permissions
              shouldDelete = true;
            } else if (mode === 'soft') {
              // Soft mode: delete only non-native permissions
              shouldDelete = !usersPermissionsNativeActions.includes(permission.action) && 
                            !permission.action.startsWith('plugin::content-manager.explorer.') &&
                            !permission.action.startsWith('api::');
            }

            if (shouldDelete) {
              try {
                await strapi.entityService.delete('plugin::users-permissions.permission', permission.id);
                strapi.log.info(`Deleted external permission: ${permission.action} from role ${role.type}`);
                deletedCount++;
              } catch (error) {
                strapi.log.error(`Failed to delete permission ${permission.action}:`, error);
              }
            } else {
              preservedCount++;
            }
          }
        }
      }

      strapi.log.info(`Cleanup completed (${mode} mode): ${deletedCount} permissions deleted, ${preservedCount} preserved`);
      
      return {
        deletedCount,
        preservedCount
      };
    } catch (error) {
      strapi.log.error('Error cleaning up external permissions:', error);
      throw error;
    }
  }
});
