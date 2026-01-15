import { Component, Input, SimpleChanges, OnChanges, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DebugVar {
  name: string;
  type: string;
  addr: string;
  value: string;
  targetAddr?: string;
  frame?: string;
  derefValue?: string;
}

interface HeapObject {
  addr: string;
  value: string;
  type: string;
}

interface FrameGroup {
  name: string;
  vars: DebugVar[];
}

@Component({
  selector: 'app-variable-viz',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full h-full bg-background flex overflow-hidden font-sans text-sm selection:bg-none">
      
      <!-- SVG Layer for Arrows -->
      <svg class="absolute inset-0 w-full h-full pointer-events-none z-10">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" 
          refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" class="fill-muted-foreground" />
          </marker>
        </defs>
        <path *ngFor="let arrow of arrows" 
          [attr.d]="arrow.path" 
          fill="none" 
          class="stroke-muted-foreground transition-all duration-300"
          stroke-width="2" 
          marker-end="url(#arrowhead)" />
      </svg>

      <!-- Frames / Stack Column -->
      <div class="w-1/3 min-w-[200px] flex flex-col border-r border-border bg-card z-0 overflow-y-auto p-4 gap-4">
        <h3 class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Frames (Stack)</h3>
        
        <div *ngFor="let group of frameGroups" class="bg-muted/10 rounded-lg p-3 shadow-sm border border-border">
           <div class="text-xs font-semibold text-foreground mb-3 border-b border-border pb-1 flex justify-between">
             <span>{{group.name}}</span>
             <span *ngIf="group.name === currentFrameName" class="text-[10px] bg-primary/10 text-primary px-1.5 rounded-full">Active</span>
           </div>
           
           <div class="flex flex-col gap-3">
             <div *ngFor="let v of group.vars" class="variable-row flex items-center justify-between group" [attr.data-id]="v.name">
                <div class="font-mono text-xs font-bold text-foreground w-1/3 truncate" [title]="v.name">{{v.name}}</div>
                
                <!-- Value Box -->
                <div class="relative flex-1" [attr.id]="'var-' + v.name">
                   <!-- Non-Pointer Value -->
                   <div *ngIf="!v.targetAddr" class="bg-background border border-input px-2 py-1 rounded text-xs font-mono text-foreground shadow-sm truncate">
                     {{v.value}}
                   </div>

                   <!-- Pointer Dot (Source of Arrow) -->
                   <div *ngIf="v.targetAddr" class="flex justify-end pr-2">
                      <div class="w-3 h-3 bg-foreground rounded-full border-2 border-background shadow-sm cursor-pointer hover:scale-125 transition-transform"
                           [attr.id]="'ptr-source-' + v.name"></div>
                   </div>
                </div>
             </div>
           </div>
        </div>
      </div>

      <!-- Heap / Objects Column -->
      <div class="flex-1 bg-background overflow-y-auto p-4 z-0">
        <h3 class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Objects (Heap)</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
           <div *ngFor="let obj of heapObjects" 
                class="bg-card rounded-lg shadow-sm border border-border p-3 relative transform transition-all hover:scale-[1.02] hover:border-primary/50 hover:shadow-md"
                [attr.id]="'heap-' + obj.addr">
              
              <!-- Address Label -->
              <div class="absolute -top-2 -left-2 bg-muted text-[9px] px-1 rounded text-muted-foreground font-mono shadow-sm border border-border">
                 {{obj.addr}}
              </div>
              
              <div class="font-mono text-xs text-card-foreground break-words mt-2 whitespace-pre-wrap">
                 {{obj.value}}
              </div>
           </div>
        </div>
        
        <div *ngIf="heapObjects.length === 0" class="flex h-full items-center justify-center text-muted-foreground italic text-xs">
           No heap objects
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class VariableVizComponent implements OnChanges, AfterViewChecked {
  @Input() variables: DebugVar[] = [];

  stackVars: DebugVar[] = [];
  frameGroups: FrameGroup[] = [];
  currentFrameName = "";

  heapObjects: HeapObject[] = [];
  arrows: { path: string }[] = [];

  private resizeObserver: ResizeObserver | undefined;

  constructor(private elementRef: ElementRef) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['variables']) {
      this.processVariables();
    }
  }

  ngAfterViewChecked() {
    this.drawArrows();
    // Retry to ensure DOM is settled
    setTimeout(() => this.drawArrows(), 50);
  }

  ngOnInit() {
    this.resizeObserver = new ResizeObserver(() => {
      this.drawArrows();
    });
    this.resizeObserver.observe(this.elementRef.nativeElement);
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.drawArrows();
  }

  processVariables() {
    // 1. Group Stack Vars by Frame
    const groups = new Map<string, DebugVar[]>();

    if (this.variables.length > 0) {
      this.currentFrameName = this.variables[0].frame || 'global';
    }

    this.variables.forEach(v => {
      const frame = v.frame || 'global';
      if (!groups.has(frame)) {
        groups.set(frame, []);
      }
      groups.get(frame)?.push(v);
    });

    this.frameGroups = Array.from(groups.entries()).map(([name, vars]) => ({ name, vars }));

    // 2. Identify Heap Objects
    const heapMap = new Map<string, HeapObject>();

    this.variables.forEach(v => {
      if (v.targetAddr) {
        if (!heapMap.has(v.targetAddr)) {
          heapMap.set(v.targetAddr, {
            addr: v.targetAddr,
            value: v.derefValue || v.value, // Visualize content if available
            type: 'unknown'
          });
        }
      }
    });

    this.heapObjects = Array.from(heapMap.values());
    this.stackVars = this.variables;
  }

  drawArrows() {
    this.arrows = [];
    const svgRect = this.elementRef.nativeElement.getBoundingClientRect();

    this.stackVars.forEach(v => {
      if (v.targetAddr) {
        const sourceId = 'ptr-source-' + v.name;
        const targetId = 'heap-' + v.targetAddr;

        const sourceEl = this.elementRef.nativeElement.querySelector('#' + sourceId);
        const targetEl = this.elementRef.nativeElement.querySelector('#' + targetId);

        if (sourceEl && targetEl) {
          const sRect = sourceEl.getBoundingClientRect();
          const tRect = targetEl.getBoundingClientRect();

          // Calculate relative coordinates
          const x1 = sRect.left + sRect.width / 2 - svgRect.left;
          const y1 = sRect.top + sRect.height / 2 - svgRect.top;

          // Target: aim for left center of heap object
          const x2 = tRect.left - svgRect.left;
          const y2 = tRect.top + tRect.height / 2 - svgRect.top;

          // Bezier curve
          const cx1 = x1 + (x2 - x1) / 2;
          const cy1 = y1;
          const cx2 = x2 - (x2 - x1) / 2;
          const cy2 = y2;

          const path = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
          this.arrows.push({ path });
        }
      }
    });
  }
}
