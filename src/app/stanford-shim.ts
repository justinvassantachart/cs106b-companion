export const STANFORD_SHIM = `
#pragma once
#include <iostream>
#include <vector>
#include <string>
#include <map>
#include <set>
#include <deque>
#include <algorithm>
#include <sstream>
#include <cmath>
#include <iomanip>

using namespace std;

// ERROR HELPER
void error(string msg) {
    cout << "[!ERROR] " << msg << endl;
    exit(1);
}

// --------------------------------------------------------
// VECTOR
// --------------------------------------------------------
template <typename T>
class Vector {
private:
    vector<T> _v;
public:
    Vector() {}
    Vector(int n, T val) : _v(n, val) {}
    // Copy/Assign use default std::vector behavior (deep copy)
    
    int size() const { return _v.size(); }
    bool isEmpty() const { return _v.empty(); }
    void clear() { _v.clear(); }
    
    void add(T val) { _v.push_back(val); }
    void push_back(T val) { _v.push_back(val); }
    void insert(int i, T val) { _v.insert(_v.begin() + i, val); }
    void remove(int i) { _v.erase(_v.begin() + i); }
    
    T get(int i) const { return _v.at(i); } // bounds check
    void set(int i, T val) { _v.at(i) = val; }
    
    T& operator[](int i) { return _v[i]; }
    const T& operator[](int i) const { return _v[i]; }
    
    void operator+=(T val) { add(val); }
    
    string toString() const {
        stringstream ss;
        ss << "{";
        for(size_t i=0; i<_v.size(); i++) {
            ss << _v[i] << (i < _v.size()-1 ? ", " : "");
        }
        ss << "}";
        return ss.str();
    }
    
    // Support range-based for
    typename vector<T>::iterator begin() { return _v.begin(); }
    typename vector<T>::iterator end() { return _v.end(); }
    typename vector<T>::const_iterator begin() const { return _v.begin(); }
    typename vector<T>::const_iterator end() const { return _v.end(); }
};

template <typename T>
ostream& operator<<(ostream& os, const Vector<T>& v) { os << v.toString(); return os; }

// --------------------------------------------------------
// GRID
// --------------------------------------------------------
template <typename T>
class Grid {
private:
    int _r, _c;
    vector<vector<T>> _g;
public:
    Grid() : _r(0), _c(0) {}
    Grid(int r, int c) { resize(r,c); }
    
    void resize(int r, int c) {
        _r = r; _c = c;
        _g.resize(r);
        for(auto& row : _g) row.resize(c);
    }
    
    int numRows() const { return _r; }
    int numCols() const { return _c; }
    bool inBounds(int r, int c) const { return r>=0 && c>=0 && r<_r && c<_c; }
    
    T get(int r, int c) const { return _g.at(r).at(c); }
    void set(int r, int c, T val) { _g.at(r).at(c) = val; }
    
    // Provide row access? Stanford Grid usually uses grid[r][c] via proxy or (r,c)
    // Here we return reference to row vector
    vector<T>& operator[](int r) { return _g[r]; }
    const vector<T>& operator[](int r) const { return _g[r]; }
    
    string toString() const {
        stringstream ss;
        ss << "{";
        for(int i=0; i<_r; i++) {
            ss << "{";
            for(int j=0; j<_c; j++) {
                ss << _g[i][j] << (j<_c-1?", ":"");
            }
            ss << "}" << (i<_r-1?", ":"");
        }
        ss << "}";
        return ss.str();
    }
    
    string toString2D() const {
        stringstream ss;
        for(int i=0; i<_r; i++) {
             for(int j=0; j<_c; j++) {
                 ss << _g[i][j] << " ";
             }
             ss << "\\n";
        }
        return ss.str();
    }
};

template <typename T>
ostream& operator<<(ostream& os, const Grid<T>& g) { os << g.toString(); return os; }

// --------------------------------------------------------
// STACK
// --------------------------------------------------------
template <typename T>
class Stack {
private:
    vector<T> _s; // Using vector for stack is easier to iterate if needed (toString)
public:
    Stack() {}
    int size() const { return _s.size(); }
    bool isEmpty() const { return _s.empty(); }
    void clear() { _s.clear(); }
    void push(T val) { _s.push_back(val); }
    T pop() {
        if(_s.empty()) error("Stack empty");
        T val = _s.back();
        _s.pop_back();
        return val;
    }
    T peek() const {
        if(_s.empty()) error("Stack empty");
        return _s.back();
    }
    string toString() const {
        stringstream ss;
        ss << "{";
        for(size_t i=0; i<_s.size(); i++) { // Stack prints bottom to top? Or top to bottom? Usually bottom->top
            ss << _s[i] << (i < _s.size()-1 ? ", " : "");
        }
        ss << "}";
        return ss.str();
    }
};
template <typename T>
ostream& operator<<(ostream& os, const Stack<T>& s) { os << s.toString(); return os; }

// --------------------------------------------------------
// QUEUE
// --------------------------------------------------------
template <typename T>
class Queue {
private:
    deque<T> _q;
public:
    Queue() {}
    int size() const { return _q.size(); }
    bool isEmpty() const { return _q.empty(); }
    void clear() { _q.clear(); }
    void enqueue(T val) { _q.push_back(val); }
    T dequeue() {
        if(_q.empty()) error("Queue empty");
        T val = _q.front();
        _q.pop_front();
        return val;
    }
    T peek() const {
        if(_q.empty()) error("Queue empty");
        return _q.front();
    }
    string toString() const {
        stringstream ss;
        ss << "{";
        for(size_t i=0; i<_q.size(); i++) {
            ss << _q[i] << (i < _q.size()-1 ? ", " : "");
        }
        ss << "}";
        return ss.str();
    }
};
template <typename T>
ostream& operator<<(ostream& os, const Queue<T>& q) { os << q.toString(); return os; }

// --------------------------------------------------------
// MAP
// --------------------------------------------------------
template <typename K, typename V>
class Map {
private:
    map<K, V> _m;
public:
    Map() {}
    int size() const { return _m.size(); }
    bool isEmpty() const { return _m.empty(); }
    void clear() { _m.clear(); }
    
    void put(K k, V v) { _m[k] = v; }
    bool containsKey(K k) const { return _m.find(k) != _m.end(); }
    V get(K k) const {
        if(_m.find(k) == _m.end()) return V(); // Default value
        return _m.at(k);
    }
    void remove(K k) { _m.erase(k); }
    
    V& operator[](K k) { return _m[k]; }
    
    string toString() const {
        stringstream ss;
        ss << "{";
        int i = 0;
        for(auto const& [key, val] : _m) {
            ss << key << ":" << val;
            if(i < _m.size()-1) ss << ", ";
            i++;
        }
        ss << "}";
        return ss.str();
    }
};
template <typename K, typename V> using HashMap = Map<K,V>;
template <typename K, typename V>
ostream& operator<<(ostream& os, const Map<K, V>& m) { os << m.toString(); return os; }

// --------------------------------------------------------
// SET
// --------------------------------------------------------
template <typename T>
class Set {
private:
    set<T> _s;
public:
    Set() {}
    int size() const { return _s.size(); }
    bool isEmpty() const { return _s.empty(); }
    void clear() { _s.clear(); }
    
    void add(T val) { _s.insert(val); }
    bool contains(T val) const { return _s.find(val) != _s.end(); }
    void remove(T val) { _s.erase(val); }
    
    void operator+=(T val) { add(val); }
    void operator-=(T val) { remove(val); }
    
    string toString() const {
        stringstream ss;
        ss << "{";
        int i=0;
        for(auto const& val : _s) {
            ss << val << (i < _s.size()-1 ? ", " : "");
            i++;
        }
        ss << "}";
        return ss.str();
    }
};
template <typename T> using HashSet = Set<T>;
template <typename T>
ostream& operator<<(ostream& os, const Set<T>& s) { os << s.toString(); return os; }

// --------------------------------------------------------
// SIMPLE HELPER
// --------------------------------------------------------
struct GridLocation {
    int row, col;
    GridLocation(int r=0, int c=0) : row(r), col(c) {}
    string toString() const {
        return "r" + to_string(row) + "c" + to_string(col);
    }
};
bool operator==(const GridLocation& a, const GridLocation& b) { return a.row == b.row && a.col == b.col; }
ostream& operator<<(ostream& os, const GridLocation& g) { os << g.toString(); return os; }

// --------------------------------------------------------
// TESTING
// --------------------------------------------------------
#define EXPECT_EQUALS(actual, expected) { \\
    auto a = (actual); \\
    auto e = (expected); \\
    if (a == e) { \\
        cout << "[TEST:PASS] " << #actual << " == " << #expected << endl; \\
    } else { \\
        cout << "[TEST:FAIL] " << #actual << " == " << #expected \\
             << " Expected: " << e << " Actual: " << a << endl; \\
    } \\
}
// --------------------------------------------------------
// DEBUGGING / VARIABLE TRACKING
// --------------------------------------------------------
// SFINAE helper to detect if operator<< exists
template<typename T, typename = void>
struct is_streamable : std::false_type {};

template<typename T>
struct is_streamable<T, std::void_t<decltype(std::declval<std::ostream&>() << std::declval<T>())>> : std::true_type {};

struct VarInfo {
    string name;
    string type;
    string value;
};

// Heap Tracking
struct HeapInfo {
    void* addr;
    size_t size;      // 0 if unknown
    string type;      // "raw" or specific type
    string value;     // Captured value string
    bool is_array;
};

// Global heap registry: Addr -> Info
map<void*, HeapInfo> _heap_registrations;

// Re-entrancy guard for memory hooks
bool _in_mem_hook = false;

// Common helper to register raw allocation
void _debug_register_allocation(void* p, size_t size, bool is_array) {
    if (!p) return;
    // Guard already handled in caller? Or here?
    // Better in caller to avoid even calling this function/allocating stack for it if possible.
    // But map operations happen here.
    
    HeapInfo info;
    info.addr = p;
    info.size = size;
    info.type = "raw";
    stringstream ss;
    ss << "Allocated (" << size << " bytes)";
    info.value = ss.str();
    info.is_array = is_array;
    _heap_registrations[p] = info;
}

// Unregister on delete
void _debug_unregister_allocation(void* p) {
    if (!p) return;
    _heap_registrations.erase(p);
}

// Update type/value from a typed context (Tracer or operator<<)
// Update type/value from a typed context (Tracer or operator<<)
// Global recursion depth counter
static int _debug_depth = 0;

template <typename T>
void _debug_update_heap_info(T* ptr, string typeName) {
    if (!ptr) return;
    
    // Allow recursion but prevent infinite loops
    if (_debug_depth > 50) return;
    _debug_depth++;
    
    // Save old hook state (likely false, but could be true if recursive)
    bool old_hook = _in_mem_hook;
    _in_mem_hook = true; // Prevent internal allocations (map, stringstream) from being tracked
    
    void* addr = (void*)ptr;
    
    auto it = _heap_registrations.find(addr);
    if (it != _heap_registrations.end()) {
        it->second.type = typeName;
        // Update value using the typed pointer if it allows streaming
        if constexpr (is_streamable<T>::value) {
            stringstream ss;
            ss << (*ptr);
            it->second.value = ss.str();
        }
    }
    
    _in_mem_hook = old_hook;
    _debug_depth--;
}

// Function to register a pointer from generated code (recursive pointers)
extern "C" void _debug_register_pointer(void* ptr, const char* typeName) {
    // No-op for now as planned
}

// Global overrides for new/delete
void* operator new(size_t size) {
    if (_in_mem_hook) {
        return malloc(size);
    }
    _in_mem_hook = true;
    void* p = malloc(size);
    _debug_register_allocation(p, size, false);
    _in_mem_hook = false;
    return p;
}
void* operator new[](size_t size) {
    if (_in_mem_hook) {
        return malloc(size);
    }
    _in_mem_hook = true;
    void* p = malloc(size);
    _debug_register_allocation(p, size, true);
    _in_mem_hook = false;
    return p;
}
void operator delete(void* p) noexcept {
    if (_in_mem_hook) {
        free(p);
        return;
    }
    _in_mem_hook = true;
    _debug_unregister_allocation(p);
    free(p);
    _in_mem_hook = false;
}
void operator delete[](void* p) noexcept {
    if (_in_mem_hook) {
        free(p);
        return;
    }
    _in_mem_hook = true;
    _debug_unregister_allocation(p);
    free(p);
    _in_mem_hook = false;
}
// Sized delete (C++14)
void operator delete(void* p, size_t) noexcept {
    if (_in_mem_hook) {
        free(p);
        return;
    }
    _in_mem_hook = true;
    _debug_unregister_allocation(p);
    free(p);
    _in_mem_hook = false;
}
void operator delete[](void* p, size_t) noexcept {
    if (_in_mem_hook) {
        free(p);
        return;
    }
    _in_mem_hook = true;
    _debug_unregister_allocation(p);
    free(p);
    _in_mem_hook = false;
}


// Abstract base for polymorphism
struct TracerBase {
    string name;
    string type;
    string frame; // Scope
    virtual string getValue() const = 0;
    virtual string getAddr() const = 0;
    virtual string getTargetAddr() const = 0; // For pointers
    virtual string getDerefValue() const = 0; // For pointer targets content
    virtual ~TracerBase() {}
};

// Global tracking state
vector<TracerBase*> _active_vars;
vector<string> _call_stack;

// Templated tracer captures reference to variable
template <typename T>
struct Tracer : TracerBase {
    const T& ref;
    Tracer(string n, const T& r) : ref(r) { 
        name = n; 
        type = "unknown"; // simplified
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
        stringstream ss;
        if constexpr (std::is_same_v<T, bool>) {
            ss << (ref ? "true" : "false");
        } else {
            if constexpr (is_streamable<T>::value) {
                ss << ref;
            } else {
                ss << "{...}";
            }
        }
        return ss.str();
    }
    string getAddr() const override {
        stringstream ss;
        ss << (void*)&ref; // Cast to void* to ensure address printing
        return ss.str();
    }
    string getTargetAddr() const override {
        return "0"; // Not a pointer
    }
    string getDerefValue() const override {
        return ""; // Not a pointer
    }
};

// Pointer specialization
template <typename T>
struct Tracer<T*> : TracerBase {
    T* const& ref;
    Tracer(string n, T* const& r) : ref(r) {
        name = n;
        type = "ptr";
        frame = _call_stack.empty() ? "global" : _call_stack.back();
        _active_vars.push_back(this);
        
        // Speculatively update heap info if this points to a known heap block
        if (ref) {
           _debug_update_heap_info(ref, "known_type");
        }
    }
    // We also need to update whenever we query, because the value might have changed!
    
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
        if (ref == nullptr) return "nullptr";
        stringstream ss;
        // Print address it holds
        ss << ref;
         // SIDE EFFECT: Update heap info.
        _debug_update_heap_info(ref, "ptr_target");
        return ss.str();
    }
    string getAddr() const override {
        stringstream ss;
        ss << (void*)&ref; // Address of the pointer variable itself
        return ss.str();
    }
    string getTargetAddr() const override {
        if (ref == nullptr) return "0";
        stringstream ss;
        ss << (void*)ref; // Address is points to
        return ss.str();
    }
    string getDerefValue() const override {
        if (ref == nullptr) return "null";
        stringstream ss;
        if constexpr (is_streamable<T>::value) {
            // Force use of operator<< from global scope if available
            ss << (*ref);
        } else {
            ss << "{...}";
        }
        return ss.str();
    }
};

// Function Scope Tracker
struct FuncTracker {
    string name;
    FuncTracker(string n) {
         stringstream ss;
         ss << n << ":" << _call_stack.size();
         name = ss.str();
         _call_stack.push_back(name); 
    }
    ~FuncTracker() { 
        if (!_call_stack.empty()) _call_stack.pop_back(); 
    }
};

extern "C" {
    void _debug_wait(int line);
    // Export simple function to dump vars
    void _debug_dump_vars() {
        cout << "[DEBUG:VARS:START]" << endl;
        // Reverse iterate to show top of stack first
        for (auto it = _active_vars.rbegin(); it != _active_vars.rend(); ++it) {
            // Format: name|type|addr|value|targetAddr|frame|derefValue
            cout << (*it)->name << "|" 
                 << (*it)->type << "|"
                 << (*it)->getAddr() << "|"
                 << (*it)->getValue() << "|"
                 << (*it)->getTargetAddr() << "|"
                 << (*it)->frame << "|"
                 << (*it)->getDerefValue() << endl;
        }
        
        // Dump Heap Objects
        // Dump logic also calls stringstream, so guard if needed?
        // _debug_dump_vars is called from debugger, not inside alloc.
        // But iterating _heap_registrations which is a map. Safe.
        for (const auto& [addr, info] : _heap_registrations) {
           stringstream ssAddr; ssAddr << addr;
           cout << "*" << ssAddr.str() << "|"
                << info.type << "|" 
                << ssAddr.str() << "|" // "Address" of the object is its heap address
                << info.value << "|" // Value
                << "0" << "|" // No target 
                << "heap" << "|" // Frame = heap
                << info.value << endl; // Deref value is itself
        }
        
        cout << "[DEBUG:VARS:END]" << endl;
        
        cout << "[DEBUG:STACK:START]" << endl;
        for (const auto& func : _call_stack) {
            cout << func << endl;
        }
        cout << "[DEBUG:STACK:END]" << endl;
    }
}
#define DEBUG_STEP(line) { _debug_dump_vars(); _debug_wait(line); }
#define DBG_TRACK(name, val) Tracer _dbg_##name(#name, val)
#define DBG_FUNC(name) FuncTracker _dbg_func_##name(#name)
`;
