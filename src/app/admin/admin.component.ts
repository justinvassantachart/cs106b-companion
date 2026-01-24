import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Plus, Pencil, Trash2, FolderOpen, FileCode, ArrowLeft, Save, X, RefreshCw } from 'lucide-angular';
import { AdminService, MasterFile } from '../services/admin.service';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';

interface FileGroup {
    name: string;
    files: MasterFile[];
    expanded: boolean;
}

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        LucideAngularModule,
        HlmButtonImports,
        HlmInputImports
    ],

    template: `
        <div class="h-screen flex flex-col bg-background text-foreground">
            <!-- Header -->
            <header class="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
                <div class="flex items-center gap-4">
                    <button hlmBtn variant="ghost" size="icon" (click)="goBack()">
                        <lucide-icon [img]="icons.ArrowLeft" class="h-5 w-5"></lucide-icon>
                    </button>
                    <h1 class="text-xl font-semibold">Admin Portal - Master Files</h1>
                </div>
                <div class="flex items-center gap-2">
                    <button hlmBtn variant="outline" size="sm" (click)="refreshFiles()">
                        <lucide-icon [img]="icons.RefreshCw" class="h-4 w-4 mr-2" [class.animate-spin]="isRefreshing()"></lucide-icon>
                        Refresh
                    </button>
                    <button hlmBtn variant="default" size="sm" (click)="openCreateDialog()">
                        <lucide-icon [img]="icons.Plus" class="h-4 w-4 mr-2"></lucide-icon>
                        New File
                    </button>
                </div>
            </header>

            <!-- Main Content -->
            <main class="flex-1 overflow-auto p-6">
                @if (isLoading()) {
                    <div class="flex items-center justify-center h-64">
                        <div class="animate-pulse text-muted-foreground">Loading files...</div>
                    </div>
                } @else if (error()) {
                    <div class="flex items-center justify-center h-64">
                        <div class="text-destructive">{{ error() }}</div>
                    </div>
                } @else {
                    <!-- File Tree -->
                    <div class="max-w-4xl mx-auto space-y-4">
                        @for (group of fileGroups(); track group.name) {
                            <div class="border border-border rounded-lg overflow-hidden bg-card">
                                <!-- Group Header -->
                                <button 
                                    class="w-full flex items-center gap-3 px-4 py-3 bg-muted/50 hover:bg-muted transition-colors text-left"
                                    (click)="toggleGroup(group)"
                                >
                                    <lucide-icon 
                                        [img]="icons.FolderOpen" 
                                        class="h-5 w-5 text-primary"
                                    ></lucide-icon>
                                    <span class="font-medium flex-1">{{ group.name }}</span>
                                    <span class="text-sm text-muted-foreground">{{ group.files.length }} files</span>
                                </button>
                                
                                <!-- Files List -->
                                @if (group.expanded) {
                                    <div class="divide-y divide-border">
                                        @for (file of group.files; track file.id) {
                                            <div class="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors group">
                                                <lucide-icon [img]="icons.FileCode" class="h-5 w-5 text-muted-foreground"></lucide-icon>
                                                <div class="flex-1 min-w-0">
                                                    <div class="font-medium truncate">{{ file.title }}</div>
                                                    <div class="text-sm text-muted-foreground truncate">{{ file.description }}</div>
                                                    <div class="text-xs text-muted-foreground/70 font-mono">ID: {{ file.id }}</div>
                                                </div>
                                                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        hlmBtn 
                                                        variant="ghost" 
                                                        size="icon-sm"
                                                        (click)="openEditDialog(file); $event.stopPropagation()"
                                                    >
                                                        <lucide-icon [img]="icons.Pencil" class="h-4 w-4"></lucide-icon>
                                                    </button>
                                                    <button 
                                                        hlmBtn 
                                                        variant="ghost" 
                                                        size="icon-sm"
                                                        class="text-destructive hover:text-destructive"
                                                        (click)="confirmDelete(file); $event.stopPropagation()"
                                                    >
                                                        <lucide-icon [img]="icons.Trash2" class="h-4 w-4"></lucide-icon>
                                                    </button>
                                                </div>
                                            </div>
                                        }
                                    </div>
                                }
                            </div>
                        }
                        
                        @if (fileGroups().length === 0) {
                            <div class="text-center py-12 text-muted-foreground">
                                <lucide-icon [img]="icons.FolderOpen" class="h-12 w-12 mx-auto mb-4 opacity-50"></lucide-icon>
                                <p>No master files found.</p>
                                <p class="text-sm">Click "New File" to create one.</p>
                            </div>
                        }
                    </div>
                }
            </main>

            <!-- Edit/Create Dialog (Sheet) -->
            @if (isDialogOpen()) {
                <div class="fixed inset-0 z-50 flex items-center justify-center">
                    <!-- Backdrop -->
                    <div class="absolute inset-0 bg-black/50" (click)="closeDialog()"></div>
                    
                    <!-- Dialog -->
                    <div class="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <!-- Dialog Header -->
                        <div class="flex items-center justify-between px-6 py-4 border-b border-border">
                            <h2 class="text-lg font-semibold">
                                {{ editingFile() ? 'Edit File' : 'Create New File' }}
                            </h2>
                            <button hlmBtn variant="ghost" size="icon-sm" (click)="closeDialog()">
                                <lucide-icon [img]="icons.X" class="h-4 w-4"></lucide-icon>
                            </button>
                        </div>
                        
                        <!-- Dialog Content -->
                        <div class="flex-1 overflow-auto p-6 space-y-4">
                            <!-- ID Field -->
                            <div class="space-y-2">
                                <label class="text-sm font-medium">
                                    ID <span class="text-destructive">*</span>
                                </label>
                                <input 
                                    hlmInput
                                    type="text"
                                    class="w-full"
                                    placeholder="e.g., recursion-intro"
                                    [(ngModel)]="dialogForm.id"
                                    [disabled]="!!editingFile()"
                                />
                                <p class="text-xs text-muted-foreground">
                                    Unique identifier for the file. Cannot be changed after creation.
                                </p>
                            </div>
                            
                            <!-- Title Field -->
                            <div class="space-y-2">
                                <label class="text-sm font-medium">
                                    Title <span class="text-destructive">*</span>
                                </label>
                                <input 
                                    hlmInput
                                    type="text"
                                    class="w-full"
                                    placeholder="e.g., Introduction to Recursion"
                                    [(ngModel)]="dialogForm.title"
                                />
                            </div>
                            
                            <!-- Description Field -->
                            <div class="space-y-2">
                                <label class="text-sm font-medium">Description</label>
                                <textarea 
                                    hlmInput
                                    class="w-full min-h-[80px] resize-y"
                                    placeholder="Brief description of the problem..."
                                    [(ngModel)]="dialogForm.description"
                                ></textarea>
                            </div>
                            
                            <!-- Group Field -->
                            <div class="space-y-2">
                                <label class="text-sm font-medium">Group</label>
                                <input 
                                    hlmInput
                                    type="text"
                                    class="w-full"
                                    placeholder="e.g., Week 1 - Recursion"
                                    [(ngModel)]="dialogForm.group"
                                />
                                <p class="text-xs text-muted-foreground">
                                    Used to organize files in the sidebar.
                                </p>
                            </div>
                            
                            <!-- Source Path Field -->
                            <div class="space-y-2">
                                <label class="text-sm font-medium">Source Path (Optional)</label>
                                <input 
                                    hlmInput
                                    type="text"
                                    class="w-full font-mono text-sm"
                                    placeholder="e.g., assets/problems/recursion.cpp"
                                    [(ngModel)]="dialogForm.srcPath"
                                />
                                <p class="text-xs text-muted-foreground">
                                    Path to load initial code from assets. Leave empty to use starter code below.
                                </p>
                            </div>
                            
                            <!-- Starter Code Field -->
                            <div class="space-y-2">
                                <label class="text-sm font-medium">Starter Code</label>
                                <textarea 
                                    hlmInput
                                    class="w-full min-h-[200px] resize-y font-mono text-sm"
                                    placeholder="// Your starter code here..."
                                    [(ngModel)]="dialogForm.starterCode"
                                ></textarea>
                            </div>
                        </div>
                        
                        <!-- Dialog Footer -->
                        <div class="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/30">
                            <button hlmBtn variant="outline" (click)="closeDialog()">
                                Cancel
                            </button>
                            <button 
                                hlmBtn 
                                variant="default" 
                                (click)="saveFile()"
                                [disabled]="!isFormValid() || isSaving()"
                            >
                                @if (isSaving()) {
                                    <lucide-icon [img]="icons.RefreshCw" class="h-4 w-4 mr-2 animate-spin"></lucide-icon>
                                } @else {
                                    <lucide-icon [img]="icons.Save" class="h-4 w-4 mr-2"></lucide-icon>
                                }
                                {{ editingFile() ? 'Save Changes' : 'Create File' }}
                            </button>
                        </div>
                    </div>
                </div>
            }

            <!-- Delete Confirmation Dialog -->
            @if (deletingFile()) {
                <div class="fixed inset-0 z-50 flex items-center justify-center">
                    <div class="absolute inset-0 bg-black/50" (click)="cancelDelete()"></div>
                    <div class="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-md p-6">
                        <h2 class="text-lg font-semibold mb-2">Delete File</h2>
                        <p class="text-muted-foreground mb-4">
                            Are you sure you want to delete <strong>{{ deletingFile()?.title }}</strong>? 
                            This action cannot be undone.
                        </p>
                        <div class="flex justify-end gap-2">
                            <button hlmBtn variant="outline" (click)="cancelDelete()">Cancel</button>
                            <button 
                                hlmBtn 
                                variant="destructive" 
                                (click)="deleteFile()"
                                [disabled]="isDeleting()"
                            >
                                @if (isDeleting()) {
                                    Deleting...
                                } @else {
                                    Delete
                                }
                            </button>
                        </div>
                    </div>
                </div>
            }
        </div>
    `,
    styles: [`
        :host {
            display: block;
            height: 100vh;
        }
    `]
})
export class AdminComponent implements OnInit {
    private adminService = inject(AdminService);
    private router = inject(Router);

