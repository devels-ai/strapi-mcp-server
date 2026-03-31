"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthTools = registerAuthTools;
const zod_1 = require("zod");
function registerAuthTools(server, client) {
    server.tool('login', "Authenticate with Strapi CMS. Call this FIRST before any other tool. Requires the user's admin email and password. On success, stores a session token for subsequent requests. If the user hasn't provided credentials, ask them for their Strapi admin email and password.", { email: zod_1.z.string().describe('Strapi admin email'), password: zod_1.z.string().describe('Strapi admin password') }, async ({ email, password }) => {
        try {
            const user = await client.login(email, password);
            return {
                content: [{
                        type: 'text',
                        text: `Successfully logged in as ${user.firstname} ${user.lastname} (${user.email})\nRole: ${user.roles.map(r => r.name).join(', ')}`,
                    }],
            };
        }
        catch (error) {
            return { content: [{ type: 'text', text: `Login failed: ${error.message}` }], isError: true };
        }
    });
    server.tool('get_session', 'Check who is currently logged in and their role/permissions. Use this to verify authentication status or to remind yourself of the current user context.', {}, async () => {
        if (!client.isAuthenticated) {
            return { content: [{ type: 'text', text: 'Not authenticated. Please use the login tool first with your Strapi admin credentials.' }], isError: true };
        }
        const user = client.currentUser;
        return {
            content: [{
                    type: 'text',
                    text: `Logged in as: ${user.firstname} ${user.lastname}\nEmail: ${user.email}\nRole: ${user.roles.map(r => r.name).join(', ')}`,
                }],
        };
    });
}
