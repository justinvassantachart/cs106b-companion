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
#include <initializer_list>
#include <cctype>

using namespace std;

// ERROR HELPER
void error(string msg) {
    cout << "[!ERROR] " << msg << endl;
    exit(1);
}

// SFINAE helper to detect if operator<< exists
template<typename T, typename = void>
struct is_streamable : std::false_type {};

template<typename T>
struct is_streamable<T, std::void_t<decltype(std::declval<std::ostream&>() << std::declval<T>())>> : std::true_type {};

// SFINAE helper for debug stringification
template <typename T, typename = void>
struct has_toDebugString : std::false_type {};

template <typename T>
struct has_toDebugString<T, std::void_t<decltype(std::declval<T>().toDebugString())>> : std::true_type {};

// Helper to get JSON-safe value string
template <typename T>
string _json_val(const T& val);

// --- Collections with toDebugString ---

template <typename T>
class Vector {
private:
    vector<T> _v;
public:
    Vector() {}
    Vector(int n, T val) : _v(n, val) {}
    Vector(std::initializer_list<T> list) : _v(list) {}
    
    int size() const { return _v.size(); }
    bool isEmpty() const { return _v.empty(); }
    void clear() { _v.clear(); }
    
    void add(T val) { _v.push_back(val); }
    void push_back(T val) { _v.push_back(val); }
    void insert(int i, T val) { _v.insert(_v.begin() + i, val); }
    void remove(int i) { _v.erase(_v.begin() + i); }
    
    T get(int i) const { return _v.at(i); }
    void set(int i, T val) { _v.at(i) = val; }
    
    T& operator[](int i) { return _v[i]; }
    const T& operator[](int i) const { return _v[i]; }
    void operator+=(T val) { add(val); }
    
    string toString() const {
        stringstream ss; ss << "{";
        for(size_t i=0; i<_v.size(); i++) ss << _v[i] << (i < _v.size()-1 ? ", " : "");
        ss << "}"; return ss.str();
    }
    string toDebugString() const {
        stringstream ss; ss << "[";
        for(size_t i=0; i<_v.size(); i++) ss << _json_val(_v[i]) << (i < _v.size()-1 ? ", " : "");
        ss << "]"; return ss.str();
    }
    
    typename vector<T>::iterator begin() { return _v.begin(); }
    typename vector<T>::iterator end() { return _v.end(); }
    
    bool operator==(const Vector<T>& other) const { return _v == other._v; }
    bool operator!=(const Vector<T>& other) const { return _v != other._v; }
};

template <typename T>
class Grid {
private:
    int _r, _c;
    vector<vector<T>> _g;
public:
    Grid() : _r(0), _c(0) {}
    Grid(int r, int c) { resize(r,c); }
    Grid(std::initializer_list<std::initializer_list<T>> list) {
        _r = list.size(); _c = (_r > 0) ? list.begin()->size() : 0;
        _g.resize(_r); int i = 0;
        for (const auto& row : list) { _g[i] = row; i++; }
    }
    
    void resize(int r, int c) {
        _r = r; _c = c; _g.resize(r);
        for(auto& row : _g) row.resize(c);
    }
    int numRows() const { return _r; }
    int numCols() const { return _c; }
    bool inBounds(int r, int c) const { return r>=0 && c>=0 && r<_r && c<_c; }
    T get(int r, int c) const { return _g.at(r).at(c); }
    void set(int r, int c, T val) { _g.at(r).at(c) = val; }
    
    vector<T>& operator[](int r) { return _g[r]; }
    const vector<T>& operator[](int r) const { return _g[r]; }
    
    string toString() const {
        stringstream ss; ss << "{";
        for(int i=0; i<_r; i++) {
            ss << "{";
            for(int j=0; j<_c; j++) ss << _g[i][j] << (j<_c-1?", ":"");
            ss << "}" << (i<_r-1?", ":"");
        }
        ss << "}"; return ss.str();
    }
    string toDebugString() const {
        stringstream ss; ss << "{";
        for(int i=0; i<_r; i++) {
            ss << "\\\"Row " << i << "\\\": [";
            for(int j=0; j<_c; j++) ss << _json_val(_g[i][j]) << (j<_c-1?", ":"");
            ss << "]" << (i<_r-1?", ":"");
        }
        ss << "}"; return ss.str();
    }
};

