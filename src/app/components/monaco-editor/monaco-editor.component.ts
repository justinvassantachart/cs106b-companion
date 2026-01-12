import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, NgZone, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as monaco from 'monaco-editor';

@Component({
  selector: 'app-monaco-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="editor-container" #editorContainer></div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .editor-container {
      width: 100%;
      height: 100%;
    }
    /* Customize glyph margin for breakpoints */
    ::ng-deep .breakpoint-glyph {
      background: #ef4444; /* red-500 */
      width: 12px !important;
      height: 12px !important;
      border-radius: 50%;
      margin-left: 5px;
      cursor: pointer;
    }
    
    ::ng-deep .execution-line-highlight {
      background: rgba(234, 179, 8, 0.2); /* yellow-500/20 */
    }
  `]
})
export class MonacoEditorComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;

  @Input() code: string = '';
  @Output() codeChange = new EventEmitter<string>();
  @Output() breakpointToggle = new EventEmitter<number>();

  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private executionLineDecorations: monaco.editor.IEditorDecorationsCollection | null = null;
  private breakpointDecorationIds: string[] = [];
  
  private _breakpoints: Set<number> = new Set();
  @Input() set breakpoints(points: Set<number>) {
      this._breakpoints = points;
      this.updateBreakpointDecorations();
  }

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    // Configure global MonacoEnvironment if not already done
    if (!(window as any).MonacoEnvironment) {
      (window as any).MonacoEnvironment = {
        getWorkerUrl: (moduleId: string, label: string) => {
          if (label === 'json') {
            return './assets/monaco/vs/language/json/json.worker.js';
          }
          if (label === 'css' || label === 'scss' || label === 'less') {
            return './assets/monaco/vs/language/css/css.worker.js';
          }
          if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return './assets/monaco/vs/language/html/html.worker.js';
          }
          if (label === 'typescript' || label === 'javascript') {
            return './assets/monaco/vs/language/typescript/ts.worker.js';
          }
          return './assets/monaco/vs/editor/editor.worker.js';
        }
      };
    }
  }

  ngAfterViewInit() {
    this.initMonaco();
  }

  private initMonaco() {
    this.ngZone.runOutsideAngular(() => {
      this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
        value: this.code,
        language: 'cpp',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        glyphMargin: true,
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        scrollBeyondLastLine: false,
        padding: { top: 16, bottom: 16 }
      });

      this.editor.onDidChangeModelContent(() => {
        const val = this.editor?.getValue() || '';
        this.ngZone.run(() => {
            // Emitting value, but we prevent loop in ngOnChanges
            this.codeChange.emit(val);
        });
      });

      this.editor.onMouseDown((e) => {
        if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
          const lineNumber = e.target.position?.lineNumber;
          if (lineNumber) {
            this.ngZone.run(() => {
              this.breakpointToggle.emit(lineNumber);
            });
          }
        }
      });
      
      this.updateBreakpointDecorations();
    });
  }

  ngOnDestroy() {
    if (this.editor) {
      this.editor.dispose();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
      if (changes['code'] && !changes['code'].firstChange) {
          if (this.editor && this.editor.getValue() !== this.code) {
              this.editor.setValue(this.code);
          }
      }
  }

  setExecutionLine(lineNumber: number | null) {
     if (!this.editor) return;
     
     if (lineNumber === null) {
         this.executionLineDecorations?.clear();
         return;
     }

     const range = new monaco.Range(lineNumber, 1, lineNumber, 1);
     this.executionLineDecorations?.clear();
     this.executionLineDecorations = this.editor.createDecorationsCollection([
         {
             range,
             options: {
                 isWholeLine: true,
                 className: 'execution-line-highlight'
             }
         }
     ]);
     
     this.editor.revealLineInCenter(lineNumber);
  }
  
  updateBreakpointDecorations() {
      if (!this.editor) return;
      
      const newDecorations: monaco.editor.IModelDeltaDecoration[] = Array.from(this._breakpoints).map(ln => ({
          range: new monaco.Range(ln, 1, ln, 1),
          options: {
              isWholeLine: false,
              glyphMarginClassName: 'breakpoint-glyph'
          }
      }));
      
      this.breakpointDecorationIds = this.editor.deltaDecorations(this.breakpointDecorationIds, newDecorations);
  }
}
