/**
 * Custom recommended-monument routes
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/recommended-monuments/with-locale',
      handler: 'recommended-monument.findWithLocale',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
