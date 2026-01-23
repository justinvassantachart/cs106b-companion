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
#include <functional>

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
    
    void add(const T& val) { _v.push_back(val); }
    void push_back(const T& val) { _v.push_back(val); }
    Vector<T>& addAll(const Vector<T>& v) {
        for(const auto& val : v) add(val);
        return *this;
    }
    void insert(int i, const T& val) { 
        if(i < 0 || i > (int)_v.size()) error("Vector::insert: index out of range");
        _v.insert(_v.begin() + i, val); 
    }
    T remove(int i) { 
        if(i < 0 || i >= (int)_v.size()) error("Vector::remove: index out of range");
        T val = _v[i];
        _v.erase(_v.begin() + i);
        return val;
    }
    
    const T& get(int i) const { 
        if(i < 0 || i >= (int)_v.size()) error("Vector::get: index out of range");
        return _v.at(i); 
    }
    void set(int i, const T& val) { 
        if(i < 0 || i >= (int)_v.size()) error("Vector::set: index out of range");
        _v.at(i) = val; 
    }
    
    bool equals(const Vector<T>& v) const { return _v == v._v; }
    
    void mapAll(std::function<void (const T&)> fn) const {
        for(const auto& elem : _v) fn(elem);
    }
    
    void sort() { std::sort(_v.begin(), _v.end()); }
    
    Vector<T> subList(int start, int length) const {
        if(start < 0 || start > (int)_v.size() || start + length < 0 || start + length > (int)_v.size() || length < 0)
            error("Vector::subList: invalid range");
        Vector<T> result;
        for(int i = start; i < start + length; i++) result.add(_v[i]);
        return result;
    }
    
    Vector<T> subList(int start) const {
        return subList(start, _v.size() - start);
    }
    
    T& operator[](int i) { 
        if(i < 0 || i >= (int)_v.size()) error("Vector::operator[]: index out of range");
        return _v[i]; 
    }
    const T& operator[](int i) const { 
        if(i < 0 || i >= (int)_v.size()) error("Vector::operator[]: index out of range");
        return _v[i]; 
    }
    
    Vector<T> operator+(const Vector<T>& v2) const {
        Vector<T> result = *this;
        return result.addAll(v2);
    }
    
    Vector<T> operator+(const T& elem) const {
        Vector<T> result = *this;
        result.add(elem);
        return result;
    }
    
    Vector<T>& operator+=(const Vector<T>& v2) { return addAll(v2); }
    Vector<T>& operator+=(const T& val) { add(val); return *this; }
    
    Vector<T>& operator,(const T& value) { add(value); return *this; }
    
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
    typename vector<T>::const_iterator begin() const { return _v.begin(); }
    typename vector<T>::const_iterator end() const { return _v.end(); }
    
    bool operator==(const Vector<T>& other) const { return _v == other._v; }
    bool operator!=(const Vector<T>& other) const { return _v != other._v; }
    bool operator<(const Vector<T>& v2) const {
        auto it1 = _v.begin(), it2 = v2._v.begin();
        auto end1 = _v.end(), end2 = v2._v.end();
        while(it1 != end1 && it2 != end2) {
            if(*it1 < *it2) return true;
            if(*it2 < *it1) return false;
            ++it1; ++it2;
        }
        return it1 == end1 && it2 != end2;
    }
    bool operator<=(const Vector<T>& v2) const { return *this < v2 || *this == v2; }
    bool operator>(const Vector<T>& v2) const { return v2 < *this; }
    bool operator>=(const Vector<T>& v2) const { return v2 <= *this; }
};

// GridLocation must be defined before GridLocationRange
struct GridLocation {
    int row, col;
    GridLocation(int r=0, int c=0) : row(r), col(c) {}
    string toString() const {
        return "r" + to_string(row) + "c" + to_string(col);
    }
};
bool operator==(const GridLocation& a, const GridLocation& b) { return a.row == b.row && a.col == b.col; }
ostream& operator<<(ostream& os, const GridLocation& g) { os << g.toString(); return os; }

