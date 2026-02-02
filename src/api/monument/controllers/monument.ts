/**
 * monument controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::monument.monument',({ strapi }) => ({
    // Find by slug (existing behavior)
    findOne: async (ctx) => {
        const { id } = ctx.params;
        const locale = ctx.query.locale as string | undefined;
        
        const result = await strapi.documents('api::monument.monument').findFirst({
            filters: {
                slug: id,
            },
            locale: locale || 'cs',
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
    },

    // Find by documentId - useful for locale switching
    // GET /api/monuments/by-document-id/:documentId?locale=en
    findByDocumentId: async (ctx) => {
        const { documentId } = ctx.params;
        const locale = ctx.query.locale as string | undefined;

        const result = await strapi.documents('api::monument.monument').findOne({
            documentId,
            locale: locale || 'cs',
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
