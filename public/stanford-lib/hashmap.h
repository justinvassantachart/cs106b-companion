#pragma once
#include "common.h"
#include <unordered_map>
#include <functional>

template <typename KeyType, typename ValueType> class HashMap {
private:
  std::unordered_map<KeyType, ValueType> _map;

public:
  HashMap() {}
  HashMap(std::initializer_list<std::pair<const KeyType, ValueType>> list)
      : _map(list) {}

  int size() const { return _map.size(); }
  bool isEmpty() const { return _map.empty(); }
  void clear() { _map.clear(); }

  void put(const KeyType &key, const ValueType &value) { _map[key] = value; }

  ValueType get(const KeyType &key) const {
    auto it = _map.find(key);
    if (it == _map.end())
      error("HashMap::get: key not found");
    return it->second;
  }

  bool containsKey(const KeyType &key) const {
    return _map.find(key) != _map.end();
  }

  void remove(const KeyType &key) {
    auto it = _map.find(key);
    if (it == _map.end())
      error("HashMap::remove: key not found");
    _map.erase(it);
  }

  Vector<KeyType> keys() const {
    Vector<KeyType> result;
    for (const auto &pair : _map)
      result.add(pair.first);
    return result;
  }

  Vector<ValueType> values() const {
    Vector<ValueType> result;
    for (const auto &pair : _map)
      result.add(pair.second);
    return result;
  }

  bool equals(const HashMap<KeyType, ValueType> &other) const {
    if (size() != other.size())
      return false;
    for (const auto &pair : _map) {
      if (!other.containsKey(pair.first) ||
          other.get(pair.first) != pair.second)
        return false;
    }
    return true;
  }

  void mapAll(std::function<void(const KeyType &, const ValueType &)> fn) const {
    for (const auto &pair : _map)
      fn(pair.first, pair.second);
  }

  ValueType &operator[](const KeyType &key) { return _map[key]; }

  const ValueType &operator[](const KeyType &key) const {
    auto it = _map.find(key);
    if (it == _map.end())
      error("HashMap::operator[]: key not found");
    return it->second;
  }

  bool operator==(const HashMap<KeyType, ValueType> &other) const {
    return equals(other);
  }

  bool operator!=(const HashMap<KeyType, ValueType> &other) const {
    return !equals(other);
  }

  string toString() const {
    stringstream ss;
    ss << "{";
    bool first = true;
    for (const auto &pair : _map) {
      if (!first)
        ss << ", ";
      first = false;
      ss << pair.first << ":" << pair.second;
    }
    ss << "}";
    return ss.str();
  }

  string toDebugString() const {
    stringstream ss;
    ss << "{";
    bool first = true;
    for (const auto &pair : _map) {
      if (!first)
        ss << ", ";
      first = false;
      ss << _json_val(pair.first) << ": " << _json_val(pair.second);
    }
    ss << "}";
    return ss.str();
  }

  typename std::unordered_map<KeyType, ValueType>::iterator begin() {
    return _map.begin();
  }
  typename std::unordered_map<KeyType, ValueType>::iterator end() {
    return _map.end();
  }
  typename std::unordered_map<KeyType, ValueType>::const_iterator
  begin() const {
    return _map.begin();
  }
  typename std::unordered_map<KeyType, ValueType>::const_iterator end() const {
    return _map.end();
  }
};

template <typename KeyType, typename ValueType>
ostream &operator<<(ostream &os, const HashMap<KeyType, ValueType> &map) {
  os << map.toString();
  return os;
}
