import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { StrapiClient } from '../strapi-client.js';

function requireAuth(client: StrapiClient): string | null {
  if (!client.isAuthenticated) {
    return 'Not authenticated. Please use the login tool first with your Strapi admin credentials.';
  }
  return null;
}

export function registerSchemaTools(server: McpServer, client: StrapiClient) {
  server.tool(
    'list_content_types',
    "Discover all content types in this Strapi CMS. Returns each type's UID (needed for other tools), kind (singleType or collectionType), display name, and field count. Call this after login to understand what content is available to manage.",
    {},
    async () => {
      const authError = requireAuth(client);
      if (authError) return { content: [{ type: 'text' as const, text: authError }], isError: true };

      try {
        const types = await client.getContentTypes();
        const lines = types.map((ct: any) => {
          const fieldCount = Object.keys(ct.attributes || {}).length;
          return `- ${ct.info.displayName} (${ct.uid}) [${ct.kind}] — ${fieldCount} fields`;
        });
        return { content: [{ type: 'text' as const, text: `Content Types:\n\n${lines.join('\n')}` }] };
      } catch (error: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'describe_content_type',
    'Get the complete field structure of a content type — field names, types, whether required, component details, and relation targets. Also shows CMS labels and descriptions that content managers see. ALWAYS call this before creating or updating entries to know the exact field names and types expected.',
    { uid: z.string().describe('Content type UID, e.g. "api::home-page.home-page" or "api::news-article.news-article"') },
    async ({ uid }) => {
      const authError = requireAuth(client);
      if (authError) return { content: [{ type: 'text' as const, text: authError }], isError: true };

      try {
        const types = await client.getContentTypes();
        const ct = types.find((t: any) => t.uid === uid);
        if (!ct) {
          return { content: [{ type: 'text' as const, text: `Content type "${uid}" not found.` }], isError: true };
        }

        const config = await client.getContentTypeConfiguration(uid);
        const fields = Object.entries(ct.attributes || {}).map(([name, attr]: [string, any]) => {
          let desc = `  - ${name}: ${attr.type}`;
          if (attr.required) desc += ' (required)';
          if (attr.component) desc += ` → ${attr.component}${attr.repeatable ? ' (repeatable)' : ''}`;
          if (attr.relation) desc += ` → ${attr.target} (${attr.relation})`;
          if (attr.enum) desc += ` [${attr.enum.join(', ')}]`;
          return desc;
        });

        const metadatas = config?.contentType?.metadatas || {};
        const fieldLabels = Object.entries(metadatas)
          .filter(([key]: [string, any]) => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'createdBy' && key !== 'updatedBy' && key !== 'documentId')
          .map(([key, meta]: [string, any]) => {
            const label = meta?.edit?.label || key;
            const desc = meta?.edit?.description || '';
            return `  - ${key}: "${label}"${desc ? ` — ${desc}` : ''}`;
          });

        return {
          content: [{
            type: 'text' as const,
            text: `${ct.info.displayName} (${ct.uid})\nKind: ${ct.kind}\n\nFields:\n${fields.join('\n')}\n\nCMS Labels:\n${fieldLabels.join('\n')}`,
          }],
        };
      } catch (error: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
