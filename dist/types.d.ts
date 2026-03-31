export interface StrapiUser {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    roles: {
        id: number;
        name: string;
        code: string;
    }[];
}
export interface ContentTypeInfo {
    uid: string;
    kind: 'singleType' | 'collectionType';
    displayName: string;
    info: {
        singularName: string;
        pluralName: string;
        displayName: string;
    };
    attributes: Record<string, {
        type: string;
        required?: boolean;
        component?: string;
        repeatable?: boolean;
        relation?: string;
        target?: string;
        enum?: string[];
    }>;
}
