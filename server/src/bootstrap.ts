import { StrapiContext } from './@types';

export default async ({ strapi }: StrapiContext) => {
  try {
    // Check if users-permissions plugin is available
    if (Object.keys(strapi.plugins).indexOf('users-permissions') === -1) {
      strapi.log.error('In order to make the route-permission plugin work the users-permissions plugin is required');
      return;
    }

    // Use the routes-permissions service to sync permissions
    const routePermissionsService = strapi.service('plugin::strapi5-plugin-route-permission.routes-permissions');
    if (!routePermissionsService) {
      strapi.log.error('Route permissions service not found');
      return;
    }

    const result = await routePermissionsService.syncPermissions();
    strapi.log.info(`Route permission plugin bootstrap ::::: ${result.createdCount} created, ${result.syncedCount} synced permissions`);
  } catch (error) {
    strapi.log.error('Error in route permission bootstrap:', error);
    throw error;
  }
};
