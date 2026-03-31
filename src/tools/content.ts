import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { StrapiClient } from '../strapi-client.js';

function requireAuth(client: StrapiClient): string | null {
  if (!client.isAuthenticated) return 'Not authenticated. Please use the login tool first with your Strapi admin credentials.';
  return null;
}

export function registerContentTools(server: McpServer, client: StrapiClient) {
  // We need content types cache to determine kind
  let contentTypesCache: any[] | null = null;

  async function getKind(uid: string): Promise<'singleType' | 'collectionType'> {
    if (!contentTypesCache) {
      contentTypesCache = await client.getContentTypes();
    }
    const ct = contentTypesCache.find((t: any) => t.uid === uid);
    return ct?.kind || 'collectionType';
  }

  server.tool(
    'list_entries',
    'List entries for a content type. For collection types (News Articles, Products, Categories), returns a paginated list with document IDs. For single types (Home Page, About Page), returns the single entry directly. Use this to browse existing content or find document IDs for get/update/delete operations.',
    {
      content_type: z.string().describe('Content type UID, e.g. "api::news-article.news-article"'),
      page: z.number().optional().describe('Page number (default 1)'),
      page_size: z.number().optional().describe('Items per page (default 10)'),
      locale: z.string().optional().describe('Locale code, e.g. "en", "uk", "da"'),
    },
    async ({ content_type, page, page_size, locale }) => {
      const authError = requireAuth(client);
      if (authError) return { content: [{ type: 'text' as const, text: authError }], isError: true };

      try {
        const kind = await getKind(content_type);

        if (kind === 'singleType') {
          const data = await client.getSingleType(content_type, locale);
          return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
        }

        const data = await client.listCollectionEntries(content_type, { page: page || 1, pageSize: page_size || 10, locale });
        const results = data.results || [];
        const pagination = data.pagination || {};

        const summary = results.map((r: any) => {
          const name = r.name || r.title || r.websiteName || r.documentId;
          return `- ${name} (documentId: ${r.documentId}, published: ${!!r.publishedAt})`;
        }).join('\n');

        return {
          content: [{
            type: 'text' as const,
            text: `${content_type} — Page ${pagination.page}/${pagination.pageCount} (${pagination.total} total)\n\n${summary}`,
          }],
        };
      } catch (error: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'get_entry',
    'Fetch a single entry with all its field data. For collection types, provide the document_id (get it from list_entries). For single types, omit document_id — there is only one entry. Returns the full entry including nested components and relations.',
    {
      content_type: z.string().describe('Content type UID'),
      document_id: z.string().optional().describe('Document ID (required for collection types, omit for single types)'),
      locale: z.string().optional().describe('Locale code'),
    },
    async ({ content_type, document_id, locale }) => {
      const authError = requireAuth(client);
      if (authError) return { content: [{ type: 'text' as const, text: authError }], isError: true };

      try {
        const kind = await getKind(content_type);
        let data;

        if (kind === 'singleType') {
          data = await client.getSingleType(content_type, locale);
        } else {
          if (!document_id) {
            return { content: [{ type: 'text' as const, text: 'document_id is required for collection types.' }], isError: true };
          }
          data = await client.getCollectionEntry(content_type, document_id, locale);
        }

        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'create_entry',
    'Create a new entry in a collection type (e.g. a new News Article or Product). Pass field values as a JSON string in the \'data\' parameter. Use describe_content_type first to know the exact field names. Cannot be used for single types — those already exist, use update_entry instead.',
    {
      content_type: z.string().describe('Content type UID (must be a collection type)'),
      data: z.string().describe('JSON string with field values, e.g. {"title": "My Article", "body": "Content..."}'),
    },
    async ({ content_type, data: dataStr }) => {
      const authError = requireAuth(client);
      if (authError) return { content: [{ type: 'text' as const, text: authError }], isError: true };

      try {
        const kind = await getKind(content_type);
        if (kind === 'singleType') {
          return { content: [{ type: 'text' as const, text: 'Cannot create entries for single types. Use update_entry instead.' }], isError: true };
        }

        const parsed = JSON.parse(dataStr);
        const result = await client.createCollectionEntry(content_type, parsed);
        const entry = result.data || result;
        return {
          content: [{
            type: 'text' as const,
            text: `Created successfully.\nDocument ID: ${entry.documentId}\nID: ${entry.id}`,
          }],
        };
      } catch (error: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'update_entry',
    'Update an existing entry\'s fields. For collection types, provide the document_id. For single types (Home Page, Global, etc.), omit document_id. Pass only the fields you want to change as a JSON string. Note: updates are saved as drafts — use publish_entry afterward to make changes live.',
    {
      content_type: z.string().describe('Content type UID'),
      document_id: z.string().optional().describe('Document ID (required for collection types)'),
      data: z.string().describe('JSON string with fields to update'),
      locale: z.string().optional().describe('Locale code'),
    },
    async ({ content_type, document_id, data: dataStr, locale }) => {
      const authError = requireAuth(client);
      if (authError) return { content: [{ type: 'text' as const, text: authError }], isError: true };

      try {
        const kind = await getKind(content_type);
        const parsed = JSON.parse(dataStr);
        let result;

        if (kind === 'singleType') {
          result = await client.updateSingleType(content_type, parsed, locale);
        } else {
          if (!document_id) {
            return { content: [{ type: 'text' as const, text: 'document_id is required for collection types.' }], isError: true };
          }
          result = await client.updateCollectionEntry(content_type, document_id, parsed);
        }

        return { content: [{ type: 'text' as const, text: 'Updated successfully.' }] };
      } catch (error: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'delete_entry',
    'Permanently delete an entry from a collection type. Requires the document_id. Cannot delete single type entries. This action cannot be undone — confirm with the user before deleting.',
    {
      content_type: z.string().describe('Content type UID (must be a collection type)'),
      document_id: z.string().describe('Document ID to delete'),
    },
    async ({ content_type, document_id }) => {
      const authError = requireAuth(client);
      if (authError) return { content: [{ type: 'text' as const, text: authError }], isError: true };

      try {
        const kind = await getKind(content_type);
        if (kind === 'singleType') {
          return { content: [{ type: 'text' as const, text: 'Cannot delete single type entries.' }], isError: true };
        }

        await client.deleteCollectionEntry(content_type, document_id);
        return { content: [{ type: 'text' as const, text: `Deleted successfully (documentId: ${document_id}).` }] };
      } catch (error: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
