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
  {
    method: 'POST',
    path: '/cleanup-soft',
    handler: 'controller.cleanupSoft',
    config: {
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/cleanup-hard',
    handler: 'controller.cleanupHard',
    config: {
      policies: [],
    },
  },
];
