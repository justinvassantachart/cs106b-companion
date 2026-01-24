# CS106B Companion 🎓

> A browser-based C++ debugger and visualizer built for Stanford's CS106B course

### ✨ Features

- **🔧 Full C++ Compilation** — Compiles real C++ code using WebAssembly-based Clang.
- **🐛 Back and Forth Step-Through Debugger** — Set breakpoints, step through code line by line, and actually see what your variables are doing (super helpful for debugging those recursive functions that make your brain hurt).
- **📚 Stanford Library Support** — `Vector`, `Map`, `Set`, `Grid`, `Stack`, `Queue` (a library made by Stanford for their CS106B course)
- **💾 Cloud Sync** — Sign in with Google and your code syncs across devices.

## Getting Started

### For Users
Just visit the deployed site and start coding! Select a problem from the sidebar, write your solution, and hit the play button.

### For Development

If you want to run this locally (or contribute!):

```bash
# Clone the repo
git clone https://github.com/yourusername/cs106b-companion.git
cd cs106b-companion

# Install dependencies
npm install

# Start the dev server
npm start
```

Then open `http://localhost:4200` in your browser.

> **Note:** You'll need headers for `SharedArrayBuffer` support. The dev server handles this, but if you're deploying elsewhere, make sure you have proper COOP/COEP headers set up.

## Tech Stack
- **Frontend:** Angular 21 + TypeScript
- **Styling:** Tailwind CSS + Spartan UI components
- **Editor:** Monaco Editor (the same one VS Code uses!)
- **C++ Compilation:** WebAssembly Clang (`@eduoj/wasm-clang`)
- **Code Parsing:** Tree-sitter for instrumentation
- **Backend:** Firebase (Firestore + Auth)

## How It Works

1. **You write C++ code** in the Monaco editor
2. **Tree-sitter parses your code** and instruments it with debug hooks
3. **Wasm-Clang compiles it** to WebAssembly
4. **The code runs in a Web Worker** with debug support via SharedArrayBuffer
5. **You can step through execution**, inspect variables, and time-travel through your code's history

The Stanford library headers are bundled with the app and loaded into a virtual filesystem that the Clang compiler can access. It's basically witchcraft but it works.

## Stanford Library Support

The following Stanford library features are currently supported:

| Collections | Utilities |
|-------------|-----------|
| `Vector<T>` | `strlib` functions |
| `Map<K,V>` | Console I/O |
| `Set<T>` | Testing |
| `Grid<T>` | |
| `Stack<T>` | |
| `Queue<T>` | |
| `HashMap<K,V>` | |
| `HashSet<T>` | |
| `PriorityQueue<T>` | |

`#include "stanford.h"` will import all files in the Stanford library. Individually imports are also supported:
`#include "vector.h"`
`#include "map.h"`
...