// Forward declaration for GridLocationRange
class GridLocationRange {
private:
    int _startRow, _startCol, _endRow, _endCol;
    bool _rowMajor;
    Vector<GridLocation> _locs;
    void _buildLocs() {
        _locs.clear();
        if(_rowMajor) {
            for(int r = _startRow; r <= _endRow; r++) {
                for(int c = _startCol; c <= _endCol; c++) {
                    _locs.add(GridLocation(r, c));
                }
            }
        } else {
            for(int c = _startCol; c <= _endCol; c++) {
                for(int r = _startRow; r <= _endRow; r++) {
                    _locs.add(GridLocation(r, c));
                }
            }
        }
    }
public:
    GridLocationRange(int startRow, int startCol, int endRow, int endCol, bool rowMajor = true)
        : _startRow(startRow), _startCol(startCol), _endRow(endRow), _endCol(endCol), _rowMajor(rowMajor) {
        _buildLocs();
    }
    GridLocationRange() : _startRow(0), _startCol(0), _endRow(-1), _endCol(-1), _rowMajor(true) {}
    typename vector<GridLocation>::iterator begin() { return _locs.begin(); }
    typename vector<GridLocation>::iterator end() { return _locs.end(); }
    typename vector<GridLocation>::const_iterator begin() const { return _locs.begin(); }
    typename vector<GridLocation>::const_iterator end() const { return _locs.end(); }
};

template <typename T>
class Grid {
private:
    int _r, _c;
    vector<vector<T>> _g;
    void _checkIndexes(int row, int col, const char* prefix) const {
        if(row < 0 || row >= _r || col < 0 || col >= _c) {
            stringstream ss;
            ss << "Grid::" << prefix << ": (" << row << ", " << col << ") is outside of valid range [";
            if(_r > 0 && _c > 0) {
                ss << "(0, 0)..(" << (_r-1) << ", " << (_c-1) << ")";
            }
            ss << "]";
            error(ss.str());
        }
    }
public:
    Grid() : _r(0), _c(0) {}
    Grid(int r, int c) { resize(r, c); }
    Grid(int r, int c, const T& value) { resize(r, c); fill(value); }
    Grid(std::initializer_list<std::initializer_list<T>> list) {
        _r = list.size(); _c = (_r > 0) ? list.begin()->size() : 0;
        _g.resize(_r); int i = 0;
        for (const auto& row : list) { 
            if((int)row.size() != _c) error("Grid::constructor: initializer list is not rectangular");
            _g[i] = row; i++; 
        }
    }
    
    void clear() {
        T defaultValue = T();
        for(int r = 0; r < _r; r++) {
            for(int c = 0; c < _c; c++) {
                set(r, c, defaultValue);
            }
        }
    }
    
    bool equals(const Grid<T>& grid2) const {
        if(this == &grid2) return true;
        if(_r != grid2._r || _c != grid2._c) return false;
        for(int row = 0; row < _r; row++) {
            for(int col = 0; col < _c; col++) {
                if(get(row, col) != grid2.get(row, col)) return false;
            }
        }
        return true;
    }
    
    void fill(const T& value) {
        for(int row = 0; row < _r; row++) {
            for(int col = 0; col < _c; col++) {
                set(row, col, value);
            }
        }
    }
    
    void resize(int r, int c, bool retain = false) {
        if(r < 0 || c < 0) {
            stringstream ss;
            ss << "Grid::resize: Attempt to resize grid to invalid size (" << r << ", " << c << ")";
            error(ss.str());
        }
        if(r == _r && c == _c && retain) return;
        
        vector<vector<T>> oldG = _g;
        int oldR = _r, oldC = _c;
        _r = r; _c = c;
        _g.resize(r);
        for(auto& row : _g) row.resize(c, T());
        
        if(retain) {
            int minR = (oldR < r) ? oldR : r;
            int minC = (oldC < c) ? oldC : c;
            for(int row = 0; row < minR; row++) {
                for(int col = 0; col < minC; col++) {
                    _g[row][col] = oldG[row][col];
                }
            }
        }
    }
    
