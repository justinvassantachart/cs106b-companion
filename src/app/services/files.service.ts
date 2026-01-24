import { Injectable } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, Firestore } from 'firebase/firestore';
import { firebaseConfig } from '../firebase-config';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { map, catchError, tap, shareReplay } from 'rxjs/operators';
import { CompanionFile } from '../companion-files';

export type FilesLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

@Injectable({
    providedIn: 'root'
})
export class FilesService {
    private firestore: Firestore;
    private readonly COLLECTION = 'master_files';

    private _loadingStatus$ = new BehaviorSubject<FilesLoadingStatus>('idle');
    public loadingStatus$: Observable<FilesLoadingStatus> = this._loadingStatus$.asObservable();

    private filesCache$: Observable<CompanionFile[]> | null = null;

    constructor() {
        // Reuse existing Firebase app or initialize if not yet done
        const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        this.firestore = getFirestore(app);
    }

    /**
     * Load all companion files from Firestore.
     * Results are cached - subsequent calls return the same observable.
     */
    loadFiles(): Observable<CompanionFile[]> {
        // Return cached observable if available
        if (this.filesCache$) {
            return this.filesCache$;
        }

        this._loadingStatus$.next('loading');

        this.filesCache$ = from(this.fetchFilesFromFirestore()).pipe(
            tap(() => this._loadingStatus$.next('loaded')),
            catchError((error) => {
                console.error('[FilesService] Failed to load files:', error);
                this._loadingStatus$.next('error');
                // Return empty array on error so app doesn't crash
                return of([]);
            }),
            shareReplay(1) // Cache the result
        );

        return this.filesCache$;
    }

    /**
     * Internal method to fetch files from Firestore
     */
    private async fetchFilesFromFirestore(): Promise<CompanionFile[]> {
        console.log('[FilesService] Fetching files from Firestore...');

        const filesCollection = collection(this.firestore, this.COLLECTION);
        const snapshot = await getDocs(filesCollection);

        const files: CompanionFile[] = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            files.push({
                id: data['id'] || doc.id,
                title: data['title'] || 'Untitled',
                description: data['description'] || '',
                srcPath: data['srcPath'],
                starterCode: data['starterCode'],
                group: data['group']
            });
        });

        console.log(`[FilesService] Loaded ${files.length} files from Firestore`);
        return files;
    }

    /**
     * Force refresh files from Firestore (clears cache)
     */
    refreshFiles(): Observable<CompanionFile[]> {
        this.filesCache$ = null;
        return this.loadFiles();
    }
}
