import type { StrapiUser, ContentTypeInfo } from './types.js';
export declare class StrapiClient {
    private baseUrl;
    private jwt;
    private user;
    constructor(baseUrl?: string);
    get isAuthenticated(): boolean;
    get currentUser(): StrapiUser | null;
    private request;
    login(email: string, password: string): Promise<StrapiUser>;
    getContentTypes(): Promise<ContentTypeInfo[]>;
    getContentTypeConfiguration(uid: string): Promise<any>;
    listCollectionEntries(uid: string, params?: {
        page?: number;
        pageSize?: number;
        locale?: string;
    }): Promise<any>;
    getCollectionEntry(uid: string, documentId: string, locale?: string): Promise<any>;
    createCollectionEntry(uid: string, data: Record<string, any>): Promise<any>;
    updateCollectionEntry(uid: string, documentId: string, data: Record<string, any>): Promise<any>;
    deleteCollectionEntry(uid: string, documentId: string): Promise<any>;
    getSingleType(uid: string, locale?: string): Promise<any>;
    updateSingleType(uid: string, data: Record<string, any>, locale?: string): Promise<any>;
    publishEntry(uid: string, kind: string, documentId?: string, locale?: string): Promise<any>;
    unpublishEntry(uid: string, kind: string, documentId?: string, locale?: string): Promise<any>;
    listMedia(params?: {
        page?: number;
        pageSize?: number;
    }): Promise<any>;
    updateMedia(id: number, data: {
        name?: string;
        alternativeText?: string;
        caption?: string;
    }): Promise<any>;
    uploadMedia(fileName: string, base64Data: string, mimeType: string): Promise<any>;
}