template <typename T>
class Set {
private:
    set<T> _s;
public:
    Set() {}
    Set(std::initializer_list<T> list) { for (const auto& item : list) add(item); }
    int size() const { return _s.size(); }
    bool isEmpty() const { return _s.empty(); }
    void clear() { _s.clear(); }
    void add(T val) { _s.insert(val); }
    bool contains(T val) const { return _s.find(val) != _s.end(); }
    void remove(T val) { _s.erase(val); }
    void operator+=(T val) { add(val); }
    
    string toString() const {
        stringstream ss; ss << "{"; int i=0;
        for(const auto& val : _s) { ss << val << (i < _s.size()-1 ? ", " : ""); i++; }
        ss << "}"; return ss.str();
    }
    string toDebugString() const {
        stringstream ss; ss << "["; int i=0;
        for(const auto& val : _s) { ss << _json_val(val) << (i < _s.size()-1 ? ", " : ""); i++; }
        ss << "]"; return ss.str();
    }
};

template <typename K, typename V>
class Map {
private:
    map<K, V> _m;
public:
    Map() {}
    Map(std::initializer_list<std::pair<K, V>> list) { for (const auto& p : list) _m[p.first] = p.second; }
    int size() const { return _m.size(); }
    bool isEmpty() const { return _m.empty(); }
    void clear() { _m.clear(); }
    void put(K k, V v) { _m[k] = v; }
    bool containsKey(K k) const { return _m.find(k) != _m.end(); }
    V get(K k) const { if(_m.find(k) == _m.end()) return V(); return _m.at(k); }
    void remove(K k) { _m.erase(k); }
    V& operator[](K k) { return _m[k]; }
    
    string toString() const {
        stringstream ss; ss << "{"; int i = 0;
        for(auto const& [key, val] : _m) { ss << key << ":" << val; if(i < _m.size()-1) ss << ", "; i++; }
        ss << "}"; return ss.str();
    }
    string toDebugString() const {
        stringstream ss; ss << "{"; int i = 0;
        for(auto const& [key, val] : _m) {
            ss << "\\\"" << key << "\\\": " << _json_val(val);
            if(i < _m.size()-1) ss << ", "; i++;
        }
        ss << "}"; return ss.str();
    }
};

// JSON Value helper implementation
template <typename T>
string _json_val(const T& val) {
    if constexpr (has_toDebugString<T>::value) {
        return val.toDebugString();
    } else if constexpr (std::is_same_v<T, string>) {
        return "\\\"" + (string)val + "\\\"";
    } else if constexpr (std::is_arithmetic_v<T>) {
        return to_string(val);
    } else {
        stringstream ss;
        if constexpr (is_streamable<T>::value) {
            ss << "\\\"" << val << "\\\"";
        } else {
            ss << "\\\"{...}\\\"";
        }
        return ss.str();
    }
}

// ... existing stream operators for Vector, Grid, etc ...
template <typename T>
class Stack {
private:
    vector<T> _v;
public:
    Stack() {}
    Stack(std::initializer_list<T> list) : _v(list) {}
    int size() const { return _v.size(); }
    bool isEmpty() const { return _v.empty(); }
    void clear() { _v.clear(); }
    void push(T val) { _v.push_back(val); }
    T pop() { T val = _v.back(); _v.pop_back(); return val; }
    T peek() const { return _v.back(); }
    
    string toString() const {
        stringstream ss; ss << "{";
        for(size_t i=0; i<_v.size(); i++) ss << _v[i] << (i < _v.size()-1 ? ", " : "");
        ss << "}"; return ss.str();
    }
    string toDebugString() const {
        stringstream ss; ss << "[";
        for(size_t i=0; i<_v.size(); i++) ss << _json_val(_v[i]) << (i < _v.size()-1 ? ", " : "");
        ss << "]"; return ss.str();
    }
};

template <typename T>
class Queue {
private:
    deque<T> _q;
public:
    Queue() {}
    Queue(std::initializer_list<T> list) : _q(list) {}
    int size() const { return _q.size(); }
    bool isEmpty() const { return _q.empty(); }
    void clear() { _q.clear(); }
    void enqueue(T val) { _q.push_back(val); }
    T dequeue() { T val = _q.front(); _q.pop_front(); return val; }
    T peek() const { return _q.front(); }
    
    string toString() const {
        stringstream ss; ss << "{";
        for(size_t i=0; i<_q.size(); i++) ss << _q[i] << (i < _q.size()-1 ? ", " : "");
        ss << "}"; return ss.str();
    }
    string toDebugString() const {
        stringstream ss; ss << "[";
        for(size_t i=0; i<_q.size(); i++) ss << _json_val(_q[i]) << (i < _q.size()-1 ? ", " : "");
        ss << "]"; return ss.str();
    }
};

