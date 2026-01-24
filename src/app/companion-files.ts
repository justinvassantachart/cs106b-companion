/**
 * Interface for companion files loaded from Firestore.
 * 
 * NOTE: The FILES array has been moved to the 'master_files' collection in Firestore.
 * See files.service.ts for loading logic.
 */
export interface CompanionFile {
    id: string;
    title: string;
    description: string;
    srcPath?: string;
    starterCode?: string;
    group?: string;
}
