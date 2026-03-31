"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrapiClient = void 0;
class StrapiClient {
    baseUrl;
    jwt = null;
    user = null;
    constructor(baseUrl) {
        this.baseUrl = (baseUrl || process.env.STRAPI_URL || 'http://localhost:1337').replace(/\/$/, '');
    }
    get isAuthenticated() {
        return this.jwt !== null;
    }
    get currentUser() {
        return this.user;
    }
    async request(path, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        };
        if (this.jwt) {
            headers['Authorization'] = `Bearer ${this.jwt}`;
        }
        const response = await fetch(`${this.baseUrl}${path}`, {
            ...options,
            headers,
        });
        if (response.status === 401) {
            this.jwt = null;
            this.user = null;
            throw new Error('Session expired. Please login again using the login tool.');
        }
        if (!response.ok) {
            const text = await response.text();
            let message;
            try {
                const json = JSON.parse(text);
                message = json.error?.message || json.message || text;
            }
            catch {
                message = text;
            }
            throw new Error(`Strapi API error (${response.status}): ${message}`);
        }
        return response.json();
    }
    // Auth
    async login(email, password) {
        const data = await this.request('/admin/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        this.jwt = data.data.token;
        // Fetch user info
        const me = await this.request('/admin/users/me');
        this.user = me.data;
        return this.user;
    }
    // Schema
    async getContentTypes() {
        const data = await this.request('/content-manager/content-types');
        return data.data.filter((ct) => ct.uid.startsWith('api::'));
    }
    async getContentTypeConfiguration(uid) {
        const data = await this.request(`/content-manager/content-types/${uid}/configuration`);
        return data.data;
    }
    // Content — collection types
    async listCollectionEntries(uid, params = {}) {
        const query = new URLSearchParams();
        if (params.page)
            query.set('page', String(params.page));
        if (params.pageSize)
            query.set('pageSize', String(params.pageSize));
        if (params.locale)
            query.set('locale', params.locale);
        const qs = query.toString() ? `?${query.toString()}` : '';
        return this.request(`/content-manager/collection-types/${uid}${qs}`);
    }
    async getCollectionEntry(uid, documentId, locale) {
        const qs = locale ? `?locale=${locale}` : '';
        return this.request(`/content-manager/collection-types/${uid}/${documentId}${qs}`);
    }
    async createCollectionEntry(uid, data) {
        return this.request(`/content-manager/collection-types/${uid}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async updateCollectionEntry(uid, documentId, data) {
        return this.request(`/content-manager/collection-types/${uid}/${documentId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
    async deleteCollectionEntry(uid, documentId) {
        return this.request(`/content-manager/collection-types/${uid}/${documentId}`, {
            method: 'DELETE',
        });
    }
    // Content — single types
    async getSingleType(uid, locale) {
        const qs = locale ? `?locale=${locale}` : '';
        return this.request(`/content-manager/single-types/${uid}${qs}`);
    }
    async updateSingleType(uid, data, locale) {
        const qs = locale ? `?locale=${locale}` : '';
        return this.request(`/content-manager/single-types/${uid}${qs}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
    // Publish
    async publishEntry(uid, kind, documentId, locale) {
        const base = kind === 'singleType'
            ? `/content-manager/single-types/${uid}/actions/publish`
            : `/content-manager/collection-types/${uid}/${documentId}/actions/publish`;
        const qs = locale ? `?locale=${locale}` : '';
        return this.request(`${base}${qs}`, { method: 'POST' });
    }
    async unpublishEntry(uid, kind, documentId, locale) {
        const base = kind === 'singleType'
            ? `/content-manager/single-types/${uid}/actions/unpublish`
            : `/content-manager/collection-types/${uid}/${documentId}/actions/unpublish`;
        const qs = locale ? `?locale=${locale}` : '';
        return this.request(`${base}${qs}`, { method: 'POST' });
    }
    // Media
    async listMedia(params = {}) {
        const query = new URLSearchParams();
        if (params.page)
            query.set('page', String(params.page));
        if (params.pageSize)
            query.set('pageSize', String(params.pageSize));
        const qs = query.toString() ? `?${query.toString()}` : '';
        return this.request(`/upload/files${qs}`);
    }
    async updateMedia(id, data) {
        return this.request(`/upload/files/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ fileInfo: data }),
        });
    }
    // Upload media — needs multipart form
    async uploadMedia(fileName, base64Data, mimeType) {
        const buffer = Buffer.from(base64Data, 'base64');
        const boundary = '----MCPBoundary' + Date.now();
        let body = '';
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="files"; filename="${fileName}"\r\n`;
        body += `Content-Type: ${mimeType}\r\n\r\n`;
        const header = Buffer.from(body);
        const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
        const fullBody = Buffer.concat([header, buffer, footer]);
        const response = await fetch(`${this.baseUrl}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.jwt}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
            },
            body: fullBody,
        });
        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
        }
        return response.json();
    }
}
exports.StrapiClient = StrapiClient;
