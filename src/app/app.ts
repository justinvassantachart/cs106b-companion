import { Component, NgZone, ChangeDetectorRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Play, Square, StepForward, Bug, FileCode, Terminal, CheckCircle, XCircle, FastForward, Pause, Sun, Moon, Loader2 } from 'lucide-angular';

import { CompanionFile, FILES } from './companion-files';
import { instrumentCode } from './debugger-utils';
import { MonacoEditorComponent } from './components/monaco-editor/monaco-editor.component';
import { VariableVizComponent } from './components/variable-viz/variable-viz.component';
import { AppSidebar } from './app-sidebar';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    MonacoEditorComponent,
    VariableVizComponent,
    AppSidebar,
    HlmSidebarImports
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements AfterViewInit {
  @ViewChild(MonacoEditorComponent) editor!: MonacoEditorComponent;

  files = FILES;
  selectedFile: CompanionFile = FILES[0];
  studentCode: string = this.selectedFile.starterCode;

  outputLogs = "";
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
  currentLine: number | null = null;

  // Icon imports for template
  readonly icons = {
    Play, Square, StepForward, Bug, FileCode, Terminal, CheckCircle, XCircle, FastForward, Pause, Sun, Moon, Loader2
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

  selectFile(file: CompanionFile) {
    this.selectedFile = file;
    this.studentCode = file.starterCode;
    this.outputLogs = "";
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

  startDebugger() {
    this.outputLogs = "[STARTING WORKER...]\n";
    this.isDebugging = true;
    this.isCompiling = true;
    this.isPaused = false;
    this.testResults = [];
    this.activeTab = 'console';
    if (this.editor) this.editor.setExecutionLine(null);

    if (this.worker) this.worker.terminate();

    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./app.worker', import.meta.url));

      // Setup SharedArrayBuffer
      if (typeof SharedArrayBuffer === 'undefined') {
        this.outputLogs += "[ERROR] SharedArrayBuffer is not defined. This browser environment might be missing COOP/COEP headers required for high-performance threading.\n";
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
            this.outputLogs += "\n[FINISHED]";
            this.isDebugging = false;
            this.isCompiling = false;
            this.isPaused = false;
            this.debugVars = []; // Clear vars
            if (this.editor) this.editor.setExecutionLine(null);
          });
        } else if (data.type === 'debug-paused') {
          this.ngZone.run(() => {
            this.isCompiling = false; // Failsafe: if we paused, we must be done compiling
            this.isPaused = true;
            this.activeTab = 'variables'; // Failsafe: ensure we are on the right tab
            if (this.editor) this.editor.setExecutionLine(data.line);
            this.cdr.detectChanges();
          });
        }
      };

      // Instrument code
      const codeToRun = instrumentCode(this.studentCode);
      this.worker.postMessage({ command: 'compile', code: codeToRun });

    } else {
      this.outputLogs += "[ERROR] Web Workers not supported in this environment.";
      this.isDebugging = false;
      this.isCompiling = false;
    }
  }



  step() {
    if (!this.sharedBuffer) return;
    this.isPaused = false;
    if (this.editor) this.editor.setExecutionLine(null); // Clear highlight briefly
    Atomics.store(this.sharedBuffer, 0, 1); // 1 = STEP
    Atomics.notify(this.sharedBuffer, 0);
  }

  runAll() {
    if (!this.sharedBuffer) return;
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
      this.outputLogs += "\n[STOPPED]";
    }
    this.isDebugging = false;
    this.isCompiling = false;
    this.isPaused = false;
    this.debugVars = [];
    if (this.editor) this.editor.setExecutionLine(null);
  }

  // Debug Data Parsing
  // Updated model for variables
  debugVars: {
    name: string;
    type: string;
    addr: string;
    value: string;
    targetAddr?: string;
    frame?: string;
    derefValue?: string;
  }[] = [];

  debugStack: string[] = [];

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
        this.debugStack = [...this.capturedStackLines];
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
        this.outputLogs += line;
        this.parseTestResult(line);
      }
    }
  }

  private updateDebugVars() {
    console.log(`Updating Debug Vars. Lines captured: ${this.capturedVarsLines.length}`);
    this.debugVars = this.capturedVarsLines.map(line => {
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
