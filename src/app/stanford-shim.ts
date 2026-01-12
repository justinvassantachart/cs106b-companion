export const STANFORD_SHIM = `
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
`;
