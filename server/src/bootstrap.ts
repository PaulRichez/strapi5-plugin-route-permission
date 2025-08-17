import { StrapiContext, BootstrapMode, PluginConfig } from './@types';

export default async ({ strapi }: StrapiContext) => {
  try {
    // Check if users-permissions plugin is available
    if (Object.keys(strapi.plugins).indexOf('users-permissions') === -1) {
      strapi.log.error('In order to make the route-permission plugin work the users-permissions plugin is required');
      return;
    }

    // Get plugin configuration
    const pluginConfig: PluginConfig = strapi.config.get('plugin::strapi5-plugin-route-permission', {});
    const bootstrapMode: BootstrapMode = pluginConfig.bootstrapMode || 'default';

    strapi.log.info(`Route permission plugin starting with mode: ${bootstrapMode}`);

    // Use the routes-permissions service
    const routePermissionsService = strapi.service('plugin::strapi5-plugin-route-permission.routes-permissions');
    if (!routePermissionsService) {
      strapi.log.error('Route permissions service not found');
      return;
    }

    switch (bootstrapMode) {
      case 'default':
        // Default behavior: only sync new permissions
        const syncResult = await routePermissionsService.syncPermissions();
        strapi.log.info(`Route permission bootstrap (default) ::::: ${syncResult.createdCount} created, ${syncResult.syncedCount} synced permissions`);
        break;

      case 'restore':
        // Restore mode: clear history and resync all permissions
        strapi.log.info('Bootstrap mode: restore - clearing history and resyncing all permissions');
        await routePermissionsService.deleteConfiguredRoutesHistory();
        const restoreResult = await routePermissionsService.syncPermissions();
        strapi.log.info(`Route permission bootstrap (restore) ::::: ${restoreResult.createdCount} created, ${restoreResult.syncedCount} synced permissions`);
        break;

      case 'soft':
        // Soft cleanup mode: cleanup external permissions, then sync
        strapi.log.info('Bootstrap mode: soft cleanup - removing external permissions and syncing');
        const softCleanupResult = await routePermissionsService.cleanupExternalPermissions('soft');
        strapi.log.info(`Soft cleanup ::::: ${softCleanupResult.deletedCount} permissions deleted, ${softCleanupResult.preservedCount} preserved`);
        const softSyncResult = await routePermissionsService.syncPermissions();
        strapi.log.info(`Route permission bootstrap (soft) ::::: ${softSyncResult.createdCount} created, ${softSyncResult.syncedCount} synced permissions`);
        break;

      case 'hard':
        // Hard cleanup mode: cleanup ALL external permissions, then sync
        strapi.log.warn('Bootstrap mode: hard cleanup - removing ALL external permissions and syncing');
        const hardCleanupResult = await routePermissionsService.cleanupExternalPermissions('hard');
        strapi.log.info(`Hard cleanup ::::: ${hardCleanupResult.deletedCount} permissions deleted, ${hardCleanupResult.preservedCount} preserved`);
        const hardSyncResult = await routePermissionsService.syncPermissions();
        strapi.log.info(`Route permission bootstrap (hard) ::::: ${hardSyncResult.createdCount} created, ${hardSyncResult.syncedCount} synced permissions`);
        break;

      default:
        strapi.log.warn(`Unknown bootstrap mode: ${bootstrapMode}, falling back to default`);
        const defaultResult = await routePermissionsService.syncPermissions();
        strapi.log.info(`Route permission bootstrap (fallback) ::::: ${defaultResult.createdCount} created, ${defaultResult.syncedCount} synced permissions`);
        break;
    }
  } catch (error) {
    strapi.log.error('Error in route permission bootstrap:', error);
    throw error;
  }
};
