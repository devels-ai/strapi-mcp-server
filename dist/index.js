#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const strapi_client_js_1 = require("./strapi-client.js");
const auth_js_1 = require("./tools/auth.js");
const schema_js_1 = require("./tools/schema.js");
const content_js_1 = require("./tools/content.js");
const publish_js_1 = require("./tools/publish.js");
const media_js_1 = require("./tools/media.js");
const server = new mcp_js_1.McpServer({
    name: 'strapi-mcp-server',
    version: '1.0.0',
    description: `You are connected to a Strapi CMS instance. This MCP server lets you help content managers create, edit, and publish website content.

WORKFLOW:
1. First call "login" with the user's Strapi admin credentials. Ask for email and password if not provided.
2. Use "list_content_types" to discover available content types and understand the CMS structure.
3. Use "describe_content_type" to see exact field names, types, and labels before creating or updating content.
4. After updating content, remind the user to publish if the changes should go live.

IMPORTANT:
- Content types come in two kinds: "singleType" (one entry, e.g. Home Page) and "collectionType" (many entries, e.g. News Articles).
- Single types don't need a document_id. Collection types always need a document_id for get/update/delete.
- The CMS supports i18n with locales: "en" (English), "uk" (Ukrainian), "da" (Danish). Always ask which locale to use if unclear.
- Changes are saved as drafts by default. Use "publish_entry" to make them live.
- When creating content, always use "describe_content_type" first to know the exact field names and types.
- For relation fields, use the "connect" syntax: {"products": {"connect": [{"documentId": "..."}]}}.
- Media files (images) are managed separately via "list_media", "upload_media", "update_media" tools.`,
});
const client = new strapi_client_js_1.StrapiClient();
// Register all tools
(0, auth_js_1.registerAuthTools)(server, client);
(0, schema_js_1.registerSchemaTools)(server, client);
(0, content_js_1.registerContentTools)(server, client);
(0, publish_js_1.registerPublishTools)(server, client);
(0, media_js_1.registerMediaTools)(server, client);
// Start server
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
}
main().catch(console.error);
