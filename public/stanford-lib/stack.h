#pragma once
#include "common.h"

template <typename T> class Stack {
private:
  vector<T> _v;

public:
  Stack() {}
  Stack(std::initializer_list<T> list) : _v(list) {}
  int size() const { return _v.size(); }
  bool isEmpty() const { return _v.empty(); }
  void clear() { _v.clear(); }
  void push(const T &val) { _v.push_back(val); }
  T pop() {
    if (isEmpty())
      error("Stack::pop: Attempting to pop an empty stack");
    T val = _v.back();
    _v.pop_back();
    return val;
  }
  const T &peek() const {
    if (isEmpty())
      error("Stack::peek: Attempting to peek at an empty stack");
    return _v.back();
  }

  bool equals(const Stack<T> &stack2) const { return _v == stack2._v; }

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

  bool operator==(const Stack<T> &stack2) const { return _v == stack2._v; }
  bool operator!=(const Stack<T> &stack2) const { return _v != stack2._v; }
  bool operator<(const Stack<T> &stack2) const { return _v < stack2._v; }
  bool operator<=(const Stack<T> &stack2) const { return _v <= stack2._v; }
  bool operator>(const Stack<T> &stack2) const { return _v > stack2._v; }
  bool operator>=(const Stack<T> &stack2) const { return _v >= stack2._v; }
};

template <typename T> ostream &operator<<(ostream &os, const Stack<T> &s) {
  os << s.toString();
  return os;
}
