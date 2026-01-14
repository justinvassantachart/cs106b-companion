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
    <div hlmSidebarWrapper class="h-full">
      <hlm-sidebar>
        <div hlmSidebarHeader class="p-4 border-b border-slate-800 flex items-center gap-2">
           <ng-icon hlm name="lucideTerminal" class="text-sky-500 text-xl"></ng-icon>
           <h1 class="font-bold text-lg text-slate-800 tracking-tight">Stanford IDE</h1>
        </div>
        
        <div hlmSidebarContent class="flex-1 overflow-y-auto">
          <div hlmSidebarGroup>
            <div hlmSidebarGroupLabel class="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Assignments</div>
            <div hlmSidebarGroupContent>
              <ul hlmSidebarMenu>
                <li *ngFor="let assignment of assignments" hlmSidebarMenuItem>
                  <button hlmSidebarMenuButton 
                    (click)="selectAssignment.emit(assignment)"
                    [class.bg-sky-50]="selectedAssignment === assignment"
                    [class.text-sky-700]="selectedAssignment === assignment"
                    class="w-full text-left">
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
        
        <div hlmSidebarFooter class="p-4 border-t border-slate-200">
             <div class="text-xs text-slate-400">CS106B Companion</div>
        </div>
      </hlm-sidebar>
      
      <!-- Main Content Inset -->
      <main hlmSidebarInset class="flex-1 flex flex-col min-h-0 bg-slate-50 overflow-hidden">
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
