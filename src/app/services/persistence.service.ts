import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { firebaseConfig } from '../firebase-config';

interface CompanionDB extends DBSchema {
    code: {
        key: string;
        value: {
            fileId: string;
            code: string;
            timestamp: number;
        };
    };
}

@Injectable({
    providedIn: 'root'
})
export class PersistenceService {
    private dbPromise: Promise<IDBPDatabase<CompanionDB>>;
    private firestore: Firestore;
    private readonly COLLECTION = 'user_code';

    constructor() {
        this.dbPromise = openDB<CompanionDB>('companion-db', 1, {
            upgrade(db) {
                db.createObjectStore('code', { keyPath: 'fileId' });
            },
        });

        const app = initializeApp(firebaseConfig);
        this.firestore = getFirestore(app);
    }

    async saveCode(fileId: string, code: string, userId?: string): Promise<void> {
        const timestamp = Date.now();
        // 1. Save to Local (IndexedDB) - Always save locally for offline capabilities
        // Note: For multi-user support on shared device, we might normally clear this on logout.
        // For now, we keep it as a "workspace" cache.
        const db = await this.dbPromise;
        await db.put('code', { fileId, code, timestamp });

        // 2. Sync to Cloud if User is Logged In
        if (userId) {
            try {
                await setDoc(doc(this.firestore, this.COLLECTION, `${userId}_${fileId}`), {
                    fileId,
                    code,
                    timestamp,
                    userId
                });
            } catch (e) {
                console.warn('Firebase sync failed:', e);
            }
        }
    }

    async loadCode(fileId: string, userId?: string): Promise<string | null> {
        // 1. Try Local First (Immediate return for speed)
        const db = await this.dbPromise;
        const localData = await db.get('code', fileId);

        // If we have a logged-in user, we should prefer their cloud data if it's newer?
        // Or just rely on cloud data to overwrite local if found.

        let localCode = localData ? localData.code : null;

        // 2. Try Cloud if User is Logged In
        if (userId) {
            try {
                const snapshot = await getDoc(doc(this.firestore, this.COLLECTION, `${userId}_${fileId}`));
                if (snapshot.exists()) {
                    const data = snapshot.data() as any;

                    // Logic: Could check timestamps here.
                    // For simplicity: Cloud wins if it exists.
                    // Update local cache so next load is fast
                    await db.put('code', { fileId, code: data.code, timestamp: data.timestamp });
                    return data.code;
                }
            } catch (e) {
                console.warn('Firebase fetch failed:', e);
            }
        }

        return localCode;
    }
}
