"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMediaTools = registerMediaTools;
const zod_1 = require("zod");
function requireAuth(client) {
    if (!client.isAuthenticated)
        return 'Not authenticated. Please use the login tool first with your Strapi admin credentials.';
    return null;
}
function registerMediaTools(server, client) {
    server.tool('list_media', 'Browse files in the Strapi Media Library (images, documents, etc.). Returns file names, IDs, dimensions, MIME types, and alt text. Use this to find existing media files or verify uploads.', {
        page: zod_1.z.number().optional().describe('Page number (default 1)'),
        page_size: zod_1.z.number().optional().describe('Items per page (default 20)'),
    }, async ({ page, page_size }) => {
        const authError = requireAuth(client);
        if (authError)
            return { content: [{ type: 'text', text: authError }], isError: true };
        try {
            const data = await client.listMedia({ page: page || 1, pageSize: page_size || 20 });
            const files = data.results || data || [];
            const lines = (Array.isArray(files) ? files : []).map((f) => `- ${f.name} (id: ${f.id}, ${f.mime}, ${f.width}x${f.height}, alt: "${f.alternativeText || ''}")`);
            return { content: [{ type: 'text', text: `Media Library:\n\n${lines.join('\n') || 'No files found.'}` }] };
        }
        catch (error) {
            return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
        }
    });
    server.tool('update_media', 'Update metadata for a media file — change the display name, alt text (for accessibility/SEO), or caption. Does not replace the file itself, only its metadata.', {
        id: zod_1.z.number().describe('Media file ID'),
        name: zod_1.z.string().optional().describe('New file name'),
        alternative_text: zod_1.z.string().optional().describe('Alt text for accessibility'),
        caption: zod_1.z.string().optional().describe('Image caption'),
    }, async ({ id, name, alternative_text, caption }) => {
        const authError = requireAuth(client);
        if (authError)
            return { content: [{ type: 'text', text: authError }], isError: true };
        try {
            const updateData = {};
            if (name !== undefined)
                updateData.name = name;
            if (alternative_text !== undefined)
                updateData.alternativeText = alternative_text;
            if (caption !== undefined)
                updateData.caption = caption;
            await client.updateMedia(id, updateData);
            return { content: [{ type: 'text', text: `Media file ${id} updated successfully.` }] };
        }
        catch (error) {
            return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
        }
    });
    server.tool('upload_media', 'Upload a new file to the Strapi Media Library. Provide the file as base64-encoded data with a filename and MIME type. After uploading, the file can be referenced in content entries via its ID.', {
        file_name: zod_1.z.string().describe('File name with extension, e.g. "photo.jpg"'),
        base64_data: zod_1.z.string().describe('Base64 encoded file content'),
        mime_type: zod_1.z.string().describe('MIME type, e.g. "image/jpeg", "image/png"'),
    }, async ({ file_name, base64_data, mime_type }) => {
        const authError = requireAuth(client);
        if (authError)
            return { content: [{ type: 'text', text: authError }], isError: true };
        try {
            const result = await client.uploadMedia(file_name, base64_data, mime_type);
            const file = Array.isArray(result) ? result[0] : result;
            return {
                content: [{
                        type: 'text',
                        text: `Uploaded successfully.\nID: ${file.id}\nName: ${file.name}\nURL: ${file.url}`,
                    }],
            };
        }
        catch (error) {
            return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
        }
    });
}
