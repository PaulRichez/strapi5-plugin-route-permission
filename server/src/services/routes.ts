'use strict';
import type { Core } from '@strapi/strapi';

interface RouteConfig {
  roles?: string[];
}

interface Route {
  handler: string;
  config?: RouteConfig;
  method?: string;
  path?: string;
}

interface Router {
  routes?: Route[];
}

interface StrapiAPI {
  routes?: Router | Router[];
}

interface StrapiPlugin {
  routes?: Router | Router[];
}

interface TransformedRoute {
  type: string;
  name: string;
  controller: string;
  action: string;
  perm_action: string;
  roles?: string[];
}

const transformRoute = (route: Route, type: string, name: string): TransformedRoute => {
  let [controller, action] = route.handler.split(".");
  if (route.handler.includes('::')) {
    // for config on core route
    controller = route.handler.split('::')[1].split('.')[1];
    action = route.handler.split('.').pop() as string;
  }
  const perm_action = `${type}::${name}.${controller}.${action}`;
  return {
    type,
    name,
    controller,
    action,
    perm_action,
    roles: route.config?.roles,
  };
};

export default ({ strapi }: { strapi: Core.Strapi }) => {
  
  const processRoutes = (routesData: any, type: string, name: string, routes: TransformedRoute[]) => {
    // console.log(`Processing routes for ${type} ${name}:`, routesData);
    
    // In Strapi 5, routes can have different structures
    if (routesData && typeof routesData === 'object' && !Array.isArray(routesData)) {
      
      // For plugins: { 'content-api': { routes: [...] }, 'admin': { routes: [...] } }
      if (routesData['content-api'] && routesData['content-api'].routes) {
        // console.log(`Found content-api routes for ${name}:`, routesData['content-api'].routes.length, 'routes');
        
        routesData['content-api'].routes.forEach((route: Route) => {
          // console.log(`Checking route:`, route);
          if (route?.config?.roles) {
            const result = transformRoute(route, type, name);
            routes.push(result);
            // console.log(`Added route with roles:`, result);
          }
        });
      }
      
      // For APIs: { apiName: { type: 'content-api', routes: [...] } }
      else {
        // Check each property in the routes object
        for (const routeKey in routesData) {
          const routeGroup = routesData[routeKey];
          // console.log(`Checking route group ${routeKey}:`, routeGroup);
          
          // Only process content-api routes
          if (routeGroup && routeGroup.type === 'content-api' && routeGroup.routes) {
            // console.log(`Found content-api routes in ${routeKey} for ${name}:`, routeGroup.routes.length, 'routes');
            
            routeGroup.routes.forEach((route: Route) => {
              // console.log(`Checking route:`, route);
              if (route?.config?.roles) {
                const result = transformRoute(route, type, name);
                routes.push(result);
                // console.log(`Added route with roles:`, result);
              }
            });
          }
        }
      }
      
      // Also check if it's a direct router object with routes
      if (routesData.routes && Array.isArray(routesData.routes)) {
        routesData.routes.forEach((route: Route) => {
          if (route?.config?.roles) {
            const result = transformRoute(route, type, name);
            routes.push(result);
            // console.log(`Added route with roles:`, result);
          }
        });
      }
    }
    // Handle array of routes or routers (legacy structure)
    else if (Array.isArray(routesData)) {
      routesData.forEach((item) => {
        if (item.routes && Array.isArray(item.routes)) {
          // It's a router with routes
          item.routes.forEach((route: Route) => {
            if (route?.config?.roles) {
              const result = transformRoute(route, type, name);
              routes.push(result);
              console.log(`Added route with roles:`, result);
            }
          });
        } else if (item.handler) {
          // It's a direct route
          if (item?.config?.roles) {
            const result = transformRoute(item, type, name);
            routes.push(result);
            console.log(`Added route with roles:`, result);
          }
        }
      });
    }
  };

  return {
    getRoutesWithRolesConfigured(): TransformedRoute[] {
      const routes: TransformedRoute[] = [];      
      // In Strapi 5, APIs are accessed via strapi.apis instead of strapi.api
      if (strapi.apis) {
        for (const apiName in strapi.apis) {
          const api = strapi.apis[apiName];
          // console.log(`API ${apiName}:`, api);
          
          if (api.routes) {
            processRoutes(api.routes, 'api', apiName, routes);
          }
        }
      }
      
      // Process plugin routes
      if (strapi.plugins) {
        for (const pluginName in strapi.plugins) {
          const plugin = strapi.plugins[pluginName];
          
          if (plugin.routes) {
            processRoutes(plugin.routes, 'plugin', pluginName, routes);
          }
        }
      }

      // console.log('=== END DEBUG ===');
      // console.log('Total routes found with roles:', routes.length);
      return routes;
    }
  };
};
