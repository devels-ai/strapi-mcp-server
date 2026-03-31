import type { StrapiUser, ContentTypeInfo } from './types.js';

export class StrapiClient {
  private baseUrl: string;
  private jwt: string | null = null;
  private user: StrapiUser | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl || process.env.STRAPI_URL || 'http://localhost:1337').replace(/\/$/, '');
  }

  get isAuthenticated(): boolean {
    return this.jwt !== null;
  }

  get currentUser(): StrapiUser | null {
    return this.user;
  }

  private async request(path: string, options: RequestInit = {}): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
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
      let message: string;
      try {
        const json = JSON.parse(text);
        message = json.error?.message || json.message || text;
      } catch {
        message = text;
      }
      throw new Error(`Strapi API error (${response.status}): ${message}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string): Promise<StrapiUser> {
    const data = await this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.jwt = data.data.token;
    // Fetch user info
    const me = await this.request('/admin/users/me');
    this.user = me.data;
    return this.user!;
  }

  // Schema
  async getContentTypes(): Promise<ContentTypeInfo[]> {
    const data = await this.request('/content-manager/content-types');
    return data.data.filter((ct: any) => ct.uid.startsWith('api::'));
  }

  async getContentTypeConfiguration(uid: string): Promise<any> {
    const data = await this.request(`/content-manager/content-types/${uid}/configuration`);
    return data.data;
  }

  // Content — collection types
  async listCollectionEntries(uid: string, params: { page?: number; pageSize?: number; locale?: string } = {}): Promise<any> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    if (params.locale) query.set('locale', params.locale);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/content-manager/collection-types/${uid}${qs}`);
  }

  async getCollectionEntry(uid: string, documentId: string, locale?: string): Promise<any> {
    const qs = locale ? `?locale=${locale}` : '';
    return this.request(`/content-manager/collection-types/${uid}/${documentId}${qs}`);
  }

  async createCollectionEntry(uid: string, data: Record<string, any>): Promise<any> {
    return this.request(`/content-manager/collection-types/${uid}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCollectionEntry(uid: string, documentId: string, data: Record<string, any>): Promise<any> {
    return this.request(`/content-manager/collection-types/${uid}/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCollectionEntry(uid: string, documentId: string): Promise<any> {
    return this.request(`/content-manager/collection-types/${uid}/${documentId}`, {
      method: 'DELETE',
    });
  }

  // Content — single types
  async getSingleType(uid: string, locale?: string): Promise<any> {
    const qs = locale ? `?locale=${locale}` : '';
    return this.request(`/content-manager/single-types/${uid}${qs}`);
  }

  async updateSingleType(uid: string, data: Record<string, any>, locale?: string): Promise<any> {
    const qs = locale ? `?locale=${locale}` : '';
    return this.request(`/content-manager/single-types/${uid}${qs}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Publish
  async publishEntry(uid: string, kind: string, documentId?: string, locale?: string): Promise<any> {
    const base = kind === 'singleType'
      ? `/content-manager/single-types/${uid}/actions/publish`
      : `/content-manager/collection-types/${uid}/${documentId}/actions/publish`;
    const qs = locale ? `?locale=${locale}` : '';
    return this.request(`${base}${qs}`, { method: 'POST' });
  }

  async unpublishEntry(uid: string, kind: string, documentId?: string, locale?: string): Promise<any> {
    const base = kind === 'singleType'
      ? `/content-manager/single-types/${uid}/actions/unpublish`
      : `/content-manager/collection-types/${uid}/${documentId}/actions/unpublish`;
    const qs = locale ? `?locale=${locale}` : '';
    return this.request(`${base}${qs}`, { method: 'POST' });
  }

  // Media
  async listMedia(params: { page?: number; pageSize?: number } = {}): Promise<any> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/upload/files${qs}`);
  }

  async updateMedia(id: number, data: { name?: string; alternativeText?: string; caption?: string }): Promise<any> {
    return this.request(`/upload/files/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ fileInfo: data }),
    });
  }

  // Upload media — needs multipart form
  async uploadMedia(fileName: string, base64Data: string, mimeType: string): Promise<any> {
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