template <typename T> ostream& operator<<(ostream& os, const Vector<T>& v) { os << v.toString(); return os; }
template <typename T> ostream& operator<<(ostream& os, const Grid<T>& g) { os << g.toString(); return os; }
template <typename T> ostream& operator<<(ostream& os, const Set<T>& s) { os << s.toString(); return os; }
template <typename K, typename V> ostream& operator<<(ostream& os, const Map<K, V>& m) { os << m.toString(); return os; }
template <typename T> ostream& operator<<(ostream& os, const Stack<T>& s) { os << s.toString(); return os; }
template <typename T> ostream& operator<<(ostream& os, const Queue<T>& q) { os << q.toString(); return os; }

// --------------------------------------------------------
// STRLIB IMPLEMENTATION
// --------------------------------------------------------

// Prototypes with default arguments where applicable
string integerToString(int n, int radix = 10);
string longToString(long n, int radix = 10);
string realToString(double d);
string boolToString(bool b);
string charToString(char c);
bool stringIsInteger(const string& str, int radix = 10);
bool stringIsReal(const string& str);
bool stringIsBool(const string& str);
int stringToInteger(const string& str, int radix = 10);
long stringToLong(const string& str, int radix = 10);
double stringToReal(const string& str);
bool stringToBool(const string& str);
char stringToChar(const string& str);
string toLowerCase(const string& str);
string toUpperCase(const string& str);
void toLowerCaseInPlace(string& str);
void toUpperCaseInPlace(string& str);
string trim(const string& str);
void trimInPlace(string& str);
string trimStart(const string& str);
void trimStartInPlace(string& str);
string trimEnd(const string& str);
void trimEndInPlace(string& str);
bool startsWith(const string& str, const string& prefix);
bool startsWith(const string& str, char prefix);
bool endsWith(const string& str, const string& suffix);
bool endsWith(const string& str, char suffix);
bool equalsIgnoreCase(const string& s1, const string& s2);
string stringReplace(const string& str, const string& old, const string& replacement, int limit = -1);
string stringReplace(const string& str, char old, char replacement, int limit = -1);
int stringReplaceInPlace(string& str, const string& old, const string& replacement, int limit = -1);
int stringReplaceInPlace(string& str, char old, char replacement, int limit = -1);
Vector<string> stringSplit(const string& str, const string& delimiter, int limit = -1);
Vector<string> stringSplit(const string& str, char delimiter, int limit = -1);
string stringJoin(const Vector<string>& v, const string& delimiter = "");
string stringJoin(const Vector<string>& v, char delimiter);
string htmlDecode(const string& s);
string htmlEncode(const string& s);
string urlDecode(const string& str);
void urlDecodeInPlace(string& str);
string urlEncode(const string& str);
void urlEncodeInPlace(string& str);
bool stringContains(const string& s, char ch);
bool stringContains(const string& s, const string& substring);
int stringIndexOf(const string& s, char ch, int startIndex = 0);
int stringIndexOf(const string& s, const string& substring, int startIndex = 0);
int stringLastIndexOf(const string& s, char ch, int startIndex = string::npos);
int stringLastIndexOf(const string& s, const string& substring, int startIndex = string::npos);


string boolToString(bool b) {
    return (b ? "true" : "false");
}

/*
 * Implementation notes: numeric conversion
 */
string integerToString(int n, int radix) {
    if (radix <= 0) error("integerToString: Illegal radix");
    ostringstream stream;
    if (radix != 10) stream << setbase(radix);
    stream << n;
    return stream.str();
}

string longToString(long n, int radix) {
    if (radix <= 0) error("longToString: Illegal radix");
    ostringstream stream;
    if (radix != 10) stream << setbase(radix);
    stream << n;
    return stream.str();
}

string realToString(double d) {
    ostringstream stream;
    stream << uppercase << d;
    return stream.str();
}

string charToString(char c) {
    string s; s += c; return s;
}

bool stringIsInteger(const string& str, int radix) {
    if (radix <= 0) error("stringIsInteger: Illegal radix");
    istringstream stream(trim(str));
    stream >> setbase(radix);
    int value; stream >> value;
    return !(stream.fail() || !stream.eof());
}

