import type { Core } from '@strapi/strapi';
import type { RoutePermissionsService } from '../@types';

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
  }
});
