import { Component, NgZone, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Play, Square, StepForward, Bug, FileCode, Terminal, CheckCircle, XCircle, FastForward, Pause } from 'lucide-angular';
import { Assignment, ASSIGNMENTS } from './assignments';
import { instrumentCode } from './debugger-utils';
import { MonacoEditorComponent } from './components/monaco-editor/monaco-editor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, MonacoEditorComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  @ViewChild(MonacoEditorComponent) editor!: MonacoEditorComponent;

  assignments = ASSIGNMENTS;
  selectedAssignment: Assignment = ASSIGNMENTS[0];
  studentCode: string = this.selectedAssignment.starterCode;

  outputLogs = "";
  isDebugging = false;
  isPaused = false;
  worker: Worker | null = null;
  testResults: { pass: boolean; expression: string; expected?: string; actual?: string }[] = [];
  activeTab: 'console' | 'tests' | 'variables' = 'console';

  sharedBuffer: Int32Array | null = null;

  // Debugging state
  breakpoints: Set<number> = new Set();
  currentLine: number | null = null;

  // Icon imports for template
  readonly icons = {
    Play, Square, StepForward, Bug, FileCode, Terminal, CheckCircle, XCircle, FastForward, Pause
  };

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) { }

  selectAssignment(assignment: Assignment) {
    this.selectedAssignment = assignment;
    this.studentCode = assignment.starterCode;
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
    this.isPaused = false;
    this.testResults = [];
    this.activeTab = 'console';
    if (this.editor) this.editor.setExecutionLine(null);

    if (this.worker) this.worker.terminate();

    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./app.worker', import.meta.url));

      // Setup SharedArrayBuffer
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
            const text = data.text;

            // Check for debug data enclosed in special markers
            if (text.includes('[DEBUG:VARS:START]')) {
              this.parseDebugData(text);
              // Filter out debug logs from user console
              const cleanText = text.replace(/\[DEBUG:VARS:START\][\s\S]*?\[DEBUG:VARS:END\]\n?/, '')
                .replace(/\[DEBUG:STACK:START\][\s\S]*?\[DEBUG:STACK:END\]\n?/, '');
              if (cleanText.trim()) this.outputLogs += cleanText;
            } else {
              this.outputLogs += text;
              this.parseTestResult(text);
            }
            this.cdr.detectChanges();
          });
        } else if (data.type === 'finished') {
          this.ngZone.run(() => {
            this.outputLogs += "\n[FINISHED]";
            this.isDebugging = false;
            this.isPaused = false;
            this.debugVars = []; // Clear vars
            if (this.editor) this.editor.setExecutionLine(null);
          });
        } else if (data.type === 'debug-paused') {
          this.ngZone.run(() => {
            this.isPaused = true;
            if (this.editor) this.editor.setExecutionLine(data.line);
            this.editor?.editor?.revealLineInCenter(data.line);
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
    }
  }

  private parseTestResult(log: string) {
    const lines = log.split('\n');
    for (const line of lines) {
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
    this.isPaused = false;
    this.debugVars = [];
    if (this.editor) this.editor.setExecutionLine(null);
  }

  // Debug Data Parsing
  debugVars: { name: string, value: string }[] = [];
  debugStack: string[] = [];

  private parseDebugData(text: string) {
    // Extract VARS section
    const varMatch = text.match(/\[DEBUG:VARS:START\]([\s\S]*?)\[DEBUG:VARS:END\]/);
    if (varMatch) {
      const varLines = varMatch[1].trim().split('\n');
      this.debugVars = varLines.filter(l => l.includes('|')).map(line => {
        const [name, ...valParts] = line.split('|');
        return { name, value: valParts.join('|') };
      });
    }

    // Extract STACK section
    const stackMatch = text.match(/\[DEBUG:STACK:START\]([\s\S]*?)\[DEBUG:STACK:END\]/);
    if (stackMatch) {
      this.debugStack = stackMatch[1].trim().split('\n').filter(s => s.trim().length > 0);
    }
  }
}