bool stringIsReal(const string& str) {
    istringstream stream(trim(str));
    double value; stream >> value;
    return !(stream.fail() || !stream.eof());
}

bool stringIsBool(const string& str) {
    return str == "true" || str == "false";
}

int stringToInteger(const string& str, int radix) {
    if (radix <= 0) error("stringToInteger: Illegal radix");
    istringstream stream(trim(str));
    stream >> setbase(radix);
    int value; stream >> value;
    if (stream.fail() || !stream.eof()) error("stringToInteger: Illegal integer format");
    return value;
}

long stringToLong(const string& str, int radix) {
    if (radix <= 0) error("stringToLong: Illegal radix");
    istringstream stream(trim(str));
    stream >> setbase(radix);
    long value; stream >> value;
    if (stream.fail() || !stream.eof()) error("stringToLong: Illegal long format");
    return value;
}

double stringToReal(const string& str) {
    istringstream stream(trim(str));
    double value; stream >> value;
    if (stream.fail() || !stream.eof()) error("stringToReal: Illegal floating-point format");
    return value;
}

bool stringToBool(const string& str) {
    if (str == "true" || str == "1") return true;
    if (str == "false" || str == "0") return false;
    istringstream stream(trim(str));
    bool value; stream >> boolalpha >> value;
    if (stream.fail() || !stream.eof()) error("stringToBool: Illegal bool format");
    return value;
}

char stringToChar(const string& str) {
    if (str.length() != 1) error("stringToChar: string must contain exactly 1 character");
    return str[0];
}

void toLowerCaseInPlace(string& str) {
    for (size_t i = 0; i < str.length(); i++) str[i] = tolower(str[i]);
}

string toLowerCase(const string& str) {
    string s = str; toLowerCaseInPlace(s); return s;
}

void toUpperCaseInPlace(string& str) {
    for (size_t i = 0; i < str.length(); i++) str[i] = toupper(str[i]);
}

string toUpperCase(const string& str) {
    string s = str; toUpperCaseInPlace(s); return s;
}

void trimEndInPlace(string& str) {
    int finish = (int)str.length();
    while (finish > 0 && isspace(str[finish - 1])) finish--;
    if (finish < (int)str.length()) str.erase(finish);
}

string trimEnd(const string& str) {
    string s = str; trimEndInPlace(s); return s;
}

void trimStartInPlace(string& str) {
    int start = 0;
    while (start < (int)str.length() && isspace(str[start])) start++;
    if (start > 0) str.erase(0, start);
}

string trimStart(const string& str) {
    string s = str; trimStartInPlace(s); return s;
}

void trimInPlace(string& str) {
    trimEndInPlace(str);
    trimStartInPlace(str);
}

string trim(const string& str) {
    string s = str; trimInPlace(s); return s;
}

bool startsWith(const string& str, const string& prefix) {
    return str.size() >= prefix.size() && str.substr(0, prefix.size()) == prefix;
}

bool startsWith(const string& str, char prefix) {
    return !str.empty() && str[0] == prefix;
}

bool endsWith(const string& str, const string& suffix) {
    return str.size() >= suffix.size() && str.substr(str.size() - suffix.size()) == suffix;
}

bool endsWith(const string& str, char suffix) {
    return !str.empty() && str.back() == suffix;
}

bool equalsIgnoreCase(const string& s1, const string& s2) {
    if (s1.size() != s2.size()) return false;
    for (size_t i = 0; i < s1.size(); i++) {
        if (tolower(s1[i]) != tolower(s2[i])) return false;
    }
    return true;
}

int stringReplaceInPlace(string& str, const string& old, const string& replacement, int limit) {
    int count = 0;
    size_t start = 0;
    while (limit < 0 || count < limit) {
        size_t pos = str.find(old, start);
        if (pos == string::npos) break;
        str.replace(pos, old.length(), replacement);
        start = pos + replacement.length();
        count++;
    }
    return count;
}

int stringReplaceInPlace(string& str, char old, char replacement, int limit) {
    int count = 0;
    for (size_t i = 0; i < str.length(); i++) {
        if (str[i] == old) {
            str[i] = replacement;
            count++;
            if (limit > 0 && count >= limit) break;
        }
    }
    return count;
}

string stringReplace(const string& str, const string& old, const string& replacement, int limit) {
    string s = str; stringReplaceInPlace(s, old, replacement, limit); return s;
}

string stringReplace(const string& str, char old, char replacement, int limit) {
    string s = str; stringReplaceInPlace(s, old, replacement, limit); return s;
}