    int numRows() const { return _r; }
    int numCols() const { return _c; }
    bool inBounds(int r, int c) const { return r>=0 && c>=0 && r<_r && c<_c; }
    bool inBounds(const GridLocation& loc) const { return inBounds(loc.row, loc.col); }
    bool isEmpty() const { return _r == 0 || _c == 0; }
    
    GridLocationRange locations(bool rowMajor = true) const {
        if(isEmpty()) return GridLocationRange();
        return GridLocationRange(0, 0, _r - 1, _c - 1, rowMajor);
    }
    
    void mapAll(std::function<void (const T&)> fn) const {
        for(int i = 0; i < _r; i++) {
            for(int j = 0; j < _c; j++) {
                fn(get(i, j));
            }
        }
    }
    
    const T& get(int r, int c) const { 
        _checkIndexes(r, c, "get");
        return _g.at(r).at(c); 
    }
    const T& get(const GridLocation& loc) const { return get(loc.row, loc.col); }
    
    void set(int r, int c, const T& val) { 
        _checkIndexes(r, c, "set");
        _g.at(r).at(c) = val; 
    }
    void set(const GridLocation& loc, const T& val) { set(loc.row, loc.col, val); }
    
    int size() const { return _r * _c; }
    
    string toString() const {
        stringstream ss; ss << "{";
        for(int i=0; i<_r; i++) {
            ss << "{";
            for(int j=0; j<_c; j++) ss << _g[i][j] << (j<_c-1?", ":"");
            ss << "}" << (i<_r-1?", ":"");
        }
        ss << "}"; return ss.str();
    }
    
    string toString2D(string rowStart = "{", string rowEnd = "}", 
                     string colSeparator = ", ", string rowSeparator = ",\\n ") const {
        stringstream ss;
        ss << rowStart;
        for(int i = 0; i < _r; i++) {
            if(i > 0) ss << rowSeparator;
            ss << rowStart;
            for(int j = 0; j < _c; j++) {
                if(j > 0) ss << colSeparator;
                ss << _g[i][j];
            }
            ss << rowEnd;
        }
        ss << rowEnd;
        return ss.str();
    }
    
    string toDebugString() const {
        stringstream ss; 
        ss << "{\\\"__type\\\": \\\"Grid\\\", \\\"rows\\\": " << _r << ", \\\"cols\\\": " << _c << ", \\\"data\\\": [";
        for(int i=0; i<_r; i++) {
            ss << "[";
            for(int j=0; j<_c; j++) ss << _json_val(_g[i][j]) << (j<_c-1?", ":"");
            ss << "]" << (i<_r-1?", ":"");
        }
        ss << "]}"; return ss.str();
    }
    
    vector<T>& operator[](int r) { 
        if(r < 0 || r >= _r) error("Grid::operator[]: row index out of range");
        return _g[r]; 
    }
    const vector<T>& operator[](int r) const { 
        if(r < 0 || r >= _r) error("Grid::operator[]: row index out of range");
        return _g[r]; 
    }
    T& operator[](const GridLocation& loc) {
        _checkIndexes(loc.row, loc.col, "operator[]");
        return _g[loc.row][loc.col];
    }
    const T& operator[](const GridLocation& loc) const {
        _checkIndexes(loc.row, loc.col, "operator[]");
        return _g[loc.row][loc.col];
    }
    
