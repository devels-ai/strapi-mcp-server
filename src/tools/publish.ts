import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { StrapiClient } from '../strapi-client.js';

function requireAuth(client: StrapiClient): string | null {
  if (!client.isAuthenticated) return 'Not authenticated. Please use the login tool first with your Strapi admin credentials.';
  return null;
}

export function registerPublishTools(server: McpServer, client: StrapiClient) {
  // Content types cache
  let contentTypesCache: any[] | null = null;

  async function getKind(uid: string): Promise<string> {
    if (!contentTypesCache) {
      contentTypesCache = await client.getContentTypes();
    }
    const ct = contentTypesCache.find((t: any) => t.uid === uid);
    return ct?.kind || 'collectionType';
  }

  server.tool(
    'publish_entry',
    'Publish an entry to make it live on the website. Content in Strapi is draft by default after creation or update. Call this after creating or updating content when the user wants changes to appear on the live site. For collection types, provide the document_id.',
    {
      content_type: z.string().describe('Content type UID'),
      document_id: z.string().optional().describe('Document ID (required for collection types)'),
      locale: z.string().optional().describe('Locale code'),
    },
    async ({ content_type, document_id, locale }) => {
      const authError = requireAuth(client);
      if (authError) return { content: [{ type: 'text' as const, text: authError }], isError: true };

      try {
        const kind = await getKind(content_type);
        await client.publishEntry(content_type, kind, document_id, locale);
        return { content: [{ type: 'text' as const, text: 'Published successfully.' }] };
      } catch (error: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'unpublish_entry',
    'Revert a published entry to draft status — removes it from the live website but keeps the content for editing. Use when the user wants to temporarily hide content without deleting it.',
    {
      content_type: z.string().describe('Content type UID'),
      document_id: z.string().optional().describe('Document ID (required for collection types)'),
      locale: z.string().optional().describe('Locale code'),
    },
    async ({ content_type, document_id, locale }) => {
      const authError = requireAuth(client);
      if (authError) return { content: [{ type: 'text' as const, text: authError }], isError: true };

      try {
        const kind = await getKind(content_type);
        await client.unpublishEntry(content_type, kind, document_id, locale);
        return { content: [{ type: 'text' as const, text: 'Unpublished successfully. Entry is now a draft.' }] };
      } catch (error: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