Vector<string> stringSplit(const string& str, const string& delimiter, int limit) {
    Vector<string> result;
    if (delimiter.empty()) { result.add(str); return result; }
    string s = str;
    size_t pos = 0;
    int count = 0;
    while ((limit < 0 || count < limit) && (pos = s.find(delimiter)) != string::npos) {
        result.add(s.substr(0, pos));
        s.erase(0, pos + delimiter.length());
        count++;
    }
    result.add(s);
    return result;
}

Vector<string> stringSplit(const string& str, char delimiter, int limit) {
    return stringSplit(str, string(1, delimiter), limit);
}

string stringJoin(const Vector<string>& v, const string& delimiter) {
    ostringstream oss;
    for (int i = 0; i < v.size(); ++i) {
        if (i > 0) oss << delimiter;
        oss << v[i];
    }
    return oss.str();
}

string stringJoin(const Vector<string>& v, char delimiter) {
    return stringJoin(v, string(1, delimiter));
}

bool stringContains(const string& s, const string& substring) {
    return s.find(substring) != string::npos;
}

bool stringContains(const string& s, char ch) {
    return s.find(ch) != string::npos;
}

int stringIndexOf(const string& s, const string& substring, int startIndex) {
    size_t pos = s.find(substring, startIndex);
    return (pos == string::npos) ? -1 : (int)pos;
}

int stringIndexOf(const string& s, char ch, int startIndex) {
    size_t pos = s.find(ch, startIndex);
    return (pos == string::npos) ? -1 : (int)pos;
}

int stringLastIndexOf(const string& s, const string& substring, int startIndex) {
    size_t pos = s.rfind(substring, (startIndex == string::npos) ? string::npos : (size_t)startIndex);
    return (pos == string::npos) ? -1 : (int)pos;
}

int stringLastIndexOf(const string& s, char ch, int startIndex) {
    size_t pos = s.rfind(ch, (startIndex == string::npos) ? string::npos : (size_t)startIndex);
    return (pos == string::npos) ? -1 : (int)pos;
}

string htmlEncode(const string& s) {
    string res = s;
    stringReplaceInPlace(res, "&", "&amp;");
    stringReplaceInPlace(res, "<", "&lt;");
    stringReplaceInPlace(res, ">", "&gt;");
    stringReplaceInPlace(res, "\\\"", "&quot;");
    return res;
}

string htmlDecode(const string& s) {
    string res = s;
    stringReplaceInPlace(res, "&lt;", "<");
    stringReplaceInPlace(res, "&gt;", ">");
    stringReplaceInPlace(res, "&quot;", "\\\"");
    stringReplaceInPlace(res, "&amp;", "&");
    return res;
}

// Minimal URL encode/decode
string urlEncode(const string& str) {
    ostringstream escaped;
    escaped.fill('0');
    escaped << hex << uppercase;
    for (char c : str) {
        if (isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~' || c == '*') {
            escaped << c;
        } else if (c == ' ') {
            escaped << '+';
        } else {
            escaped << '%' << setw(2) << (int)(unsigned char)c << setw(0);
        }
    }
    return escaped.str();
}

void urlEncodeInPlace(string& str) { str = urlEncode(str); }

string urlDecode(const string& str) {
    // simplified for brevity
    string res;
    for (size_t i = 0; i < str.length(); ++i) {
        if (str[i] == '%') {
            if (i + 2 < str.length()) {
                int val;
                istringstream is(str.substr(i + 1, 2));
                if (is >> hex >> val) {
                    res += (char)val;
                    i += 2;
                } else {
                    res += '%';
                }
            } else {
                res += '%';
            }
        } else if (str[i] == '+') {
            res += ' ';
        } else {
            res += str[i];
        }
    }
    return res;
}

void urlDecodeInPlace(string& str) { str = urlDecode(str); }


// --- REST OF SHIM ---

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
#define EXPECT_EQUAL(actual, expected) { \\
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
// (Moved to top)

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
        if constexpr (has_toDebugString<T>::value) {
            return ref.toDebugString();
        } else {
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
        int count = 0;
        for (const auto& s : _call_stack) {
            // Check if name matches exactly or starts with name + " ("
            if (s == n || (s.size() > n.size() + 2 && s.substr(0, n.size()) == n && s.substr(n.size(), 2) == " (")) {
                count++;
            }
        }
        name = (count > 0) ? n + " (" + to_string(count + 1) + ")" : n;
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
