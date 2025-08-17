# Plugin Configuration

## Bootstrap Mode Configuration

You can configure how the plugin behaves on server startup by setting the `bootstrapMode` option in your plugin configuration.

### Configuration File

Add the configuration in your `config/plugins.js` or `config/plugins.ts` file:

```typescript
// config/plugins.ts
export default () => ({
  'strapi5-plugin-route-permission': {
    enabled: true,
    resolve: './src/plugins/strapi5-plugin-route-permission',
    config: {
      bootstrapMode: 'default' // 'default' | 'restore' | 'soft' | 'hard'
    }
  },
});
```

### Available Bootstrap Modes

#### `default` (Default behavior)
- **Behavior**: Only synchronizes new permissions
- **Safe for**: Production and development
- **What it does**: 
  - Creates permissions for new routes that don't exist yet
  - Preserves all existing permissions
  - Does not remove any permissions

```typescript
config: {
  bootstrapMode: 'default'
}
```

#### `restore`
- **Behavior**: Clears plugin history and recreates all route permissions
- **Safe for**: Development, staging
- **What it does**:
  - Removes all route permissions tracked by this plugin
  - Recreates permissions based on current route configuration
  - Preserves external permissions from other sources

```typescript
config: {
  bootstrapMode: 'restore'
}
```

#### `soft`
- **Behavior**: Removes external permissions, then syncs route permissions
- **Safe for**: Staging, careful production use
- **What it does**:
  - Removes non-native external permissions
  - Preserves Strapi native permissions (users-permissions, auth, etc.)
  - Preserves API permissions (`api::*`)
  - Syncs route permissions

```typescript
config: {
  bootstrapMode: 'soft'
}
```

#### `hard`
- **Behavior**: Removes ALL external permissions, then syncs route permissions
- **Safe for**: Development only (use with extreme caution)
- **What it does**:
  - Removes ALL external permissions not managed by this plugin
  - Only preserves permissions explicitly managed by this plugin
  - ⚠️ **Warning**: May break other plugins or custom permissions

```typescript
config: {
  bootstrapMode: 'hard'
}
```

### Examples

#### Development Environment
```typescript
// config/plugins.ts
export default () => ({
  'strapi5-plugin-route-permission': {
    enabled: true,
    resolve: './src/plugins/strapi5-plugin-route-permission',
    config: {
      bootstrapMode: 'restore' // Clean slate on each restart
    }
  },
});
```

#### Production Environment
```typescript
// config/plugins.ts
export default () => ({
  'strapi5-plugin-route-permission': {
    enabled: true,
    resolve: './src/plugins/strapi5-plugin-route-permission',
    config: {
      bootstrapMode: 'default' // Safe, only new permissions
    }
  },
});
```

#### Migration/Cleanup
```typescript
// config/plugins.ts
export default () => ({
  'strapi5-plugin-route-permission': {
    enabled: true,
    resolve: './src/plugins/strapi5-plugin-route-permission',
    config: {
      bootstrapMode: 'soft' // Clean up external permissions
    }
  },
});
```

### Console Output

Each mode will log its actions:

```bash
# Default mode
[INFO] Route permission plugin starting with mode: default
[INFO] Route permission bootstrap (default) ::::: 3 created, 22 synced permissions

# Restore mode
[INFO] Route permission plugin starting with mode: restore
[INFO] Bootstrap mode: restore - clearing history and resyncing all permissions
[INFO] Route permissions history cleared successfully
[INFO] Route permission bootstrap (restore) ::::: 25 created, 0 synced permissions

# Soft mode
[INFO] Route permission plugin starting with mode: soft
[INFO] Bootstrap mode: soft cleanup - removing external permissions and syncing
[INFO] Cleanup completed (soft mode): 12 permissions deleted, 156 preserved
[INFO] Route permission bootstrap (soft) ::::: 3 created, 22 synced permissions

# Hard mode
[WARN] Bootstrap mode: hard cleanup - removing ALL external permissions and syncing
[INFO] Cleanup completed (hard mode): 45 permissions deleted, 25 preserved
[INFO] Route permission bootstrap (hard) ::::: 25 created, 0 synced permissions
```

### Recommendations

- **Production**: Use `default` mode for safety
- **Development**: Use `restore` mode for clean state
- **Staging/Testing**: Use `soft` mode for cleanup
- **Emergency Cleanup**: Use `hard` mode only when necessary

### Runtime Management

You can still use the admin panel to perform these operations manually at runtime, regardless of the bootstrap mode configured.
