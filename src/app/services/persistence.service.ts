import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { firebaseConfig } from '../firebase-config';
import { BehaviorSubject, Observable } from 'rxjs';

interface CompanionDB extends DBSchema {
    code: {
        key: string; // Format: {userId}_{fileId}
        value: {
            key: string;
            fileId: string;
            userId: string;
            code: string;
            timestamp: number;
            synced: boolean; // Track if synced to cloud
        };
    };
}

export type SyncStatus = 'idle' | 'syncing' | 'error';

@Injectable({
    providedIn: 'root'
})
export class PersistenceService {
    private dbPromise: Promise<IDBPDatabase<CompanionDB>>;
    private firestore: Firestore;
    private readonly COLLECTION = 'user_code';

    private _syncStatus$ = new BehaviorSubject<SyncStatus>('idle');
    public syncStatus$: Observable<SyncStatus> = this._syncStatus$.asObservable();

    private pendingSyncs = 0;

    constructor() {
        // Use new DB name to avoid upgrade issues with old schema
        this.dbPromise = openDB<CompanionDB>('companion-user-db', 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('code')) {
                    db.createObjectStore('code', { keyPath: 'key' });
                }
            },
        });

        // Reuse existing Firebase app or initialize if not yet done
        const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        this.firestore = getFirestore(app);
    }

    /**
     * Save code for a specific user.
     * No persistence for anonymous users (userId undefined/null).
     * Local-first: saves to IndexedDB immediately, then syncs to Firestore in background.
     */
    async saveCode(fileId: string, code: string, userId?: string): Promise<void> {
        // No persistence for anonymous users
        if (!userId) {
            return;
        }

        const timestamp = Date.now();
        const key = `${userId}_${fileId}`;

        // 1. Save to Local (IndexedDB) - Immediate, local-first
        const db = await this.dbPromise;
        await db.put('code', {
            key,
            fileId,
            userId,
            code,
            timestamp,
            synced: false
        });

        // 2. Sync to Cloud in background
        this.syncToCloud(key, fileId, userId, code, timestamp);
    }

    /**
     * Background sync to Firestore with status tracking
     */
    private async syncToCloud(
        key: string,
        fileId: string,
        userId: string,
        code: string,
        timestamp: number
    ): Promise<void> {
        this.pendingSyncs++;
        this._syncStatus$.next('syncing');

        try {
            await setDoc(doc(this.firestore, this.COLLECTION, key), {
                fileId,
                code,
                timestamp,
                userId
            });

            // Mark as synced in local DB
            const db = await this.dbPromise;
            const existing = await db.get('code', key);
            if (existing && existing.timestamp === timestamp) {
                await db.put('code', { ...existing, synced: true });
            }
        } catch (e) {
            console.warn('Firebase sync failed:', e);
            this._syncStatus$.next('error');
            // Keep local copy; will retry on next save
            this.pendingSyncs--;
            return;
        }

        this.pendingSyncs--;
        if (this.pendingSyncs === 0) {
            this._syncStatus$.next('idle');
        }
    }

    /**
     * Load code for a specific user.
     * No persistence for anonymous users.
     * Local-first: returns local data immediately, fetches cloud data in background.
     */
    async loadCode(fileId: string, userId?: string): Promise<string | null> {
        console.log('[Persistence] loadCode called:', { fileId, userId: userId?.substring(0, 8) });

        // No persistence for anonymous users
        if (!userId) {
            console.log('[Persistence] No userId, returning null');
            return null;
        }

        const key = `${userId}_${fileId}`;
        const db = await this.dbPromise;

        // 1. Try Local First (Immediate return for speed)
        console.log('[Persistence] Checking local IndexedDB...');
        const localData = await db.get('code', key);
        let localCode = localData ? localData.code : null;
        let localTimestamp = localData ? localData.timestamp : 0;
        console.log('[Persistence] Local data:', { found: !!localData, codeLength: localCode?.length });

        // 2. Fetch cloud data in background with timeout (don't block return)
        this.fetchCloudData(key, fileId, userId, localTimestamp, db);

        // Return local data immediately (or null if none)
        return localCode;
    }

    /**
     * Background fetch from Firestore with timeout
     */
    private async fetchCloudData(
        key: string,
        fileId: string,
        userId: string,
        localTimestamp: number,
        db: IDBPDatabase<CompanionDB>
    ): Promise<void> {
        console.log('[Persistence] Starting background cloud fetch...');

        // Create a timeout promise
        const timeoutPromise = new Promise<null>((resolve) => {
            setTimeout(() => {
                console.log('[Persistence] Cloud fetch timed out after 5s');
                resolve(null);
            }, 5000);
        });

        try {
            // Race between Firestore and timeout
            const snapshot = await Promise.race([
                getDoc(doc(this.firestore, this.COLLECTION, key)),
                timeoutPromise
            ]);

            if (!snapshot) {
                console.log('[Persistence] Cloud fetch timed out or returned null');
                return;
            }

            if (snapshot.exists()) {
                const data = snapshot.data() as any;
                console.log('[Persistence] Cloud data found:', { cloudTimestamp: data.timestamp, localTimestamp });

                // Cloud is newer - update local cache
                if (data.timestamp > localTimestamp) {
                    console.log('[Persistence] Cloud is newer, updating local cache');
                    await db.put('code', {
                        key,
                        fileId,
                        userId,
                        code: data.code,
                        timestamp: data.timestamp,
                        synced: true
                    });
                    // Note: We don't notify the UI here - user keeps editing their local version
                    // On next page load, they'll get the cloud version
                }
            } else {
                console.log('[Persistence] No cloud data found for this key');
            }
        } catch (e) {
            console.warn('[Persistence] Cloud fetch failed:', e);
        }
    }

    /**
     * Clear local data for a user (useful on logout to reset state)
     */
    async clearUserData(userId: string): Promise<void> {
        if (!userId) return;

        const db = await this.dbPromise;
        const tx = db.transaction('code', 'readwrite');
        const store = tx.objectStore('code');

        // Get all keys and delete those belonging to this user
        const allKeys = await store.getAllKeys();
        for (const key of allKeys) {
            if (typeof key === 'string' && key.startsWith(`${userId}_`)) {
                await store.delete(key);
            }
        }
        await tx.done;
    }
}
