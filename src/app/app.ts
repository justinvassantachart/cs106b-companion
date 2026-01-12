import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  // EXAMPLE: Using Stanford Vector and Grid
  studentCode: string = `
int main() {
    cout << "--- Vector Test ---" << endl;
    Vector<int> v;
    v.add(10);
    v.add(1);
    v.add(2);
    v.add(3);
    cout << "Vector: " << v << endl;
    return 0;
}
`;

  outputLogs = "";
  isDebugging = false;
  worker: Worker | null = null;

  constructor(private ngZone: NgZone) { }

  startDebugger() {
    this.outputLogs = "[STARTING WORKER...]\n";
    this.isDebugging = true;

    if (this.worker) this.worker.terminate();

    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./app.worker', import.meta.url));

      this.worker.onmessage = ({ data }) => {
        if (data.type === 'log') {
          this.ngZone.run(() => this.outputLogs += data.text);
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

  // Stub methods for UI compatibility
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

