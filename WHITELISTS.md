# Permission Whitelists

This document describes the whitelists used by the plugin's cleanup modes to determine which permissions should be preserved during cleanup operations.

## Soft Mode Whitelist

The **soft cleanup mode** preserves essential permissions to maintain Strapi functionality while removing unnecessary external permissions. The following permissions are always preserved:

### Plugin-Managed Permissions
- All permissions explicitly managed by this route-permission plugin
- Any route permission configured in your route files

### Strapi Native Permissions

#### Users-Permissions Plugin Core Actions
```
plugin::users-permissions.user.create
plugin::users-permissions.user.read
plugin::users-permissions.user.update
plugin::users-permissions.user.destroy
plugin::users-permissions.user.me
```

#### Role Management Actions
```
plugin::users-permissions.role.create
plugin::users-permissions.role.read
plugin::users-permissions.role.update
plugin::users-permissions.role.destroy
```

#### Authentication Actions
```
plugin::users-permissions.auth.register
plugin::users-permissions.auth.callback
plugin::users-permissions.auth.connect
plugin::users-permissions.auth.forgot-password
plugin::users-permissions.auth.reset-password
plugin::users-permissions.auth.change-password
plugin::users-permissions.auth.email-confirmation
plugin::users-permissions.auth.send-email-confirmation
```

### Pattern-Based Preservation

#### Content Manager Permissions
All permissions starting with `plugin::content-manager.explorer.` are preserved to maintain admin panel functionality.

Examples:
- `plugin::content-manager.explorer.create`
- `plugin::content-manager.explorer.read`
- `plugin::content-manager.explorer.update`
- `plugin::content-manager.explorer.delete`

#### API Permissions
All permissions starting with `api::` are preserved to maintain your custom API endpoints.

Examples:
- `api::article.article.find`
- `api::article.article.create`
- `api::user.user.update`
- `api::custom-endpoint.custom-endpoint.execute`

## Hard Mode Behavior

The **hard cleanup mode** removes **ALL** external permissions except:
- Permissions explicitly managed by this route-permission plugin
- Any route permission configured in your route files

⚠️ **Warning**: Hard mode will remove ALL other permissions including:
- Strapi native permissions
- Content manager permissions
- API permissions
- Other plugin permissions

## Customizing Whitelists

If you need to modify the whitelists, you can:

1. **Fork the plugin** and modify the `usersPermissionsNativeActions` array in `server/src/services/routes-permissions.ts`
2. **Use configuration mode** to avoid cleanup entirely and manage permissions manually
3. **Use default mode** to avoid any cleanup operations

### Example: Adding Custom Permissions to Preserve

```typescript
// In routes-permissions.ts, modify the usersPermissionsNativeActions array
const usersPermissionsNativeActions = [
  // ... existing permissions ...
  
  // Add your custom permissions here
  'plugin::my-custom-plugin.action.read',
  'plugin::my-custom-plugin.action.write',
];
```

### Example: Adding Pattern-Based Rules

```typescript
// In the cleanup logic, add additional pattern checks
shouldDelete = !usersPermissionsNativeActions.includes(permission.action) && 
              !permission.action.startsWith('plugin::content-manager.explorer.') &&
              !permission.action.startsWith('api::') &&
              !permission.action.startsWith('plugin::my-custom-prefix.');
```

## Best Practices

1. **Test in Development**: Always test cleanup modes in a development environment first
2. **Backup Permissions**: Consider exporting permissions before running cleanup
3. **Use Soft Mode**: Prefer soft mode over hard mode for production environments
4. **Document Custom Changes**: If you modify whitelists, document your changes
5. **Version Control**: Keep your modifications in version control

## Troubleshooting

### Missing Permissions After Cleanup

If you notice missing functionality after cleanup:

1. Check if the missing permission is in the whitelist
2. Use the "Restore Permissions" feature in the admin panel
3. Add the missing permission pattern to your custom whitelist
4. Consider using a less aggressive cleanup mode

### Adding Permissions Back

You can manually add permissions back through:
1. Strapi admin panel (Users & Permissions > Roles)
2. Database direct insertion
3. Using the plugin's restore functionality

## Migration Between Versions

When updating the plugin, check this document for changes to whitelists that might affect your setup. New Strapi features or plugins may require additions to the preservation rules.
