import { Component, NgZone, ChangeDetectorRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Play, Square, StepForward, StepBack, Bug, FileCode, Terminal, CheckCircle, XCircle, FastForward, Pause, Sun, Moon, Loader2, ArrowRight, CornerDownRight } from 'lucide-angular';

import { CompanionFile, FILES } from './companion-files';
import { instrumentCode, initTreeSitter, isTreeSitterReady } from './debugger-utils';
import { MonacoEditorComponent } from './components/monaco-editor/monaco-editor.component';
import { VariableVizComponent } from './components/variable-viz/variable-viz.component';
import { SashComponent } from './components/sash/sash.component';
import { AppSidebar } from './app-sidebar';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';

interface DebuggerState {
  line: number | null;
  variables: any[];
  stack: string[];
  consoleOutput: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    MonacoEditorComponent,
    VariableVizComponent,
    SashComponent,
    AppSidebar,
    HlmSidebarImports,
    HlmTooltipImports
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements AfterViewInit {
  @ViewChild(MonacoEditorComponent) editor!: MonacoEditorComponent;

  files = FILES;
  selectedFile: CompanionFile = FILES[0];
  studentCode: string = this.selectedFile.starterCode;

  // History State
  history: DebuggerState[] = [];
  historyIndex: number = -1; // -1 = Live, 0..N = History

  // Live State (Internal)
  private _liveOutputLogs = "";
  private _liveDebugVars: any[] = [];
  private _liveDebugStack: string[] = [];
  private _liveCurrentLine: number | null = null; // Track live line for history snapshots

  // Getters that switch based on mode
  get outputLogs(): string {
    if (this.historyIndex !== -1 && this.history[this.historyIndex]) {
      return this.history[this.historyIndex].consoleOutput;
    }
    return this._liveOutputLogs;
  }

  // Processed output for display - strips ANSI codes and adds error highlighting
  get processedOutputHtml(): string {
    const raw = this.outputLogs;
    // Strip ANSI escape codes
    const stripped = raw.replace(/\x1b\[[0-9;]*m/g, '').replace(/\[\d+(?:;\d+)*m/g, '');

    // Split into lines and wrap errors in spans
    const lines = stripped.split('\n');
    const processed = lines.map(line => {
      const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      // Check if this line contains an error
      if (/error:/i.test(line) || /Error:/i.test(line) || line.includes('[!ERROR]')) {
        return `<span class="text-destructive font-bold">${escaped}</span>`;
      }
      // Warning highlighting
      if (/warning:/i.test(line)) {
        return `<span class="text-yellow-500">${escaped}</span>`;
      }
      return escaped;
    });
    return processed.join('\n');
  }

  get debugVars() {
    if (this.historyIndex !== -1 && this.history[this.historyIndex]) {
      return this.history[this.historyIndex].variables;
    }
    return this._liveDebugVars;
  }

  get debugStack() {
    if (this.historyIndex !== -1 && this.history[this.historyIndex]) {
      return this.history[this.historyIndex].stack;
    }
    return this._liveDebugStack;
  }

  get currentLine() {
    if (this.historyIndex !== -1 && this.history[this.historyIndex]) {
      return this.history[this.historyIndex].line;
    }
    return this._liveCurrentLine;
  }
  isDebugging = false;
  isPaused = false;
  isCompiling = false;
  worker: Worker | null = null;
  testResults: { pass: boolean; expression: string; expected?: string; actual?: string }[] = [];
  activeTab: 'console' | 'tests' | 'variables' = 'console';

  // Theme State
  isDark = true;

  sharedBuffer: Int32Array | null = null;

  // Debugging state
  breakpoints: Set<number> = new Set();

  // Panel sizing
  bottomPanelHeight = 300; // pixels
  readonly MIN_BOTTOM_HEIGHT = 100;
  readonly MAX_BOTTOM_HEIGHT_RATIO = 0.8; // 80% of viewport

  callStackWidth = 256; // pixels (16rem default)
  readonly MIN_CALL_STACK_WIDTH = 150;
  readonly MAX_CALL_STACK_WIDTH = 400;

  // Icon imports for template
  readonly icons = {
    Play, Square, StepForward, StepBack, Bug, FileCode, Terminal, CheckCircle, XCircle, FastForward, Pause, Sun, Moon, Loader2, ArrowRight, CornerDownRight
  };

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {
    // Load theme from storage or default to Dark
    const savedTheme = localStorage.getItem('app-theme');
    this.isDark = savedTheme ? savedTheme === 'dark' : true;
    this.applyTheme();
  }

  ngAfterViewInit() {
    // Ensure editor resizes if needed
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    localStorage.setItem('app-theme', this.isDark ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme() {
    if (this.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // Track previous position during resize for calculating deltas
  private lastSashY = 0;
  private lastSashX = 0;

  onBottomSashStart() {
    this.lastSashY = 0;
  }

  onBottomSashChange(event: { startY: number; currentY: number }) {
    // Calculate delta from last known position
    const previousY = this.lastSashY || event.startY;
    const delta = event.currentY - previousY;
    this.lastSashY = event.currentY;

    // Dragging sash DOWN (positive delta) = DECREASE bottom panel height
    // Dragging sash UP (negative delta) = INCREASE bottom panel height
    const newHeight = this.bottomPanelHeight - delta;
    const maxHeight = window.innerHeight * this.MAX_BOTTOM_HEIGHT_RATIO;
    this.bottomPanelHeight = Math.max(this.MIN_BOTTOM_HEIGHT, Math.min(newHeight, maxHeight));
  }

  onCallStackSashStart() {
    this.lastSashX = 0;
  }

  onCallStackSashChange(event: { startX: number; currentX: number }) {
    // Calculate delta from last known position
    const previousX = this.lastSashX || event.startX;
    const delta = event.currentX - previousX;
    this.lastSashX = event.currentX;

    // Dragging sash RIGHT (positive delta) = INCREASE call stack width
    // Dragging sash LEFT (negative delta) = DECREASE call stack width
    const newWidth = this.callStackWidth + delta;
    this.callStackWidth = Math.max(this.MIN_CALL_STACK_WIDTH, Math.min(newWidth, this.MAX_CALL_STACK_WIDTH));
  }

  selectFile(file: CompanionFile) {
    this.selectedFile = file;
    this.studentCode = file.starterCode;
    this._liveOutputLogs = "";
    this.testResults = [];
    this.activeTab = 'console';
    this.stop(); // Stop any running debug session
    this.breakpoints.clear();
    this.breakpoints = new Set(this.breakpoints); // Force update
    if (this.editor) this.editor.setExecutionLine(null);
  }

  handleCodeChange(newCode: string) {
    this.studentCode = newCode;
  }

  toggleBreakpoint(line: number) {
    if (this.breakpoints.has(line)) {
      this.breakpoints.delete(line);
    } else {
      this.breakpoints.add(line);
    }
    this.breakpoints = new Set(this.breakpoints); // Trigger change detection/input update

    // Update worker if running
    if (this.worker) {
      this.worker.postMessage({
        command: 'update-breakpoints',
        breakpoints: Array.from(this.breakpoints)
      });
    }
  }

  async startDebugger() {
    this._liveOutputLogs = "[STARTING WORKER...]\n";
    this.isDebugging = true;
    this.isCompiling = true;
    this.isPaused = false;
    this.testResults = [];
    this.activeTab = 'console';
    if (this.editor) this.editor.setExecutionLine(null);

    // Initialize Tree-sitter if not already done
    if (!isTreeSitterReady()) {
      this._liveOutputLogs += "[Initializing C++ Debugger...]\n";
      try {
        await initTreeSitter();
        this._liveOutputLogs += "[Debugger ready.]\n";
      } catch (e: any) {
        this._liveOutputLogs += `[ERROR] Failed to initialize debugger: ${e.message}\n`;
        this.isDebugging = false;
        this.isCompiling = false;
        return;
      }
    }

    if (this.worker) this.worker.terminate();

    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./app.worker', import.meta.url));

      // Setup SharedArrayBuffer
      if (typeof SharedArrayBuffer === 'undefined') {
        this._liveOutputLogs += "[ERROR] SharedArrayBuffer is not defined. This browser environment might be missing COOP/COEP headers required for high-performance threading.\n";
        // Fallback or just error out cleanly
        this.isDebugging = false;
        this.isCompiling = false;
        return;
      }
      this.sharedBuffer = new Int32Array(new SharedArrayBuffer(4));
      this.sharedBuffer[0] = 0; // 0 = PAUSED, 1 = STEP, 2 = RUN
      this.worker.postMessage({ command: 'configure-debug', buffer: this.sharedBuffer.buffer });

      // Send breakpoints
      // IMPORTANT: The worker might process this before or after compile? 
      // It's safer to send it immediately.
      this.worker.postMessage({
        command: 'update-breakpoints',
        breakpoints: Array.from(this.breakpoints)
      });

      this.worker.onmessage = ({ data }) => {
        if (data.type === 'log') {
          this.ngZone.run(() => {
            this.processWorkerOutput(data.text);
            this.cdr.detectChanges();
          });
        } else if (data.type === 'compiled') {
          this.ngZone.run(() => {
            this.isCompiling = false;
            this.activeTab = 'variables';
            this.cdr.detectChanges();
          });
        } else if (data.type === 'finished') {
          this.ngZone.run(() => {
            this._liveOutputLogs += "\n[FINISHED]";
            this.isDebugging = false;
            this.isCompiling = false;
            this.isPaused = false;
            this._liveDebugVars = []; // Clear vars
            if (this.editor) this.editor.setExecutionLine(null);
            this._liveCurrentLine = null;
          });
        } else if (data.type === 'debug-paused') {
          this.ngZone.run(() => {
            this.isCompiling = false; // Failsafe: if we paused, we must be done compiling
            this.isPaused = true;
            this.activeTab = 'variables'; // Failsafe: ensure we are on the right tab

            this._liveCurrentLine = data.line;
            if (this.editor) this.editor.setExecutionLine(data.line);

            // Snapshot for History
            // We take the snapshot AFTER vars are updated? 
            // Wait, vars are updated via separate log messages [DEBUG:VARS:END].
            // Usually [DEBUG:VARS:END] comes BEFORE debug-paused?
            // Actually in app.worker, we do atomic store 0 (PAUSED) then postMessage 'debug-paused'.
            // In shim, DEBUG_STEP calls _debug_dump_vars() THEN _debug_wait().
            // So Vars should have arrived by now.

            const snapshot: DebuggerState = {
              line: data.line,
              variables: JSON.parse(JSON.stringify(this._liveDebugVars)), // Deep copy basic objects
              stack: [...this._liveDebugStack],
              consoleOutput: this._liveOutputLogs
            };
            this.history.push(snapshot);
            this.historyIndex = -1; // Snap to live

            this.cdr.detectChanges();
          });
        }
      };

      // Instrument code
      const codeToRun = instrumentCode(this.studentCode);
      this.worker.postMessage({ command: 'compile', code: codeToRun });

    } else {
      this._liveOutputLogs += "[ERROR] Web Workers not supported in this environment.";
      this.isDebugging = false;
      this.isCompiling = false;
    }
  }



  step() {
    if (!this.sharedBuffer) return;

    // Jump to live if in history
    if (this.historyIndex !== -1) {
      this.historyIndex = -1;
      this.updateEditorState();
    }

    this.isPaused = false;
    if (this.editor) this.editor.setExecutionLine(null); // Clear highlight briefly
    Atomics.store(this.sharedBuffer, 0, 1); // 1 = STEP
    Atomics.notify(this.sharedBuffer, 0);
  }

  runAll() {
    if (!this.sharedBuffer) return;

    // Jump to live
    if (this.historyIndex !== -1) {
      this.historyIndex = -1;
      this.updateEditorState();
    }

    this.isPaused = false;
    if (this.editor) this.editor.setExecutionLine(null);
    Atomics.store(this.sharedBuffer, 0, 2); // 2 = RUN
    Atomics.notify(this.sharedBuffer, 0);
  }

  pause() {
    if (!this.sharedBuffer) return;
    Atomics.store(this.sharedBuffer, 0, 0); // 0 = PAUSED
  }

  stop() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this._liveOutputLogs += "\n[STOPPED]";
    }
    this.isDebugging = false;
    this.isCompiling = false;
    this.isPaused = false;
    this._liveDebugVars = [];
    this._liveCurrentLine = null;
    this.history = [];
    this.historyIndex = -1;
    if (this.editor) this.editor.setExecutionLine(null);
  }

  // History Controls
  stepBack() {
    if (this.history.length === 0) return;
    if (this.historyIndex === -1) {
      // Started at live, go to last history item
      this.historyIndex = this.history.length - 1;
      // Note: The last history item IS the current paused state usually.
      // If we want "previous", we might want history.length - 2?
      // BUT: We push snapshot ON pause. So the last snapshot IS the current state.
      // The user probably wants to see the state BEFORE the current one.
      if (this.historyIndex > 0) {
        this.historyIndex--;
      }
    } else {
      if (this.historyIndex > 0) {
        this.historyIndex--;
      }
    }
    this.updateEditorState();
  }

  stepForward() {
    // If at live position (historyIndex === -1), execute next step
    if (this.historyIndex === -1) {
      // If paused at live, execute next line
      if (this.isPaused && this.sharedBuffer) {
        this.isPaused = false;
        if (this.editor) this.editor.setExecutionLine(null);
        Atomics.store(this.sharedBuffer, 0, 1); // 1 = STEP
        Atomics.notify(this.sharedBuffer, 0);
      }
      return;
    }

    // Navigate forward in history
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
    } else {
      // At end of history, return to live
      this.historyIndex = -1;
    }
    this.updateEditorState();
  }

  get isHistoryMode() {
    return this.historyIndex !== -1;
  }

  private updateEditorState() {
    if (this.editor) {
      this.editor.setExecutionLine(this.currentLine);
    }
  }

  // Debug Data Parsing
  // Updated model for variables
  // (We use _liveDebugVars for storage now)



  private logBuffer = "";
  private isCapturingVars = false;
  private isCapturingStack = false;
  private capturedVarsLines: string[] = [];
  private capturedStackLines: string[] = [];

  private processWorkerOutput(chunk: string) {
    this.logBuffer += chunk;

    let newlineIdx: number;
    while ((newlineIdx = this.logBuffer.indexOf('\n')) !== -1) {
      const line = this.logBuffer.slice(0, newlineIdx + 1); // keep newline for raw output if needed
      this.logBuffer = this.logBuffer.slice(newlineIdx + 1);

      const trimmed = line.trim();

      if (trimmed === '[DEBUG:VARS:START]') {
        console.log('--- [DEBUG:VARS:START] received ---');
        this.isCapturingVars = true;
        this.capturedVarsLines = [];
        continue;
      }
      if (trimmed === '[DEBUG:VARS:END]') {
        console.log('--- [DEBUG:VARS:END] received ---');
        this.isCapturingVars = false;
        this.updateDebugVars();
        continue;
      }
      if (trimmed === '[DEBUG:STACK:START]') {
        this.isCapturingStack = true;
        this.capturedStackLines = [];
        continue;
      }
      if (trimmed === '[DEBUG:STACK:END]') {
        this.isCapturingStack = false;
        this._liveDebugStack = [...this.capturedStackLines];
        continue;
      }

      if (this.isCapturingVars) {
        if (trimmed) {
          console.log('DEBUG_VAR_LINE_RAW:', trimmed);
          this.capturedVarsLines.push(trimmed);
        }
      } else if (this.isCapturingStack) {
        if (trimmed) this.capturedStackLines.push(trimmed);
      } else {
        // Normal log output
        this._liveOutputLogs += line;
        this.parseTestResult(line);
      }
    }
  }

  private updateDebugVars() {
    console.log(`Updating Debug Vars. Lines captured: ${this.capturedVarsLines.length}`);
    this._liveDebugVars = this.capturedVarsLines.map(line => {
      // Format: name|type|addr|value|targetAddr|frame|derefValue
      const parts = line.split('|');
      console.log('PARSED_VAR_DEBUG:', parts);
      if (parts.length < 4) {
        // Fallback for old format or errors
        return { name: parts[0] || '?', type: 'unknown', addr: '0', value: parts[1] || '??' };
      }

      const v = {
        name: parts[0],
        type: parts[1],
        addr: parts[2],
        value: parts[3],
        targetAddr: parts[4] !== '0' ? parts[4] : undefined,
        frame: parts[5] || 'global',
        derefValue: parts[6] || undefined // The content of the pointed-to object
      };
      if (v.derefValue) console.log(`Got derefValue for ${v.name}:`, v.derefValue);
      return v;
    });
  }

  private parseTestResult(line: string) {
    if (line.includes('[TEST:PASS]')) {
      const expression = line.split('[TEST:PASS]')[1].trim();
      this.testResults.push({ pass: true, expression });
    } else if (line.includes('[TEST:FAIL]')) {
      // [TEST:FAIL] expr == expr Expected: x Actual: y
      const parts = line.split('[TEST:FAIL]')[1].split('Expected:');
      const expression = parts[0].trim();
      const rest = parts[1] ? parts[1].split('Actual:') : [];
      const expected = rest[0]?.trim();
      const actual = rest[1]?.trim();
      this.testResults.push({ pass: false, expression, expected, actual });
    }
  }
}