    bool operator==(const Grid<T>& grid2) const { return equals(grid2); }
    bool operator!=(const Grid<T>& grid2) const { return !equals(grid2); }
    bool operator<(const Grid<T>& grid2) const {
        if(_r != grid2._r) return _r < grid2._r;
        if(_c != grid2._c) return _c < grid2._c;
        for(int i = 0; i < _r; i++) {
            for(int j = 0; j < _c; j++) {
                if(_g[i][j] < grid2._g[i][j]) return true;
                if(grid2._g[i][j] < _g[i][j]) return false;
            }
        }
        return false;
    }
    bool operator<=(const Grid<T>& grid2) const { return *this < grid2 || *this == grid2; }
    bool operator>(const Grid<T>& grid2) const { return grid2 < *this; }
    bool operator>=(const Grid<T>& grid2) const { return grid2 <= *this; }
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
    void add(const T& val) { _s.insert(val); }
    bool contains(const T& val) const { return _s.find(val) != _s.end(); }
    void remove(const T& val) { _s.erase(val); }
    
    bool equals(const Set<T>& set2) const {
        if(this == &set2) return true;
        if(_s.size() != set2._s.size()) return false;
        auto it1 = _s.begin(), it2 = set2._s.begin();
        while(it1 != _s.end() && it2 != set2._s.end()) {
            if(*it1 != *it2) return false;
            ++it1; ++it2;
        }
        return true;
    }
    
    T first() const {
        if(isEmpty()) error("Set::first: set is empty");
        return *_s.begin();
    }
    
    T last() const {
        if(isEmpty()) error("Set::last: set is empty");
        return *_s.rbegin();
    }
    
    void mapAll(std::function<void (const T&)> fn) const {
        for(const auto& elem : _s) fn(elem);
    }
    
    Set<T>& difference(const Set<T>& set2) {
        for(const auto& val : set2._s) {
            _s.erase(val);
        }
        return *this;
    }
    
    Set<T>& intersect(const Set<T>& set2) {
        Set<T> result;
        for(const auto& val : _s) {
            if(set2.contains(val)) result.add(val);
        }
        _s = result._s;
        return *this;
    }
    
    Set<T>& unionWith(const Set<T>& set2) {
        for(const auto& val : set2._s) {
            add(val);
        }
        return *this;
    }
    
    bool isSubsetOf(const Set<T>& set2) const {
        for(const auto& val : _s) {
            if(!set2.contains(val)) return false;
        }
        return true;
    }
    
    bool isSupersetOf(const Set<T>& set2) const {
        return set2.isSubsetOf(*this);
    }
    
    Set<T> operator+(const Set<T>& set2) const {
        Set<T> result = *this;
        return result.unionWith(set2);
    }
    
    Set<T> operator+(const T& element) const {
        Set<T> result = *this;
        result.add(element);
        return result;
    }
    
    Set<T> operator*(const Set<T>& set2) const {
        Set<T> result = *this;
        return result.intersect(set2);
    }
    
    Set<T> operator-(const Set<T>& set2) const {
        Set<T> result = *this;
        return result.difference(set2);
    }
    
    Set<T> operator-(const T& element) const {
        Set<T> result = *this;
        result.remove(element);
        return result;
    }
    
    Set<T>& operator+=(const Set<T>& set2) { return unionWith(set2); }
    Set<T>& operator+=(const T& val) { add(val); return *this; }
    
    Set<T>& operator*=(const Set<T>& set2) { return intersect(set2); }
    
    Set<T>& operator-=(const Set<T>& set2) { return difference(set2); }
    Set<T>& operator-=(const T& val) { remove(val); return *this; }
    
    Set<T>& operator,(const T& value) { add(value); return *this; }
    
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
    
    typename set<T>::iterator begin() { return _s.begin(); }
    typename set<T>::iterator end() { return _s.end(); }
    typename set<T>::const_iterator begin() const { return _s.begin(); }
    typename set<T>::const_iterator end() const { return _s.end(); }
    
