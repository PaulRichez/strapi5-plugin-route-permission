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
  }
});
