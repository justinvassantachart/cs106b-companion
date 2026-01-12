import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Play, Square, StepForward, Bug, FileCode, Terminal, CheckCircle, XCircle } from 'lucide-angular';
import { Assignment, ASSIGNMENTS } from './assignments';
import { instrumentCode } from './debugger-utils';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  assignments = ASSIGNMENTS;
  selectedAssignment: Assignment = ASSIGNMENTS[0];
  studentCode: string = this.selectedAssignment.starterCode;

  outputLogs = "";
  isDebugging = false;
  isPaused = false;
  worker: Worker | null = null;
  testResults: { pass: boolean; expression: string; expected?: string; actual?: string }[] = [];
  activeTab: 'console' | 'tests' = 'console';

  sharedBuffer: Int32Array | null = null;

  // Icon imports for template
  readonly icons = {
    Play, Square, StepForward, Bug, FileCode, Terminal, CheckCircle, XCircle
  };

  constructor(private ngZone: NgZone) { }

  selectAssignment(assignment: Assignment) {
    this.selectedAssignment = assignment;
    this.studentCode = assignment.starterCode;
    this.outputLogs = "";
    this.testResults = [];
    this.activeTab = 'console';
  }

  startDebugger() {
    this.outputLogs = "[STARTING WORKER...]\n";
    this.isDebugging = true;
    this.isPaused = false;
    this.testResults = [];
    this.activeTab = 'console';

    if (this.worker) this.worker.terminate();

    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./app.worker', import.meta.url));

      // Setup SharedArrayBuffer
      this.sharedBuffer = new Int32Array(new SharedArrayBuffer(4));
      this.sharedBuffer[0] = 0; // 0 = PAUSED, 1 = STEP, 2 = RUN
      this.worker.postMessage({ command: 'configure-debug', buffer: this.sharedBuffer.buffer });

      this.worker.onmessage = ({ data }) => {
        if (data.type === 'log') {
          this.ngZone.run(() => {
            this.outputLogs += data.text;
            this.parseTestResult(data.text);
          });
        } else if (data.type === 'finished') {
          this.ngZone.run(() => {
            this.outputLogs += "\n[FINISHED]";
            this.isDebugging = false;
            this.isPaused = false;
          });
        } else if (data.type === 'debug-paused') {
          this.ngZone.run(() => {
            this.isPaused = true;
            // Optional: Scroll to line data.line
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
    Atomics.store(this.sharedBuffer, 0, 1); // 1 = STEP
    Atomics.notify(this.sharedBuffer, 0);
  }

  runAll() {
    if (!this.sharedBuffer) return;
    this.isPaused = false;
    Atomics.store(this.sharedBuffer, 0, 2); // 2 = RUN
    Atomics.notify(this.sharedBuffer, 0);
  }

  stop() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.outputLogs += "\n[STOPPED]";
    }
    this.isDebugging = false;
    this.isPaused = false;
  }
}