    bool operator==(const Set<T>& set2) const { return equals(set2); }
    bool operator!=(const Set<T>& set2) const { return !equals(set2); }
    bool operator<(const Set<T>& set2) const {
        auto it1 = _s.begin(), it2 = set2._s.begin();
        auto end1 = _s.end(), end2 = set2._s.end();
        while(it1 != end1 && it2 != end2) {
            if(*it1 < *it2) return true;
            if(*it2 < *it1) return false;
            ++it1; ++it2;
        }
        return it1 == end1 && it2 != end2;
    }
    bool operator<=(const Set<T>& set2) const { return *this < set2 || *this == set2; }
    bool operator>(const Set<T>& set2) const { return set2 < *this; }
    bool operator>=(const Set<T>& set2) const { return set2 <= *this; }
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
    void put(const K& k, const V& v) { _m[k] = v; }
    bool containsKey(const K& k) const { return _m.find(k) != _m.end(); }
    V get(const K& k) const { 
        auto it = _m.find(k);
        return (it == _m.end()) ? V() : it->second; 
    }
    void remove(const K& k) { _m.erase(k); }
    
    bool equals(const Map<K, V>& map2) const {
        if(this == &map2) return true;
        if(_m.size() != map2._m.size()) return false;
        for(const auto& [key, val] : _m) {
            if(!map2.containsKey(key) || map2.get(key) != val) return false;
        }
        return true;
    }
    
    K firstKey() const {
        if(isEmpty()) error("Map::firstKey: map is empty");
        return _m.begin()->first;
    }
    
    K lastKey() const {
        if(isEmpty()) error("Map::lastKey: map is empty");
        return _m.rbegin()->first;
    }
    
    Vector<K> keys() const {
        Vector<K> result;
        for(const auto& [key, val] : _m) {
            result.add(key);
        }
        return result;
    }
    
    Vector<V> values() const {
        Vector<V> result;
        for(const auto& [key, val] : _m) {
            result.add(val);
        }
        return result;
    }
    
    void mapAll(std::function<void (const K&, const V&)> fn) const {
        for(const auto& [key, val] : _m) {
            fn(key, val);
        }
    }
    
    Map<K, V>& putAll(const Map<K, V>& map2) {
        for(const auto& [key, val] : map2._m) {
            put(key, val);
        }
        return *this;
    }
    
    Map<K, V>& removeAll(const Map<K, V>& map2) {
        for(const auto& [key, val] : map2._m) {
            if(containsKey(key) && get(key) == val) {
                remove(key);
            }
        }
        return *this;
    }
    
    Map<K, V>& retainAll(const Map<K, V>& map2) {
        Vector<K> toRemove;
        for(const auto& [key, val] : _m) {
            if(!map2.containsKey(key) || map2.get(key) != val) {
                toRemove.add(key);
            }
        }
        for(const K& key : toRemove) {
            remove(key);
        }
        return *this;
    }
    
    V& operator[](const K& k) { return _m[k]; }
    const V& operator[](const K& k) const {
        auto it = _m.find(k);
        if(it != _m.end()) return it->second;
        static const V singleton{};
        return singleton;
    }
    
    Map<K, V> operator+(const Map<K, V>& map2) const {
        Map<K, V> result = *this;
        return result.putAll(map2);
    }
    
    Map<K, V> operator-(const Map<K, V>& map2) const {
        Map<K, V> result = *this;
        return result.removeAll(map2);
    }
    
    Map<K, V> operator*(const Map<K, V>& map2) const {
        Map<K, V> result = *this;
        return result.retainAll(map2);
    }
    
    Map<K, V>& operator+=(const Map<K, V>& map2) { return putAll(map2); }
    Map<K, V>& operator-=(const Map<K, V>& map2) { return removeAll(map2); }
    Map<K, V>& operator*=(const Map<K, V>& map2) { return retainAll(map2); }
    
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
    
    typename map<K, V>::iterator begin() { return _m.begin(); }
    typename map<K, V>::iterator end() { return _m.end(); }
    typename map<K, V>::const_iterator begin() const { return _m.begin(); }
    typename map<K, V>::const_iterator end() const { return _m.end(); }
    
