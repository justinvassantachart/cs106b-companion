import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Play, Square, StepForward, Bug, FileCode, Terminal, CheckCircle, XCircle } from 'lucide-angular';
import { Assignment, ASSIGNMENTS } from './assignments';

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
  worker: Worker | null = null;
  testResults: { pass: boolean; expression: string; expected?: string; actual?: string }[] = [];
  activeTab: 'console' | 'tests' = 'console';

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
  }

  startDebugger() {
    this.outputLogs = "[STARTING WORKER...]\n";
    this.isDebugging = true;
    this.testResults = [];

    if (this.worker) this.worker.terminate();

    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./app.worker', import.meta.url));

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
          });
        }
      };

      this.worker.postMessage({ command: 'compile', code: this.studentCode });

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

  step() { }
  runAll() { }
  stop() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isDebugging = false;
    this.outputLogs += "\n[STOPPED]";
  }
}
