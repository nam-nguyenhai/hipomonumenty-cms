/**
 * Custom monument routes
 */

export default {
    routes: [
        {
            method: 'GET',
            path: '/monuments/by-document-id/:documentId',
            handler: 'monument.findByDocumentId',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
    ],
};
