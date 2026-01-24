import { Injectable, inject, signal, computed } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    setDoc,
    deleteDoc,
    Firestore
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { firebaseConfig } from '../firebase-config';
import { CompanionFile } from '../companion-files';
import { FilesService } from './files.service';

export interface MasterFile extends CompanionFile {
    // Extends CompanionFile with any additional admin-specific fields
}

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private firestore: Firestore;
    private readonly COLLECTION = 'master_files';
    private filesService = inject(FilesService);

    // Reactive state for admin status
    private _isAdmin = signal<boolean>(false);
    private _isLoading = signal<boolean>(true);
    private _currentUser = signal<User | null>(null);

    public readonly isAdmin = this._isAdmin.asReadonly();
    public readonly isLoading = this._isLoading.asReadonly();
    public readonly currentUser = this._currentUser.asReadonly();

    constructor() {
        const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        this.firestore = getFirestore(app);

        // Listen for auth state changes and check admin claim
        const auth = getAuth(app);
        onAuthStateChanged(auth, async (user) => {
            this._currentUser.set(user);
            if (user) {
                const tokenResult = await user.getIdTokenResult();
                const isAdmin = tokenResult.claims['admin'] === true;
                this._isAdmin.set(isAdmin);
                console.log('[AdminService] Admin status:', isAdmin);
            } else {
                this._isAdmin.set(false);
            }
            this._isLoading.set(false);
        });
    }

    /**
     * Force refresh admin status (useful after claims change)
     */
    async refreshAdminStatus(): Promise<boolean> {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
            // Force token refresh
            await user.getIdToken(true);
            const tokenResult = await user.getIdTokenResult();
            const isAdmin = tokenResult.claims['admin'] === true;
            this._isAdmin.set(isAdmin);
            return isAdmin;
        }
        return false;
    }

    /**
     * Get all master files
     */
    async getAllFiles(): Promise<MasterFile[]> {
        const filesCollection = collection(this.firestore, this.COLLECTION);
        const snapshot = await getDocs(filesCollection);

        const files: MasterFile[] = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            files.push({
                id: data['id'] || docSnap.id,
                title: data['title'] || 'Untitled',
                description: data['description'] || '',
                srcPath: data['srcPath'],
                starterCode: data['starterCode'],
                group: data['group']
            });
        });

        return files;
    }

    /**
     * Create a new master file
     */
    async createFile(file: MasterFile): Promise<void> {
        const docRef = doc(this.firestore, this.COLLECTION, file.id);
        await setDoc(docRef, {
            id: file.id,
            title: file.title,
            description: file.description,
            srcPath: file.srcPath || null,
            starterCode: file.starterCode || '',
            group: file.group || 'General'
        });

        // Refresh the main files service cache
        this.filesService.refreshFiles();
        console.log('[AdminService] Created file:', file.id);
    }

    /**
     * Update an existing master file
     */
    async updateFile(id: string, updates: Partial<MasterFile>): Promise<void> {
        const docRef = doc(this.firestore, this.COLLECTION, id);

        // Filter out undefined values
        const cleanUpdates: Record<string, any> = {};
        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                cleanUpdates[key] = value;
            }
        }

        await setDoc(docRef, cleanUpdates, { merge: true });

        // Refresh the main files service cache
        this.filesService.refreshFiles();
        console.log('[AdminService] Updated file:', id);
    }

    /**
     * Delete a master file
     */
    async deleteFile(id: string): Promise<void> {
        const docRef = doc(this.firestore, this.COLLECTION, id);
        await deleteDoc(docRef);

        // Refresh the main files service cache
        this.filesService.refreshFiles();
        console.log('[AdminService] Deleted file:', id);
    }
}
