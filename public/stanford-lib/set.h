#pragma once
#include "common.h"

template <typename T> class Set {
private:
  set<T> _s;

public:
  Set() {}
  Set(std::initializer_list<T> list) {
    for (const auto &item : list)
      add(item);
  }
  int size() const { return _s.size(); }
  bool isEmpty() const { return _s.empty(); }
  void clear() { _s.clear(); }
  void add(const T &val) { _s.insert(val); }
  bool contains(const T &val) const { return _s.find(val) != _s.end(); }
  void remove(const T &val) { _s.erase(val); }

  bool equals(const Set<T> &set2) const {
    if (this == &set2)
      return true;
    if (_s.size() != set2._s.size())
      return false;
    auto it1 = _s.begin(), it2 = set2._s.begin();
    while (it1 != _s.end() && it2 != set2._s.end()) {
      if (*it1 != *it2)
        return false;
      ++it1;
      ++it2;
    }
    return true;
  }

  T first() const {
    if (isEmpty())
      error("Set::first: set is empty");
    return *_s.begin();
  }

  T last() const {
    if (isEmpty())
      error("Set::last: set is empty");
    return *_s.rbegin();
  }

  void mapAll(std::function<void(const T &)> fn) const {
    for (const auto &elem : _s)
      fn(elem);
  }

  Set<T> &difference(const Set<T> &set2) {
    for (const auto &val : set2._s) {
      _s.erase(val);
    }
    return *this;
  }

  Set<T> &intersect(const Set<T> &set2) {
    Set<T> result;
    for (const auto &val : _s) {
      if (set2.contains(val))
        result.add(val);
    }
    _s = result._s;
    return *this;
  }

  Set<T> &unionWith(const Set<T> &set2) {
    for (const auto &val : set2._s) {
      add(val);
    }
    return *this;
  }

  bool isSubsetOf(const Set<T> &set2) const {
    for (const auto &val : _s) {
      if (!set2.contains(val))
        return false;
    }
    return true;
  }

  bool isSupersetOf(const Set<T> &set2) const { return set2.isSubsetOf(*this); }

  Set<T> operator+(const Set<T> &set2) const {
    Set<T> result = *this;
    return result.unionWith(set2);
  }

  Set<T> operator+(const T &element) const {
    Set<T> result = *this;
    result.add(element);
    return result;
  }

  Set<T> operator*(const Set<T> &set2) const {
    Set<T> result = *this;
    return result.intersect(set2);
  }

  Set<T> operator-(const Set<T> &set2) const {
    Set<T> result = *this;
    return result.difference(set2);
  }

  Set<T> operator-(const T &element) const {
    Set<T> result = *this;
    result.remove(element);
    return result;
  }

  Set<T> &operator+=(const Set<T> &set2) { return unionWith(set2); }
  Set<T> &operator+=(const T &val) {
    add(val);
    return *this;
  }

  Set<T> &operator*=(const Set<T> &set2) { return intersect(set2); }

  Set<T> &operator-=(const Set<T> &set2) { return difference(set2); }
  Set<T> &operator-=(const T &val) {
    remove(val);
    return *this;
  }

  Set<T> &operator,(const T &value) {
    add(value);
    return *this;
  }

  string toString() const {
    stringstream ss;
    ss << "{";
    int i = 0;
    for (const auto &val : _s) {
      ss << val << (i < _s.size() - 1 ? ", " : "");
      i++;
    }
    ss << "}";
    return ss.str();
  }
  string toDebugString() const {
    stringstream ss;
    ss << "[";
    int i = 0;
    for (const auto &val : _s) {
      ss << _json_val(val) << (i < _s.size() - 1 ? ", " : "");
      i++;
    }
    ss << "]";
    return ss.str();
  }

  typename set<T>::iterator begin() { return _s.begin(); }
  typename set<T>::iterator end() { return _s.end(); }
  typename set<T>::const_iterator begin() const { return _s.begin(); }
  typename set<T>::const_iterator end() const { return _s.end(); }

  bool operator==(const Set<T> &set2) const { return equals(set2); }
  bool operator!=(const Set<T> &set2) const { return !equals(set2); }
  bool operator<(const Set<T> &set2) const {
    auto it1 = _s.begin(), it2 = set2._s.begin();
    auto end1 = _s.end(), end2 = set2._s.end();
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
  bool operator<=(const Set<T> &set2) const {
    return *this < set2 || *this == set2;
  }
  bool operator>(const Set<T> &set2) const { return set2 < *this; }
  bool operator>=(const Set<T> &set2) const { return set2 <= *this; }
};

template <typename T> ostream &operator<<(ostream &os, const Set<T> &s) {
  os << s.toString();
  return os;
}
