/**
 * recommended-monument controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::recommended-monument.recommended-monument', ({ strapi }) => ({
  // Get recommended monuments with locale support
  // GET /api/recommended-monuments/with-locale?locale=en
  async findWithLocale(ctx) {
    const locale = (ctx.query.locale as string) || 'cs';

    try {
      // Fetch the recommended-monument single type
      const recommendedMonument = await strapi.documents('api::recommended-monument.recommended-monument').findFirst({
        status: 'published',
        populate: {
          monuments: true
        }
      });

      if (!recommendedMonument || !recommendedMonument.monuments) {
        return { data: [] };
      }

      // Get the monument document IDs (limit to first 6)
      const monumentIds = recommendedMonument.monuments
        .map((monument: any) => monument.documentId)
        .slice(0, 6); // Limit to first 6 monuments

      // Fetch each monument with the requested locale
      const monuments = await Promise.all(
        monumentIds.map(async (documentId: string) => {
          try {
            // Try to fetch with requested locale
            let monument = await strapi.documents('api::monument.monument').findOne({
              documentId,
              locale,
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

            // Fallback to 'cs' if not found in requested locale
            if (!monument && locale !== 'cs') {
              monument = await strapi.documents('api::monument.monument').findOne({
                documentId,
                locale: 'cs',
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
            }

            return monument;
          } catch (error) {
            strapi.log.error(`Error fetching monument ${documentId}:`, error);
            return null;
          }
        })
      );

      // Filter out null values and return
      const validMonuments = monuments.filter(monument => monument !== null);

      return { data: validMonuments };
    } catch (error) {
      strapi.log.error('Error fetching recommended monuments:', error);
      ctx.throw(500, 'Internal server error');
    }
  }
}));
