import { StrapiContext, Role, RoutePermission, TransformedRoute } from './@types';

export default async ({ strapi }: StrapiContext) => {
  
  try {
    // Check if users-permissions plugin is available
    if (Object.keys(strapi.plugins).indexOf('users-permissions') === -1) {
      strapi.log.error('In order to make the route-permission plugin work the users-permissions plugin is required');
      return;
    }

    // Check if route permission service is available
    const routeService = strapi.service('plugin::strapi5-plugin-route-permission.routes');
    if (!routeService) {
      strapi.log.error('Route permission service not found');
      return;
    }

    // get Routes with roles on config
    const routes: TransformedRoute[] = routeService.getRoutesWithRolesConfigured();
    // strapi.log.info(`Found ${routes.length} routes with roles configured`);
    
    // get Roles with permissions
    const roles = await strapi.entityService.findMany('plugin::users-permissions.role', { 
      populate: ['permissions'] 
    }) as Role[];
    
    // strapi.log.info(`Found ${roles.length} roles`);
    
    // get routes in db
    const prevsRouteConfig = await strapi.entityService.findMany('plugin::strapi5-plugin-route-permission.route-permission', { 
      populate: ['role'] 
    }) as unknown as RoutePermission[];
    
    strapi.log.info(`Found ${prevsRouteConfig.length} existing route permissions in database`);
    
    // generate permission route/role
    let counterPermUpdated = 0;
    
    for (const route of routes) {
      const promises = route.roles.map(async (role: string) => {
        const selectedRole = roles.find(r => r.type === role);
        if (selectedRole) {
          // permission not found
          if (!selectedRole.permissions?.find(p => p.action === route.perm_action)) {
            if (prevsRouteConfig.find(r => r.action === route.perm_action && r.role?.id === selectedRole.id)) {
              strapi.log.info(`Permission on role ${role} ::::: ${route.perm_action} was removed from admin`);
              return null;
            } else {
              strapi.log.info(`Generating permission on role ${role} ::::: ${route.perm_action}`);
              counterPermUpdated++;
              
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
    
    strapi.log.info(`Route permission plugin ::::: ${counterPermUpdated} generated permissions`);
  } catch (error) {
    strapi.log.error('Error in route permission bootstrap:', error);
    throw error;
  }
};
