
export default {
  collectionName: "plugin_routepermission_routepermission",
  info: {
    tableName: "plugin-routepermission-routepermission",
    singularName: "route-permission",
    pluralName: "route-permissions",
    displayName: "Route Permission",
    description: "Route Permission content type",
    kind: "collectionType",
  },
  options: {
    draftAndPublish: false,
  },
  pluginOptions: {
    "content-manager": {
      visible: false,
    },
    "content-type-builder": {
      visible: false,
    },
  },
  attributes: {
    "action": {
      "type": "string",
      "configurable": false
    },
    "role": {
      "type": "relation",
      "relation": "oneToOne",
      "target": "plugin::users-permissions.role",
      "configurable": false
    }
  },
};