/**
 * monument controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::monument.monument',({ strapi }) => ({
    findOne: async (ctx) => {
        const { id } = ctx.params;
        const result = await strapi.documents('api::monument.monument').findFirst({
            filters: {
                slug: id,
            },
            status: 'published',
            populate: {
                image: true,
                carousel: {
                    populate: {
                        files: true
                    }
                }
            }
        });
        if (!result) {
            return ctx.notFound();
        }
        return result;
    }
}) );