    // Icons
    readonly icons = { Plus, Pencil, Trash2, FolderOpen, FileCode, ArrowLeft, Save, X, RefreshCw };

    // State
    files = signal<MasterFile[]>([]);
    isLoading = signal(true);
    isRefreshing = signal(false);
    error = signal<string | null>(null);

    // Dialog state
    isDialogOpen = signal(false);
    editingFile = signal<MasterFile | null>(null);
    isSaving = signal(false);

    // Delete confirmation state
    deletingFile = signal<MasterFile | null>(null);
    isDeleting = signal(false);

    // Form data
    dialogForm = {
        id: '',
        title: '',
        description: '',
        group: '',
        srcPath: '',
        starterCode: ''
    };

    // Computed: Group files by their group property
    fileGroups = computed(() => {
        const groups = new Map<string, MasterFile[]>();

        for (const file of this.files()) {
            const groupName = file.group || 'General';
            if (!groups.has(groupName)) {
                groups.set(groupName, []);
            }
            groups.get(groupName)!.push(file);
        }

        // Convert to array and sort
        const result: FileGroup[] = Array.from(groups.entries())
            .map(([name, files]) => ({
                name,
                files: files.sort((a, b) => a.title.localeCompare(b.title)),
                expanded: true
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        return result;
    });

    ngOnInit() {
        this.loadFiles();
    }

    async loadFiles() {
        this.isLoading.set(true);
        this.error.set(null);

        try {
            const files = await this.adminService.getAllFiles();
            this.files.set(files);
        } catch (err: any) {
            console.error('[AdminComponent] Failed to load files:', err);
            this.error.set(err.message || 'Failed to load files');
        } finally {
            this.isLoading.set(false);
        }
    }

    async refreshFiles() {
        this.isRefreshing.set(true);
        try {
            const files = await this.adminService.getAllFiles();
            this.files.set(files);
        } catch (err: any) {
            console.error('[AdminComponent] Failed to refresh files:', err);
        } finally {
            this.isRefreshing.set(false);
        }
    }

    toggleGroup(group: FileGroup) {
        group.expanded = !group.expanded;
    }

    goBack() {
        this.router.navigate(['/']);
    }

    // Dialog methods
    openCreateDialog() {
        this.editingFile.set(null);
        this.dialogForm = {
            id: '',
            title: '',
            description: '',
            group: '',
            srcPath: '',
            starterCode: ''
        };
        this.isDialogOpen.set(true);
    }

    openEditDialog(file: MasterFile) {
        this.editingFile.set(file);
        this.dialogForm = {
            id: file.id,
            title: file.title,
            description: file.description || '',
            group: file.group || '',
            srcPath: file.srcPath || '',
            starterCode: file.starterCode || ''
        };
        this.isDialogOpen.set(true);
    }

    closeDialog() {
        this.isDialogOpen.set(false);
        this.editingFile.set(null);
    }

    isFormValid(): boolean {
        return this.dialogForm.id.trim().length > 0 &&
            this.dialogForm.title.trim().length > 0;
    }

    async saveFile() {
        if (!this.isFormValid()) return;

        this.isSaving.set(true);

        try {
            const fileData: MasterFile = {
                id: this.dialogForm.id.trim(),
                title: this.dialogForm.title.trim(),
                description: this.dialogForm.description.trim(),
                group: this.dialogForm.group.trim() || 'General',
                srcPath: this.dialogForm.srcPath.trim() || undefined,
                starterCode: this.dialogForm.starterCode
            };

            if (this.editingFile()) {
                await this.adminService.updateFile(fileData.id, fileData);
            } else {
                await this.adminService.createFile(fileData);
            }

            await this.refreshFiles();
            this.closeDialog();
        } catch (err: any) {
            console.error('[AdminComponent] Failed to save file:', err);
            alert('Failed to save: ' + (err.message || 'Unknown error'));
        } finally {
            this.isSaving.set(false);
        }
    }

    // Delete methods
    confirmDelete(file: MasterFile) {
        this.deletingFile.set(file);
    }

    cancelDelete() {
        this.deletingFile.set(null);
    }

    async deleteFile() {
        const file = this.deletingFile();
        if (!file) return;

        this.isDeleting.set(true);

        try {
            await this.adminService.deleteFile(file.id);
            await this.refreshFiles();
            this.deletingFile.set(null);
        } catch (err: any) {
            console.error('[AdminComponent] Failed to delete file:', err);
            alert('Failed to delete: ' + (err.message || 'Unknown error'));
        } finally {
            this.isDeleting.set(false);
        }
    }
}
