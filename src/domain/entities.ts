export interface EntityMetadata {
    id: string;
    createdAt: string; // ISO datetime string
    updatedAt: string; // ISO datetime string
}

export interface SoftDeletable {
    deleted: 0 | 1; // 0 = active, 1 = soft-deleted
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };
