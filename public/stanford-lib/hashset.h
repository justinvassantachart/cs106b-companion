#pragma once
#include "common.h"
#include <unordered_set>
#include <functional>

template <typename ValueType> class HashSet {
private:
  std::unordered_set<ValueType> _set;

public:
  HashSet() {}
  HashSet(std::initializer_list<ValueType> list) : _set(list) {}

  int size() const { return _set.size(); }
  bool isEmpty() const { return _set.empty(); }
  void clear() { _set.clear(); }

  void add(const ValueType &value) { _set.insert(value); }

  bool contains(const ValueType &value) const {
    return _set.find(value) != _set.end();
  }

  void remove(const ValueType &value) {
    auto it = _set.find(value);
    if (it == _set.end())
      error("HashSet::remove: value not found");
    _set.erase(it);
  }

  ValueType first() const {
    if (isEmpty())
      error("HashSet::first: set is empty");
    return *_set.begin();
  }

  bool equals(const HashSet<ValueType> &other) const {
    return _set == other._set;
  }

  bool isSubsetOf(const HashSet<ValueType> &other) const {
    for (const auto &elem : _set) {
      if (!other.contains(elem))
        return false;
    }
    return true;
  }

  bool isSupersetOf(const HashSet<ValueType> &other) const {
    return other.isSubsetOf(*this);
  }

  void mapAll(std::function<void(const ValueType &)> fn) const {
    for (const auto &elem : _set)
      fn(elem);
  }

  HashSet<ValueType> operator+(const HashSet<ValueType> &other) const {
    HashSet<ValueType> result = *this;
    for (const auto &elem : other._set)
      result.add(elem);
    return result;
  }

  HashSet<ValueType> operator+(const ValueType &value) const {
    HashSet<ValueType> result = *this;
    result.add(value);
    return result;
  }

  HashSet<ValueType> &operator+=(const HashSet<ValueType> &other) {
    for (const auto &elem : other._set)
      add(elem);
    return *this;
  }

  HashSet<ValueType> &operator+=(const ValueType &value) {
    add(value);
    return *this;
  }

  HashSet<ValueType> operator*(const HashSet<ValueType> &other) const {
    HashSet<ValueType> result;
    for (const auto &elem : _set) {
      if (other.contains(elem))
        result.add(elem);
    }
    return result;
  }

  HashSet<ValueType> operator-(const HashSet<ValueType> &other) const {
    HashSet<ValueType> result;
    for (const auto &elem : _set) {
      if (!other.contains(elem))
        result.add(elem);
    }
    return result;
  }

  HashSet<ValueType> &operator-=(const HashSet<ValueType> &other) {
    for (const auto &elem : other._set) {
      auto it = _set.find(elem);
      if (it != _set.end())
        _set.erase(it);
    }
    return *this;
  }

  bool operator==(const HashSet<ValueType> &other) const {
    return equals(other);
  }

  bool operator!=(const HashSet<ValueType> &other) const {
    return !equals(other);
  }

  string toString() const {
    stringstream ss;
    ss << "{";
    bool first = true;
    for (const auto &elem : _set) {
      if (!first)
        ss << ", ";
      first = false;
      ss << elem;
    }
    ss << "}";
    return ss.str();
  }

  string toDebugString() const {
    stringstream ss;
    ss << "[";
    bool first = true;
    for (const auto &elem : _set) {
      if (!first)
        ss << ", ";
      first = false;
      ss << _json_val(elem);
    }
    ss << "]";
    return ss.str();
  }

  typename std::unordered_set<ValueType>::iterator begin() {
    return _set.begin();
  }
  typename std::unordered_set<ValueType>::iterator end() { return _set.end(); }
  typename std::unordered_set<ValueType>::const_iterator begin() const {
    return _set.begin();
  }
  typename std::unordered_set<ValueType>::const_iterator end() const {
    return _set.end();
  }
};

template <typename ValueType>
ostream &operator<<(ostream &os, const HashSet<ValueType> &set) {
  os << set.toString();
  return os;
}
