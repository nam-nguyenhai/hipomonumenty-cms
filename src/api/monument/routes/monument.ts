/**
 * monument router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::monument.monument', {
    config: {
        findOne: {
            auth: false,
            policies: [],
            middlewares: [],
        }
    }
});
