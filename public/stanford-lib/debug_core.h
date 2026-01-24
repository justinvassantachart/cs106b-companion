#pragma once
// ============================================================
// DEBUG CORE - Always force-loaded by the worker
// Contains debugging macros that the worker's code transformation injects
// ============================================================

#include <algorithm>
#include <cstdlib>
#include <iostream>
#include <map>
#include <sstream>
#include <string>
#include <type_traits>
#include <vector>

using namespace std;

// ============================================================
// SFINAE Helpers (needed by Tracer)
// ============================================================

template <typename T, typename = void>
struct is_streamable : std::false_type {};

template <typename T>
struct is_streamable<T, std::void_t<decltype(std::declval<std::ostream &>()
                                             << std::declval<T>())>>
    : std::true_type {};

template <typename T, typename = void>
struct has_toDebugString : std::false_type {};

template <typename T>
struct has_toDebugString<
    T, std::void_t<decltype(std::declval<T>().toDebugString())>>
    : std::true_type {};

// ============================================================
// Error Helper
// ============================================================

#ifndef STANFORD_ERROR_DEFINED
#define STANFORD_ERROR_DEFINED
void error(string msg) {
  cout << "[!ERROR] " << msg << endl;
  exit(1);
}
#endif

// ============================================================
// JSON Value Helper (for toDebugString implementations)
// ============================================================

template <typename T> string _json_val(const T &val) {
  if constexpr (has_toDebugString<T>::value) {
    return val.toDebugString();
  } else if constexpr (std::is_same_v<T, string>) {
    return "\"" + (string)val + "\"";
  } else if constexpr (std::is_arithmetic_v<T>) {
    return to_string(val);
  } else {
    stringstream ss;
    if constexpr (is_streamable<T>::value) {
      ss << "\"" << val << "\"";
    } else {
      ss << "\"{...}\"";
    }
    return ss.str();
  }
}

// ============================================================
// Tracer Base and Implementations
// ============================================================

struct TracerBase {
  string name;
  string type;
  string frame;
  virtual string getValue() const = 0;
  virtual string getAddr() const = 0;
  virtual string getTargetAddr() const = 0;
  virtual string getDerefValue() const = 0;
  virtual ~TracerBase() {}
};

// Global tracking state
vector<TracerBase *> _active_vars;
vector<string> _call_stack;

template <typename T> struct Tracer : TracerBase {
  const T &ref;
  Tracer(string n, const T &r) : ref(r) {
    name = n;
    type = "unknown";
    frame = _call_stack.empty() ? "global" : _call_stack.back();
    _active_vars.push_back(this);
  }
  ~Tracer() {
    if (!_active_vars.empty() && _active_vars.back() == this) {
      _active_vars.pop_back();
    } else {
      auto it = std::find(_active_vars.rbegin(), _active_vars.rend(), this);
      if (it != _active_vars.rend()) {
        _active_vars.erase(std::next(it).base());
      }
    }
  }
  string getValue() const override {
    if constexpr (has_toDebugString<T>::value) {
      return ref.toDebugString();
    } else {
      stringstream ss;
      if constexpr (std::is_same_v<T, bool>) {
        ss << (ref ? "true" : "false");
      } else if constexpr (is_streamable<T>::value) {
        ss << ref;
      } else {
        ss << "{...}";
      }
      return ss.str();
    }
  }
  string getAddr() const override {
    stringstream ss;
    ss << (void *)&ref;
    return ss.str();
  }
  string getTargetAddr() const override { return "0"; }
  string getDerefValue() const override { return ""; }
};

// Pointer specialization
template <typename T> struct Tracer<T *> : TracerBase {
  T *const &ref;
  Tracer(string n, T *const &r) : ref(r) {
    name = n;
    type = "ptr";
    frame = _call_stack.empty() ? "global" : _call_stack.back();
    _active_vars.push_back(this);
  }
  ~Tracer() {
    if (!_active_vars.empty() && _active_vars.back() == this) {
      _active_vars.pop_back();
    } else {
      auto it = std::find(_active_vars.rbegin(), _active_vars.rend(), this);
      if (it != _active_vars.rend()) {
        _active_vars.erase(std::next(it).base());
      }
    }
  }
  string getValue() const override {
    if (ref == nullptr)
      return "nullptr";
    stringstream ss;
    ss << ref;
    return ss.str();
  }
  string getAddr() const override {
    stringstream ss;
    ss << (void *)&ref;
    return ss.str();
  }
  string getTargetAddr() const override {
    if (ref == nullptr)
      return "0";
    stringstream ss;
    ss << (void *)ref;
    return ss.str();
  }
  string getDerefValue() const override {
    if (ref == nullptr)
      return "null";
    stringstream ss;
    if constexpr (is_streamable<T>::value) {
      ss << (*ref);
    } else {
      ss << "{...}";
    }
    return ss.str();
  }
};

// ============================================================
// Function Scope Tracker
// ============================================================

struct FuncTracker {
  string name;
  FuncTracker(string n) {
    int count = 0;
    for (const auto &s : _call_stack) {
      if (s == n || (s.size() > n.size() + 2 && s.substr(0, n.size()) == n &&
                     s.substr(n.size(), 2) == " (")) {
        count++;
      }
    }
    name = (count > 0) ? n + " (" + to_string(count + 1) + ")" : n;
    _call_stack.push_back(name);
  }
  ~FuncTracker() {
    if (!_call_stack.empty())
      _call_stack.pop_back();
  }
};

// ============================================================
// External Debug Functions (implemented in WASM runtime)
// ============================================================

extern "C" {
void _debug_wait(int line);
void _debug_update_line(int line);

void _debug_dump_vars() {
  cout << "[DEBUG:VARS:START]" << endl;
  for (auto it = _active_vars.rbegin(); it != _active_vars.rend(); ++it) {
    cout << (*it)->name << "|" << (*it)->type << "|" << (*it)->getAddr() << "|"
         << (*it)->getValue() << "|" << (*it)->getTargetAddr() << "|"
         << (*it)->frame << "|" << (*it)->getDerefValue() << endl;
  }
  cout << "[DEBUG:VARS:END]" << endl;

  cout << "[DEBUG:STACK:START]" << endl;
  for (const auto &func : _call_stack) {
    cout << func << endl;
  }
  cout << "[DEBUG:STACK:END]" << endl;
}
}

// ============================================================
// Debug Loop Helper
// ============================================================

template <typename T>
void _debug_loop_step(int line, const char *name, const T &val) {
  Tracer<T> t(name, val);
  _debug_dump_vars();
  _debug_wait(line);
}

// ============================================================
// Debug Macros (used by worker's code transformation)
// ============================================================

#define DEBUG_STEP(line) (_debug_dump_vars(), _debug_wait(line))
#define DBG_TRACK(name, val) Tracer _dbg_##name(#name, val)
#define DBG_FUNC(name) FuncTracker _dbg_func_##name(#name)

// ============================================================
// Testing Macro
// ============================================================

#define EXPECT_EQUAL(actual, expected)                                         \
  {                                                                            \
    auto a = (actual);                                                         \
    auto e = (expected);                                                       \
    if (a == e) {                                                              \
      cout << "[TEST:PASS] " << #actual << " == " << #expected << endl;        \
    } else {                                                                   \
      cout << "[TEST:FAIL] " << #actual << " == " << #expected                 \
           << " Expected: " << e << " Actual: " << a << endl;                  \
    }                                                                          \
  }
