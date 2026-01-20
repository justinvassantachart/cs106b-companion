import { Component, Input, Output, EventEmitter, ElementRef, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * VS Code-inspired Sash component for resizable panels.
 * 
 * A sash is a thin invisible bar that becomes visible on hover,
 * allowing users to resize adjacent panels by dragging.
 * 
 * Follows VS Code's implementation patterns:
 * - Uses :before pseudo-element for hover indicator
 * - Absolute positioning within flex container
 * - CSS variables for theming
 * - Touch event support
 */
@Component({
    selector: 'app-sash',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div 
      class="sash"
      [class.vertical]="orientation === 'vertical'"
      [class.horizontal]="orientation === 'horizontal'"
      [class.hover]="isHovering"
      [class.active]="isDragging"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
      (mousedown)="onMouseDown($event)"
      (touchstart)="onTouchStart($event)"
    ></div>
  `,
    styles: [`
    :host {
      display: block;
      position: relative;
      flex-shrink: 0;
      z-index: 35;
    }

    /* Vertical sash - for resizing widths (left/right panels) */
    :host-context(.sash-container-vertical) {
      width: var(--sash-size, 4px);
      height: 100%;
    }

    /* Horizontal sash - for resizing heights (top/bottom panels) */
    :host-context(.sash-container-horizontal) {
      width: 100%;
      height: var(--sash-size, 4px);
    }

    .sash {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      touch-action: none;
    }

    .sash.vertical {
      cursor: ew-resize;
    }

    .sash.horizontal {
      cursor: ns-resize;
    }

    /* Hover indicator using :before pseudo-element (VS Code pattern) */
    .sash:before {
      content: '';
      pointer-events: none;
      position: absolute;
      width: 100%;
      height: 100%;
      background: transparent;
      transition: background-color 0.1s ease-out;
    }

    .sash.hover:before,
    .sash.active:before {
      background: var(--primary);
    }

    .sash.vertical:before {
      width: var(--sash-hover-size, 4px);
      left: 50%;
      transform: translateX(-50%);
      top: 0;
      bottom: 0;
      height: 100%;
    }

    .sash.horizontal:before {
      height: var(--sash-hover-size, 4px);
      top: 50%;
      transform: translateY(-50%);
      left: 0;
      right: 0;
      width: 100%;
    }
  `]
})
export class SashComponent implements OnDestroy {
    @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';

    @Output() sashStart = new EventEmitter<void>();
    @Output() sashChange = new EventEmitter<{ startX: number; currentX: number; startY: number; currentY: number }>();
    @Output() sashEnd = new EventEmitter<void>();
    @Output() sashReset = new EventEmitter<void>(); // Double-click to reset

    isHovering = false;
    isDragging = false;

    private startX = 0;
    private startY = 0;
    private lastClickTime = 0;

    // Bound event handlers for proper cleanup
    private readonly boundMouseMove = this.onMouseMove.bind(this);
    private readonly boundMouseUp = this.onMouseUp.bind(this);
    private readonly boundTouchMove = this.onTouchMove.bind(this);
    private readonly boundTouchEnd = this.onTouchEnd.bind(this);

    constructor(
        private el: ElementRef,
        private ngZone: NgZone,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnDestroy() {
        this.cleanup();
    }

    onMouseEnter() {
        this.isHovering = true;
    }

    onMouseLeave() {
        if (!this.isDragging) {
            this.isHovering = false;
        }
    }

    onMouseDown(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        // Double-click detection for reset
        const now = Date.now();
        if (now - this.lastClickTime < 300) {
            this.sashReset.emit();
            this.lastClickTime = 0;
            return;
        }
        this.lastClickTime = now;

        this.startDrag(event.pageX, event.pageY);

        // Run outside Angular zone for performance
        this.ngZone.runOutsideAngular(() => {
            document.addEventListener('mousemove', this.boundMouseMove);
            document.addEventListener('mouseup', this.boundMouseUp);
        });

        // Prevent text selection during drag
        document.body.style.userSelect = 'none';
        document.body.style.cursor = this.orientation === 'horizontal' ? 'ns-resize' : 'ew-resize';
    }

    onTouchStart(event: TouchEvent) {
        if (event.touches.length !== 1) return;

        event.preventDefault();
        const touch = event.touches[0];
        this.startDrag(touch.pageX, touch.pageY);

        this.ngZone.runOutsideAngular(() => {
            document.addEventListener('touchmove', this.boundTouchMove, { passive: false });
            document.addEventListener('touchend', this.boundTouchEnd);
            document.addEventListener('touchcancel', this.boundTouchEnd);
        });
    }

    private startDrag(x: number, y: number) {
        this.isDragging = true;
        this.startX = x;
        this.startY = y;
        this.sashStart.emit();
        this.cdr.detectChanges();
    }

    private onMouseMove(event: MouseEvent) {
        if (!this.isDragging) return;

        this.ngZone.run(() => {
            this.sashChange.emit({
                startX: this.startX,
                currentX: event.pageX,
                startY: this.startY,
                currentY: event.pageY
            });
        });
    }

    private onMouseUp() {
        this.endDrag();
        document.removeEventListener('mousemove', this.boundMouseMove);
        document.removeEventListener('mouseup', this.boundMouseUp);
    }

    private onTouchMove(event: TouchEvent) {
        if (!this.isDragging || event.touches.length !== 1) return;
        event.preventDefault();

        const touch = event.touches[0];
        this.ngZone.run(() => {
            this.sashChange.emit({
                startX: this.startX,
                currentX: touch.pageX,
                startY: this.startY,
                currentY: touch.pageY
            });
        });
    }

    private onTouchEnd() {
        this.endDrag();
        document.removeEventListener('touchmove', this.boundTouchMove);
        document.removeEventListener('touchend', this.boundTouchEnd);
        document.removeEventListener('touchcancel', this.boundTouchEnd);
    }

    private endDrag() {
        this.ngZone.run(() => {
            this.isDragging = false;
            this.isHovering = false;
            this.sashEnd.emit();
            this.cdr.detectChanges();
        });

        document.body.style.userSelect = '';
        document.body.style.cursor = '';
    }

    private cleanup() {
        document.removeEventListener('mousemove', this.boundMouseMove);
        document.removeEventListener('mouseup', this.boundMouseUp);
        document.removeEventListener('touchmove', this.boundTouchMove);
        document.removeEventListener('touchend', this.boundTouchEnd);
        document.removeEventListener('touchcancel', this.boundTouchEnd);
    }
}
