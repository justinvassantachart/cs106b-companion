import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBookOpen,
  lucideTerminal,
  lucideFileCode,
  lucideSettings,
  lucideLayoutDashboard,
  lucideFolder,
  lucideChevronDown,
  lucideChevronRight,
  lucideLogIn,
  lucideLogOut,
  lucideUser,
  lucideRefreshCw
} from '@ng-icons/lucide';
import { CompanionFile } from './companion-files';
import { User } from 'firebase/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    HlmSidebarImports,
    HlmIcon,
    NgIcon
  ],
  providers: [
    provideIcons({
      lucideBookOpen,
      lucideTerminal,
      lucideFileCode,
      lucideSettings,
      lucideLayoutDashboard,
      lucideFolder,
      lucideChevronDown,
      lucideChevronRight,
      lucideLogIn,
      lucideLogOut,
      lucideUser,
      lucideRefreshCw
    })
  ],
  template: `
    <div hlmSidebarWrapper class="h-full bg-background">
      <hlm-sidebar class="border-r border-border bg-card">
        <div hlmSidebarHeader class="p-4 border-b border-border flex items-center gap-3 bg-muted/20">
           <div class="p-1.5 bg-primary/10 rounded-md">
             <ng-icon hlm name="lucideTerminal" class="text-primary text-xl"></ng-icon>
           </div>
           <h1 class="font-bold text-lg text-foreground tracking-tight">Justin's IDE Beta</h1>
        </div>
        
        <div hlmSidebarContent class="flex-1 overflow-y-auto">
          <div hlmSidebarGroup>
            <div hlmSidebarGroupLabel class="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Files</div>
            <div hlmSidebarGroupContent>
              <ul hlmSidebarMenu>
                <ng-container *ngFor="let group of groupedFiles">
                  <!-- Group Header -->
                  <li hlmSidebarMenuItem>
                    <button hlmSidebarMenuButton 
                      (click)="toggleGroup(group.name)"
                      class="w-full text-left hover:bg-accent/50 hover:text-accent-foreground transition-colors rounded-md p-2 flex items-center gap-2">
                      <ng-icon hlm [name]="isExpanded(group.name) ? 'lucideChevronDown' : 'lucideChevronRight'" class="w-4 h-4 text-muted-foreground"></ng-icon>
                      <ng-icon hlm name="lucideFolder" class="text-primary"></ng-icon>
                      <span class="font-semibold text-sm">{{ group.name }}</span>
                    </button>
                  </li>
                  
                  <!-- Group Items -->
                  <ng-container *ngIf="isExpanded(group.name)">
                    <li *ngFor="let file of group.items" hlmSidebarMenuItem class="pl-4">
                      <button hlmSidebarMenuButton 
                        (click)="selectFile.emit(file)"
                        [class.bg-accent]="selectedFile === file"
                        [class.text-accent-foreground]="selectedFile === file"
                        class="w-full text-left hover:bg-accent/50 hover:text-accent-foreground transition-colors rounded-md p-2 flex items-center gap-2">
                        <ng-icon hlm name="lucideFileCode" class="ml-1 opacity-70"></ng-icon>
                        <span class="truncate font-medium text-sm">{{ file.title }}</span>
                      </button>
                    </li>
                  </ng-container>
                </ng-container>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- Auth Footer -->
        <div hlmSidebarFooter class="p-3 border-t border-border">
          <!-- Signed Out State -->
          <button *ngIf="!currentUser" 
            (click)="login.emit()"
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow active:scale-[0.98]">
            <ng-icon hlm name="lucideLogIn" class="text-base"></ng-icon>
            <span>Sign in with Google</span>
          </button>
          
          <!-- Signed In State -->
          <div *ngIf="currentUser" class="space-y-3">
            <!-- User Profile -->
            <div class="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
              <div class="relative">
                <img *ngIf="currentUser.photoURL" 
                  [src]="currentUser.photoURL" 
                  crossorigin="anonymous"
                  class="w-9 h-9 rounded-full border-2 border-border shadow-sm">
                <div *ngIf="!currentUser.photoURL" 
                  class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
                  <ng-icon hlm name="lucideUser" class="text-primary text-lg"></ng-icon>
                </div>
                <!-- Syncing Indicator -->
                <div *ngIf="isSyncing" 
                  class="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-sm border border-background">
                  <ng-icon hlm name="lucideRefreshCw" class="text-[10px] text-primary-foreground animate-spin"></ng-icon>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                  {{ currentUser.displayName || 'User' }}
                  <span *ngIf="isSyncing" class="text-[10px] text-muted-foreground font-normal">Syncing...</span>
                </div>
                <div class="text-xs text-muted-foreground truncate">
                  {{ currentUser.email }}
                </div>
              </div>
            </div>
            
            <!-- Sign Out Button -->
            <button (click)="logout.emit()"
              class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-medium transition-all border border-border hover:border-border/80 active:scale-[0.98]">
              <ng-icon hlm name="lucideLogOut" class="text-base text-muted-foreground"></ng-icon>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </hlm-sidebar>
      
      <!-- Main Content Inset -->
      <main hlmSidebarInset class="flex-1 flex flex-col min-h-0 bg-background overflow-hidden relative shadow-[0_0_15px_rgba(0,0,0,0.05)]">
         <!-- Content Projected Here -->
         <ng-content></ng-content>
      </main>
    </div>
  `
})
export class AppSidebar {
  @Input() files: CompanionFile[] = [];
  @Input() selectedFile: CompanionFile | null = null;
  @Input() currentUser: User | null = null;
  @Input() isSyncing: boolean = false;
  @Output() selectFile = new EventEmitter<CompanionFile>();
  @Output() login = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  expandedGroups: Set<string> = new Set(['Section 1', 'Section 2']);

  get groupedFiles() {
    const groups: { name: string, items: CompanionFile[] }[] = [];
    const ungrouped: CompanionFile[] = [];

    this.files.forEach(f => {
      if (f.group) {
        let group = groups.find(g => g.name === f.group);
        if (!group) {
          group = { name: f.group, items: [] };
          groups.push(group);
        }
        group.items.push(f);
      } else {
        ungrouped.push(f);
      }
    });

    if (ungrouped.length > 0) {
      groups.push({ name: 'Others', items: ungrouped });
    }

    // Sort groups: Section 1 first, Section 2 second, Getting Started last
    const groupOrder = ['Section 1', 'Section 2', 'Getting Started'];
    groups.sort((a, b) => {
      const indexA = groupOrder.indexOf(a.name);
      const indexB = groupOrder.indexOf(b.name);
      // If both are in the order list, sort by their position
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      // If only a is in the list, it comes first
      if (indexA !== -1) return -1;
      // If only b is in the list, it comes first
      if (indexB !== -1) return 1;
      // Otherwise, maintain original order
      return 0;
    });

    return groups;
  }

  toggleGroup(name: string) {
    if (this.expandedGroups.has(name)) {
      this.expandedGroups.delete(name);
    } else {
      this.expandedGroups.add(name);
    }
  }

  isExpanded(name: string): boolean {
    return this.expandedGroups.has(name);
  }
}
