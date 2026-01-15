import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBookOpen, lucideTerminal, lucideFileCode, lucideSettings, lucideLayoutDashboard } from '@ng-icons/lucide';
import { Assignment } from './assignments';

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
      lucideLayoutDashboard
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
            <div hlmSidebarGroupLabel class="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Assignments</div>
            <div hlmSidebarGroupContent>
              <ul hlmSidebarMenu>
                <li *ngFor="let assignment of assignments" hlmSidebarMenuItem>
                  <button hlmSidebarMenuButton 
                    (click)="selectAssignment.emit(assignment)"
                    [class.bg-accent]="selectedAssignment === assignment"
                    [class.text-accent-foreground]="selectedAssignment === assignment"
                    class="w-full text-left hover:bg-accent/50 hover:text-accent-foreground transition-colors rounded-md p-2">
                    <ng-icon hlm name="lucideFileCode" class="mr-2"></ng-icon>
                    <div class="flex flex-col items-start overflow-hidden">
                        <span class="truncate font-medium">{{ assignment.title }}</span>
                    </div>
                  </button>
                </li>
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
  @Input() assignments: Assignment[] = [];
  @Input() selectedAssignment: Assignment | null = null;
  @Output() selectAssignment = new EventEmitter<Assignment>();
}
