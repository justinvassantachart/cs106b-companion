#pragma once
#include "common.h"
#include "vector.h"

// GridLocation must be defined before GridLocationRange
struct GridLocation {
  int row, col;
  GridLocation(int r = 0, int c = 0) : row(r), col(c) {}
  string toString() const {
    return "r" + to_string(row) + "c" + to_string(col);
  }
};
bool operator==(const GridLocation &a, const GridLocation &b) {
  return a.row == b.row && a.col == b.col;
}
ostream &operator<<(ostream &os, const GridLocation &g) {
  os << g.toString();
  return os;
}

// Forward declaration for GridLocationRange
class GridLocationRange {
private:
  int _startRow, _startCol, _endRow, _endCol;
  bool _rowMajor;
  Vector<GridLocation> _locs;
  void _buildLocs() {
    _locs.clear();
    if (_rowMajor) {
      for (int r = _startRow; r <= _endRow; r++) {
        for (int c = _startCol; c <= _endCol; c++) {
          _locs.add(GridLocation(r, c));
        }
      }
    } else {
      for (int c = _startCol; c <= _endCol; c++) {
        for (int r = _startRow; r <= _endRow; r++) {
          _locs.add(GridLocation(r, c));
        }
      }
    }
  }

public:
  GridLocationRange(int startRow, int startCol, int endRow, int endCol,
                    bool rowMajor = true)
      : _startRow(startRow), _startCol(startCol), _endRow(endRow),
        _endCol(endCol), _rowMajor(rowMajor) {
    _buildLocs();
  }
  GridLocationRange()
      : _startRow(0), _startCol(0), _endRow(-1), _endCol(-1), _rowMajor(true) {}
  typename vector<GridLocation>::iterator begin() { return _locs.begin(); }
  typename vector<GridLocation>::iterator end() { return _locs.end(); }
  typename vector<GridLocation>::const_iterator begin() const {
    return _locs.begin();
  }
  typename vector<GridLocation>::const_iterator end() const {
    return _locs.end();
  }
};

