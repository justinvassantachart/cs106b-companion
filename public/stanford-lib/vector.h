#pragma once
#include "common.h"

template <typename T> class Vector {
private:
  vector<T> _v;

public:
  Vector() {}
  Vector(int n, T val) : _v(n, val) {}
  Vector(std::initializer_list<T> list) : _v(list) {}

  int size() const { return _v.size(); }
  bool isEmpty() const { return _v.empty(); }
  void clear() { _v.clear(); }

  void add(const T &val) { _v.push_back(val); }
  void push_back(const T &val) { _v.push_back(val); }
  Vector<T> &addAll(const Vector<T> &v) {
    for (const auto &val : v)
      add(val);
    return *this;
  }
  void insert(int i, const T &val) {
    if (i < 0 || i > (int)_v.size())
      error("Vector::insert: index out of range");
    _v.insert(_v.begin() + i, val);
  }
  T remove(int i) {
    if (i < 0 || i >= (int)_v.size())
      error("Vector::remove: index out of range");
    T val = _v[i];
    _v.erase(_v.begin() + i);
    return val;
  }

  const T &get(int i) const {
    if (i < 0 || i >= (int)_v.size())
      error("Vector::get: index out of range");
    return _v.at(i);
  }
  void set(int i, const T &val) {
    if (i < 0 || i >= (int)_v.size())
      error("Vector::set: index out of range");
    _v.at(i) = val;
  }

  bool equals(const Vector<T> &v) const { return _v == v._v; }

  void mapAll(std::function<void(const T &)> fn) const {
    for (const auto &elem : _v)
      fn(elem);
  }

  void sort() { std::sort(_v.begin(), _v.end()); }

  Vector<T> subList(int start, int length) const {
    if (start < 0 || start > (int)_v.size() || start + length < 0 ||
        start + length > (int)_v.size() || length < 0)
      error("Vector::subList: invalid range");
    Vector<T> result;
    for (int i = start; i < start + length; i++)
      result.add(_v[i]);
    return result;
  }

  Vector<T> subList(int start) const {
    return subList(start, _v.size() - start);
  }

  T &operator[](int i) {
    if (i < 0 || i >= (int)_v.size())
      error("Vector::operator[]: index out of range");
    return _v[i];
  }
  const T &operator[](int i) const {
    if (i < 0 || i >= (int)_v.size())
      error("Vector::operator[]: index out of range");
    return _v[i];
  }

  Vector<T> operator+(const Vector<T> &v2) const {
    Vector<T> result = *this;
    return result.addAll(v2);
  }

  Vector<T> operator+(const T &elem) const {
    Vector<T> result = *this;
    result.add(elem);
    return result;
  }

  Vector<T> &operator+=(const Vector<T> &v2) { return addAll(v2); }
  Vector<T> &operator+=(const T &val) {
    add(val);
    return *this;
  }

  Vector<T> &operator,(const T &value) {
    add(value);
    return *this;
  }

  string toString() const {
    stringstream ss;
    ss << "{";
    for (size_t i = 0; i < _v.size(); i++)
      ss << _v[i] << (i < _v.size() - 1 ? ", " : "");
    ss << "}";
    return ss.str();
  }
  string toDebugString() const {
    stringstream ss;
    ss << "[";
    for (size_t i = 0; i < _v.size(); i++)
      ss << _json_val(_v[i]) << (i < _v.size() - 1 ? ", " : "");
    ss << "]";
    return ss.str();
  }

  typename vector<T>::iterator begin() { return _v.begin(); }
  typename vector<T>::iterator end() { return _v.end(); }
  typename vector<T>::const_iterator begin() const { return _v.begin(); }
  typename vector<T>::const_iterator end() const { return _v.end(); }

  bool operator==(const Vector<T> &other) const { return _v == other._v; }
  bool operator!=(const Vector<T> &other) const { return _v != other._v; }
  bool operator<(const Vector<T> &v2) const {
    auto it1 = _v.begin(), it2 = v2._v.begin();
    auto end1 = _v.end(), end2 = v2._v.end();
    while (it1 != end1 && it2 != end2) {
      if (*it1 < *it2)
        return true;
      if (*it2 < *it1)
        return false;
      ++it1;
      ++it2;
    }
    return it1 == end1 && it2 != end2;
  }
  bool operator<=(const Vector<T> &v2) const {
    return *this < v2 || *this == v2;
  }
  bool operator>(const Vector<T> &v2) const { return v2 < *this; }
  bool operator>=(const Vector<T> &v2) const { return v2 <= *this; }
};

template <typename T> ostream &operator<<(ostream &os, const Vector<T> &v) {
  os << v.toString();
  return os;
}