    bool operator==(const Map<K, V>& map2) const { return equals(map2); }
    bool operator!=(const Map<K, V>& map2) const { return !equals(map2); }
    bool operator<(const Map<K, V>& map2) const {
        auto it1 = _m.begin(), it2 = map2._m.begin();
        auto end1 = _m.end(), end2 = map2._m.end();
        while(it1 != end1 && it2 != end2) {
            if(it1->first < it2->first) return true;
            if(it2->first < it1->first) return false;
            if(it1->second < it2->second) return true;
            if(it2->second < it1->second) return false;
            ++it1; ++it2;
        }
        return it1 == end1 && it2 != end2;
    }
    bool operator<=(const Map<K, V>& map2) const { return *this < map2 || *this == map2; }
    bool operator>(const Map<K, V>& map2) const { return map2 < *this; }
    bool operator>=(const Map<K, V>& map2) const { return map2 <= *this; }
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
    void push(const T& val) { _v.push_back(val); }
    T pop() { 
        if(isEmpty()) error("Stack::pop: Attempting to pop an empty stack");
        T val = _v.back(); 
        _v.pop_back(); 
        return val; 
    }
    const T& peek() const { 
        if(isEmpty()) error("Stack::peek: Attempting to peek at an empty stack");
        return _v.back(); 
    }
    
    bool equals(const Stack<T>& stack2) const {
        return _v == stack2._v;
    }
    
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
    typename vector<T>::const_iterator begin() const { return _v.begin(); }
    typename vector<T>::const_iterator end() const { return _v.end(); }
    
    bool operator==(const Stack<T>& stack2) const { return _v == stack2._v; }
    bool operator!=(const Stack<T>& stack2) const { return _v != stack2._v; }
    bool operator<(const Stack<T>& stack2) const { return _v < stack2._v; }
    bool operator<=(const Stack<T>& stack2) const { return _v <= stack2._v; }
    bool operator>(const Stack<T>& stack2) const { return _v > stack2._v; }
    bool operator>=(const Stack<T>& stack2) const { return _v >= stack2._v; }
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
    void enqueue(const T& val) { _q.push_back(val); }
    T dequeue() { 
        if(isEmpty()) error("Queue::dequeue: Attempting to dequeue an empty queue");
        T val = _q.front(); 
        _q.pop_front(); 
        return val; 
    }
    const T& peek() const { 
        if(isEmpty()) error("Queue::peek: Attempting to peek at an empty queue");
        return _q.front(); 
    }
    
    bool equals(const Queue<T>& queue2) const {
        return _q == queue2._q;
    }
    
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
    
    typename deque<T>::iterator begin() { return _q.begin(); }
    typename deque<T>::iterator end() { return _q.end(); }
    typename deque<T>::const_iterator begin() const { return _q.begin(); }
    typename deque<T>::const_iterator end() const { return _q.end(); }
    
    bool operator==(const Queue<T>& queue2) const { return _q == queue2._q; }
    bool operator!=(const Queue<T>& queue2) const { return _q != queue2._q; }
    bool operator<(const Queue<T>& queue2) const { return _q < queue2._q; }
    bool operator<=(const Queue<T>& queue2) const { return _q <= queue2._q; }
    bool operator>(const Queue<T>& queue2) const { return _q > queue2._q; }
    bool operator>=(const Queue<T>& queue2) const { return _q >= queue2._q; }
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
// GridLocation is now defined earlier, before GridLocationRange

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
    void _debug_update_line(int line);
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
template <typename T>
void _debug_loop_step(int line, const char* name, const T& val) {
    Tracer<T> t(name, val);
    _debug_dump_vars();
    _debug_wait(line);
}
#define DEBUG_STEP(line) (_debug_dump_vars(), _debug_wait(line))
#define DBG_TRACK(name, val) Tracer _dbg_##name(#name, val)
#define DBG_FUNC(name) FuncTracker _dbg_func_##name(#name)
`;
