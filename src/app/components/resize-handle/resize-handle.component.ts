import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resize-handle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="resize-handle"
      [class.horizontal]="direction === 'horizontal'"
      [class.vertical]="direction === 'vertical'"
      [class.dragging]="isDragging"
      (mousedown)="onMouseDown($event)"
    ></div>
  `,
  styles: [`
    :host {
      display: block;
      flex-shrink: 0;
    }

    .resize-handle {
      position: relative;
      z-index: 100;
      flex-shrink: 0;
      background: transparent;
      transition: background-color 0.15s ease;
    }

    .resize-handle::after {
      content: '';
      position: absolute;
      background: var(--border);
      transition: background-color 0.15s ease, transform 0.15s ease;
    }

    /* Horizontal handle (resizes height) */
    .resize-handle.horizontal {
      width: 100%;
      height: 8px;
      cursor: row-resize;
    }

    .resize-handle.horizontal::after {
      left: 0;
      right: 0;
      top: 50%;
      height: 2px;
      transform: translateY(-50%);
    }

    .resize-handle.horizontal:hover,
    .resize-handle.horizontal.dragging {
      background: var(--muted);
    }

    .resize-handle.horizontal:hover::after,
    .resize-handle.horizontal.dragging::after {
      height: 4px;
      background: var(--primary);
    }

    /* Vertical handle (resizes width) */
    .resize-handle.vertical {
      width: 8px;
      height: 100%;
      cursor: col-resize;
    }

    .resize-handle.vertical::after {
      top: 0;
      bottom: 0;
      left: 50%;
      width: 2px;
      transform: translateX(-50%);
    }

    .resize-handle.vertical:hover,
    .resize-handle.vertical.dragging {
      background: var(--muted);
    }

    .resize-handle.vertical:hover::after,
    .resize-handle.vertical.dragging::after {
      width: 4px;
      background: var(--primary);
    }

    /* Expanded hit area */
    .resize-handle::before {
      content: '';
      position: absolute;
    }

    .resize-handle.horizontal::before {
      left: 0;
      right: 0;
      top: -4px;
      bottom: -4px;
    }

    .resize-handle.vertical::before {
      top: 0;
      bottom: 0;
      left: -4px;
      right: -4px;
    }
  `]
})
export class ResizeHandleComponent {
  @Input() direction: 'horizontal' | 'vertical' = 'horizontal';
  @Output() resizeStart = new EventEmitter<void>();
  @Output() resize = new EventEmitter<number>();
  @Output() resizeEnd = new EventEmitter<void>();

  isDragging = false;
  private startPos = 0;

  constructor(private el: ElementRef) { }

  onMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.isDragging = true;
    this.startPos = this.direction === 'horizontal' ? event.clientY : event.clientX;
    this.resizeStart.emit();

    // Add global listeners
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    document.body.style.cursor = this.direction === 'horizontal' ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none';
  }

  private onMouseMove = (event: MouseEvent) => {
    if (!this.isDragging) return;

    const currentPos = this.direction === 'horizontal' ? event.clientY : event.clientX;
    const delta = currentPos - this.startPos;
    this.startPos = currentPos;
    this.resize.emit(delta);
  };

  private onMouseUp = () => {
    this.isDragging = false;
    this.resizeEnd.emit();

    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };
}
