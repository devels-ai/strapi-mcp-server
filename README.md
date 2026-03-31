# Strapi MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that connects AI assistants to your Strapi CMS. Enables AI to browse, create, edit, publish, and manage content through natural conversation.

## Features

- **Full CRUD** — Create, read, update, delete content entries
- **Schema introspection** — AI discovers your content types, fields, and relations automatically
- **Publish workflow** — Publish and unpublish entries directly
- **Media management** — Browse, upload, and update media files (alt text, captions)
- **i18n support** — Work with multiple locales
- **Secure auth** — Login with Strapi admin credentials, role-based permissions
- **Single & Collection types** — Handles both seamlessly
- **Zero config on CMS side** — Uses Strapi's built-in admin API, no plugins required

## Tools

| Tool | Description |
|------|-------------|
| `login` | Authenticate with Strapi admin credentials |
| `get_session` | Check current user and role |
| `list_content_types` | Discover all content types and their structure |
| `describe_content_type` | Get detailed field definitions for a content type |
| `list_entries` | Browse entries with pagination |
| `get_entry` | Fetch a single entry with all fields |
| `create_entry` | Create new content |
| `update_entry` | Update existing content |
| `delete_entry` | Delete content |
| `publish_entry` | Make content live on the website |
| `unpublish_entry` | Revert to draft |
| `list_media` | Browse Media Library |
| `upload_media` | Upload files to Media Library |
| `update_media` | Update file metadata (alt text, caption, name) |

## Quick Start

### Install

```bash
npm install -g github:devels-ai/strapi-mcp-server
```

### Configure

Add to your AI client's MCP configuration:

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "strapi": {
      "command": "strapi-mcp-server",
      "env": {
        "STRAPI_URL": "https://your-strapi-instance.com"
      }
    }
  }
}
```

**Claude Code** (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "strapi": {
      "command": "strapi-mcp-server",
      "env": {
        "STRAPI_URL": "https://your-strapi-instance.com"
      }
    }
  }
}
```

**Cursor**: Settings → MCP Servers → Add the same configuration.

### Use

After restarting your AI client:

1. AI will ask for your Strapi admin email and password
2. Once authenticated, ask it to help with content — e.g.:
   - *"Show me all content types"*
   - *"Create a new news article about our product launch"*
   - *"Update the home page hero title"*
   - *"List all unpublished drafts"*
   - *"Upload this image and set the alt text"*

## How It Works

The MCP server connects to Strapi's admin API using your credentials. It inherits your role's permissions — if your Strapi account can't delete content, the AI can't either.

```
AI Client ←→ MCP Server ←→ Strapi Admin API
              (local)        (your server)
```

- MCP server runs **locally** on your machine
- Communicates with AI via **stdio** (standard MCP transport)
- Calls Strapi's **admin REST API** over HTTPS
- JWT token stored **in memory only** (per session)

## Requirements

- Node.js 18+
- Strapi v5
- A Strapi admin account

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `STRAPI_URL` | Your Strapi instance URL | `http://localhost:1337` |

## Security

- Credentials are sent directly to your Strapi instance — never to third parties
- JWT tokens are stored in memory only, never persisted to disk
- The MCP server respects your Strapi role permissions
- No data leaves your infrastructure

## License

MIT
