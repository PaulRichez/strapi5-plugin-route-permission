import type { Core } from '@strapi/strapi';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  async getConfiguredRoutes(ctx) {
    try {
      const routes = strapi
        .plugin('strapi5-plugin-route-permission')
        .service('routes')
        .getRoutesWithRolesConfigured();

      // Get all route permissions from database
      const routePermissions = await strapi.entityService.findMany('plugin::strapi5-plugin-route-permission.route-permission', {
        populate: ['role'],
      });

      // console.log('Route Permissions:', routePermissions); // Debug log

      // Get all roles
      const roles = await strapi.entityService.findMany('plugin::users-permissions.role', {
        populate: ['permissions'],
      });

      // Transform the data for the admin UI
      const result = routePermissions.map((permission: any) => {
        const role = permission.role;
        let status: 'active' | 'inactive' | 'role-not-found' = 'inactive';
        
        if (!role) {
          status = 'role-not-found';
        } else {
          // Check if the role still has this permission in users-permissions
          const usersPermissionsRole = roles.find((r: any) => r.id === role.id);
          if (usersPermissionsRole) {
            const hasPermission = usersPermissionsRole.permissions?.find((p: any) => p.action === permission.action);
            status = hasPermission ? 'active' : 'inactive';
          } else {
            status = 'role-not-found';
          }
        }

        return {
          permission: permission.action,
          role: role?.type || 'unknown',
          status,
        };
      });

      // Add routes that have role configuration but no database entry
      routes.forEach((route: any) => {
        const existsInDb = result.find(r => r.permission === route.perm_action);
        // console.log('Route:', route.perm_action, 'Exists in DB:', existsInDb);
        if (!existsInDb && route.roles) {
          route.roles.forEach((role: string) => {
            // Check if the role exists
            const roleExists = roles.find((r: any) => r.type === role);
            const status = roleExists ? 'inactive' : 'role-not-found';
            
            result.push({
              permission: route.perm_action,
              role: role,
              status: status as 'inactive' | 'role-not-found',
            });
          });
        }
      });

      // Get all external permissions (configured in Strapi but not from plugin)
      const allPluginActions = new Set();
      routes.forEach((route: any) => {
        allPluginActions.add(route.perm_action);
      });
      routePermissions.forEach((permission: any) => {
        allPluginActions.add(permission.action);
      });

      // Find all permissions in users-permissions that are not from our plugin
      roles.forEach((role: any) => {
        if (role.permissions) {
          role.permissions.forEach((permission: any) => {
            // Skip if this permission is already handled by our plugin
            if (!allPluginActions.has(permission.action)) {
              // Check if this external permission is already in our result
              const existsInResult = result.find(r => 
                r.permission === permission.action && r.role === role.type
              );
              
              if (!existsInResult) {
                result.push({
                  permission: permission.action,
                  role: role.type,
                  status: 'external' as any, // External permission not managed by plugin
                });
              }
            }
          });
        }
      });

      // Handle filtering
      const statusFilter = ctx.query.status;
      const roleFilter = ctx.query.role;
      const permissionFilter = ctx.query.permission;
      
      let filteredResult = result;
      
      // Apply status filter
      if (statusFilter && statusFilter !== 'all') {
        filteredResult = filteredResult.filter(item => item.status === statusFilter);
      }
      
      // Apply role filter
      if (roleFilter && roleFilter.trim() !== '') {
        filteredResult = filteredResult.filter(item => 
          item.role.toLowerCase().includes(roleFilter.toLowerCase())
        );
      }
      
      // Apply permission filter
      if (permissionFilter && permissionFilter.trim() !== '') {
        filteredResult = filteredResult.filter(item => 
          item.permission.toLowerCase().includes(permissionFilter.toLowerCase())
        );
      }

      // Handle pagination
      const page = parseInt(ctx.query.page) || 1;
      const pageSize = parseInt(ctx.query.pageSize) || 10;
      const total = filteredResult.length;
      const pageCount = Math.ceil(total / pageSize);
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      
      // Apply pagination to filtered results
      const paginatedResult = filteredResult.slice(start, end);

      ctx.body = {
        data: {
          result: paginatedResult,
          pagination: {
            page,
            pageSize,
            total,
            pageCount,
          },
        },
      };
    } catch (error) {
      strapi.log.error('Error fetching configured routes:', error);
      ctx.body = {
        data: {
          result: [],
          pagination: {
            total: 0,
            pageCount: 0,
          },
        },
      };
    }
  },

  async restore(ctx) {
    try {
      // Call the routes-permissions service to delete history
      await strapi
        .plugin('strapi5-plugin-route-permission')
        .service('routes-permissions')
        .deleteConfiguredRoutesHistory();

      ctx.body = {
        message: 'Route permissions history successfully deleted. Permissions will be reconfigured on next restart.',
        success: true,
      };
    } catch (error) {
      strapi.log.error('Error restoring route permissions:', error);
      ctx.status = 500;
      ctx.body = {
        message: 'An error occurred while restoring route permissions',
        success: false,
        error: error.message,
      };
    }
  },
});

export default controller;
