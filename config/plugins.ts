export default ({ env }) => ({
    "gen-types": {
      enabled: true,
      config: {
        outputLocation: "types/generated/types.ts",
        singleFile: true,
      },
    },
    'strapi-import-export': {
      enabled: true,
    },
});