template <typename T> class Grid {
private:
  int _r, _c;
  vector<vector<T>> _g;
  void _checkIndexes(int row, int col, const char *prefix) const {
    if (row < 0 || row >= _r || col < 0 || col >= _c) {
      stringstream ss;
      ss << "Grid::" << prefix << ": (" << row << ", " << col
         << ") is outside of valid range [";
      if (_r > 0 && _c > 0) {
        ss << "(0, 0)..(" << (_r - 1) << ", " << (_c - 1) << ")";
      }
      ss << "]";
      error(ss.str());
    }
  }

public:
  Grid() : _r(0), _c(0) {}
  Grid(int r, int c) { resize(r, c); }
  Grid(int r, int c, const T &value) {
    resize(r, c);
    fill(value);
  }
  Grid(std::initializer_list<std::initializer_list<T>> list) {
    _r = list.size();
    _c = (_r > 0) ? list.begin()->size() : 0;
    _g.resize(_r);
    int i = 0;
    for (const auto &row : list) {
      if ((int)row.size() != _c)
        error("Grid::constructor: initializer list is not rectangular");
      _g[i] = row;
      i++;
    }
  }

  void clear() {
    T defaultValue = T();
    for (int r = 0; r < _r; r++) {
      for (int c = 0; c < _c; c++) {
        set(r, c, defaultValue);
      }
    }
  }

  bool equals(const Grid<T> &grid2) const {
    if (this == &grid2)
      return true;
    if (_r != grid2._r || _c != grid2._c)
      return false;
    for (int row = 0; row < _r; row++) {
      for (int col = 0; col < _c; col++) {
        if (get(row, col) != grid2.get(row, col))
          return false;
      }
    }
    return true;
  }

  void fill(const T &value) {
    for (int row = 0; row < _r; row++) {
      for (int col = 0; col < _c; col++) {
        set(row, col, value);
      }
    }
  }

  void resize(int r, int c, bool retain = false) {
    if (r < 0 || c < 0) {
      stringstream ss;
      ss << "Grid::resize: Attempt to resize grid to invalid size (" << r
         << ", " << c << ")";
      error(ss.str());
    }
    if (r == _r && c == _c && retain)
      return;

    vector<vector<T>> oldG = _g;
    int oldR = _r, oldC = _c;
    _r = r;
    _c = c;
    _g.resize(r);
    for (auto &row : _g)
      row.resize(c, T());

    if (retain) {
      int minR = (oldR < r) ? oldR : r;
      int minC = (oldC < c) ? oldC : c;
      for (int row = 0; row < minR; row++) {
        for (int col = 0; col < minC; col++) {
          _g[row][col] = oldG[row][col];
        }
      }
    }
  }

  int numRows() const { return _r; }
  int numCols() const { return _c; }
  bool inBounds(int r, int c) const {
    return r >= 0 && c >= 0 && r < _r && c < _c;
  }
  bool inBounds(const GridLocation &loc) const {
    return inBounds(loc.row, loc.col);
  }
  bool isEmpty() const { return _r == 0 || _c == 0; }

  GridLocationRange locations(bool rowMajor = true) const {
    if (isEmpty())
      return GridLocationRange();
    return GridLocationRange(0, 0, _r - 1, _c - 1, rowMajor);
  }

  void mapAll(std::function<void(const T &)> fn) const {
    for (int i = 0; i < _r; i++) {
      for (int j = 0; j < _c; j++) {
        fn(get(i, j));
      }
    }
  }

  const T &get(int r, int c) const {
    _checkIndexes(r, c, "get");
    return _g.at(r).at(c);
  }
  const T &get(const GridLocation &loc) const { return get(loc.row, loc.col); }

  void set(int r, int c, const T &val) {
    _checkIndexes(r, c, "set");
    _g.at(r).at(c) = val;
  }
  void set(const GridLocation &loc, const T &val) {
    set(loc.row, loc.col, val);
  }

  int size() const { return _r * _c; }

  string toString() const {
    stringstream ss;
    ss << "{";
    for (int i = 0; i < _r; i++) {
      ss << "{";
      for (int j = 0; j < _c; j++)
        ss << _g[i][j] << (j < _c - 1 ? ", " : "");
      ss << "}" << (i < _r - 1 ? ", " : "");
    }
    ss << "}";
    return ss.str();
  }

  string toString2D(string rowStart = "{", string rowEnd = "}",
                    string colSeparator = ", ",
                    string rowSeparator = ",\n ") const {
    stringstream ss;
    ss << rowStart;
    for (int i = 0; i < _r; i++) {
      if (i > 0)
        ss << rowSeparator;
      ss << rowStart;
      for (int j = 0; j < _c; j++) {
        if (j > 0)
          ss << colSeparator;
        ss << _g[i][j];
      }
      ss << rowEnd;
    }
    ss << rowEnd;
    return ss.str();
  }

  string toDebugString() const {
    stringstream ss;
    ss << "{\"__type\": \"Grid\", \"rows\": " << _r << ", \"cols\": " << _c
       << ", \"data\": [";
    for (int i = 0; i < _r; i++) {
      ss << "[";
      for (int j = 0; j < _c; j++)
        ss << _json_val(_g[i][j]) << (j < _c - 1 ? ", " : "");
      ss << "]" << (i < _r - 1 ? ", " : "");
    }
    ss << "]}";
    return ss.str();
  }

  vector<T> &operator[](int r) {
    if (r < 0 || r >= _r)
      error("Grid::operator[]: row index out of range");
    return _g[r];
  }
  const vector<T> &operator[](int r) const {
    if (r < 0 || r >= _r)
      error("Grid::operator[]: row index out of range");
    return _g[r];
  }
  T &operator[](const GridLocation &loc) {
    _checkIndexes(loc.row, loc.col, "operator[]");
    return _g[loc.row][loc.col];
  }
  const T &operator[](const GridLocation &loc) const {
    _checkIndexes(loc.row, loc.col, "operator[]");
    return _g[loc.row][loc.col];
  }

  bool operator==(const Grid<T> &grid2) const { return equals(grid2); }
  bool operator!=(const Grid<T> &grid2) const { return !equals(grid2); }
  bool operator<(const Grid<T> &grid2) const {
    if (_r != grid2._r)
      return _r < grid2._r;
    if (_c != grid2._c)
      return _c < grid2._c;
    for (int i = 0; i < _r; i++) {
      for (int j = 0; j < _c; j++) {
        if (_g[i][j] < grid2._g[i][j])
          return true;
        if (grid2._g[i][j] < _g[i][j])
          return false;
      }
    }
    return false;
  }
  bool operator<=(const Grid<T> &grid2) const {
    return *this < grid2 || *this == grid2;
  }
  bool operator>(const Grid<T> &grid2) const { return grid2 < *this; }
  bool operator>=(const Grid<T> &grid2) const { return grid2 <= *this; }
};

template <typename T> ostream &operator<<(ostream &os, const Grid<T> &g) {
  os << g.toString();
  return os;
}
