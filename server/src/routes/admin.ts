export default [
  {
    method: 'GET',
    path: '/configured-routes',
    handler: 'controller.getConfiguredRoutes',
    config: {
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/restore',
    handler: 'controller.restore',
    config: {
      policies: [],
    },
  },
];
