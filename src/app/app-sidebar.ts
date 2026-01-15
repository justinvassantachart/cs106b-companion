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
  lucideChevronRight
} from '@ng-icons/lucide';
import { CompanionFile } from './companion-files';

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
      lucideChevronRight
    })
  ],
  template: `
    <div hlmSidebarWrapper class="h-full bg-background">
      <hlm-sidebar class="border-r border-border bg-card">
        <div hlmSidebarHeader class="p-4 border-b border-border flex items-center gap-3 bg-muted/20">
           <div class="p-1.5 bg-primary/10 rounded-md">
             <ng-icon hlm name="lucideTerminal" class="text-primary text-xl"></ng-icon>
           </div>
           <h1 class="font-bold text-lg text-foreground tracking-tight">Stanford IDE</h1>
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
        
        <div hlmSidebarFooter class="p-4 border-t border-border">
             <div class="text-xs text-muted-foreground">CS106B Companion</div>
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
  @Output() selectFile = new EventEmitter<CompanionFile>();

  expandedGroups: Set<string> = new Set(['Getting Started', 'Data Structures']);

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
