#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StrapiClient } from './strapi-client.js';
import { registerAuthTools } from './tools/auth.js';
import { registerSchemaTools } from './tools/schema.js';
import { registerContentTools } from './tools/content.js';
import { registerPublishTools } from './tools/publish.js';
import { registerMediaTools } from './tools/media.js';

const server = new McpServer({
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

const client = new StrapiClient();

// Register all tools
registerAuthTools(server, client);
registerSchemaTools(server, client);
registerContentTools(server, client);
registerPublishTools(server, client);
registerMediaTools(server, client);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
