"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPublishTools = registerPublishTools;
const zod_1 = require("zod");
function requireAuth(client) {
    if (!client.isAuthenticated)
        return 'Not authenticated. Please use the login tool first with your Strapi admin credentials.';
    return null;
}
function registerPublishTools(server, client) {
    // Content types cache
    let contentTypesCache = null;
    async function getKind(uid) {
        if (!contentTypesCache) {
            contentTypesCache = await client.getContentTypes();
        }
        const ct = contentTypesCache.find((t) => t.uid === uid);
        return ct?.kind || 'collectionType';
    }
    server.tool('publish_entry', 'Publish an entry to make it live on the website. Content in Strapi is draft by default after creation or update. Call this after creating or updating content when the user wants changes to appear on the live site. For collection types, provide the document_id.', {
        content_type: zod_1.z.string().describe('Content type UID'),
        document_id: zod_1.z.string().optional().describe('Document ID (required for collection types)'),
        locale: zod_1.z.string().optional().describe('Locale code'),
    }, async ({ content_type, document_id, locale }) => {
        const authError = requireAuth(client);
        if (authError)
            return { content: [{ type: 'text', text: authError }], isError: true };
        try {
            const kind = await getKind(content_type);
            await client.publishEntry(content_type, kind, document_id, locale);
            return { content: [{ type: 'text', text: 'Published successfully.' }] };
        }
        catch (error) {
            return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
        }
    });
    server.tool('unpublish_entry', 'Revert a published entry to draft status — removes it from the live website but keeps the content for editing. Use when the user wants to temporarily hide content without deleting it.', {
        content_type: zod_1.z.string().describe('Content type UID'),
        document_id: zod_1.z.string().optional().describe('Document ID (required for collection types)'),
        locale: zod_1.z.string().optional().describe('Locale code'),
    }, async ({ content_type, document_id, locale }) => {
        const authError = requireAuth(client);
        if (authError)
            return { content: [{ type: 'text', text: authError }], isError: true };
        try {
            const kind = await getKind(content_type);
            await client.unpublishEntry(content_type, kind, document_id, locale);
            return { content: [{ type: 'text', text: 'Unpublished successfully. Entry is now a draft.' }] };
        }
        catch (error) {
            return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
        }
    });
}
