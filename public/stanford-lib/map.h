#pragma once
#include "common.h"
#include "vector.h"

template <typename K, typename V> class Map {
private:
  map<K, V> _m;

public:
  Map() {}
  Map(std::initializer_list<std::pair<K, V>> list) {
    for (const auto &p : list)
      _m[p.first] = p.second;
  }
  int size() const { return _m.size(); }
  bool isEmpty() const { return _m.empty(); }
  void clear() { _m.clear(); }
  void put(const K &k, const V &v) { _m[k] = v; }
  bool containsKey(const K &k) const { return _m.find(k) != _m.end(); }
  V get(const K &k) const {
    auto it = _m.find(k);
    return (it == _m.end()) ? V() : it->second;
  }
  void remove(const K &k) { _m.erase(k); }

  bool equals(const Map<K, V> &map2) const {
    if (this == &map2)
      return true;
    if (_m.size() != map2._m.size())
      return false;
    for (const auto &[key, val] : _m) {
      if (!map2.containsKey(key) || map2.get(key) != val)
        return false;
    }
    return true;
  }

  K firstKey() const {
    if (isEmpty())
      error("Map::firstKey: map is empty");
    return _m.begin()->first;
  }

  K lastKey() const {
    if (isEmpty())
      error("Map::lastKey: map is empty");
    return _m.rbegin()->first;
  }

  Vector<K> keys() const {
    Vector<K> result;
    for (const auto &[key, val] : _m) {
      result.add(key);
    }
    return result;
  }

  Vector<V> values() const {
    Vector<V> result;
    for (const auto &[key, val] : _m) {
      result.add(val);
    }
    return result;
  }

  void mapAll(std::function<void(const K &, const V &)> fn) const {
    for (const auto &[key, val] : _m) {
      fn(key, val);
    }
  }

  Map<K, V> &putAll(const Map<K, V> &map2) {
    for (const auto &[key, val] : map2._m) {
      put(key, val);
    }
    return *this;
  }

  Map<K, V> &removeAll(const Map<K, V> &map2) {
    for (const auto &[key, val] : map2._m) {
      if (containsKey(key) && get(key) == val) {
        remove(key);
      }
    }
    return *this;
  }

  Map<K, V> &retainAll(const Map<K, V> &map2) {
    Vector<K> toRemove;
    for (const auto &[key, val] : _m) {
      if (!map2.containsKey(key) || map2.get(key) != val) {
        toRemove.add(key);
      }
    }
    for (const K &key : toRemove) {
      remove(key);
    }
    return *this;
  }

  V &operator[](const K &k) { return _m[k]; }
  const V &operator[](const K &k) const {
    auto it = _m.find(k);
    if (it != _m.end())
      return it->second;
    static const V singleton{};
    return singleton;
  }

  Map<K, V> operator+(const Map<K, V> &map2) const {
    Map<K, V> result = *this;
    return result.putAll(map2);
  }

  Map<K, V> operator-(const Map<K, V> &map2) const {
    Map<K, V> result = *this;
    return result.removeAll(map2);
  }

  Map<K, V> operator*(const Map<K, V> &map2) const {
    Map<K, V> result = *this;
    return result.retainAll(map2);
  }

  Map<K, V> &operator+=(const Map<K, V> &map2) { return putAll(map2); }
  Map<K, V> &operator-=(const Map<K, V> &map2) { return removeAll(map2); }
  Map<K, V> &operator*=(const Map<K, V> &map2) { return retainAll(map2); }

  string toString() const {
    stringstream ss;
    ss << "{";
    int i = 0;
    for (auto const &[key, val] : _m) {
      ss << key << ":" << val;
      if (i < _m.size() - 1)
        ss << ", ";
      i++;
    }
    ss << "}";
    return ss.str();
  }
  string toDebugString() const {
    stringstream ss;
    ss << "{";
    int i = 0;
    for (auto const &[key, val] : _m) {
      ss << "\"" << key << "\": " << _json_val(val);
      if (i < _m.size() - 1)
        ss << ", ";
      i++;
    }
    ss << "}";
    return ss.str();
  }

  typename map<K, V>::iterator begin() { return _m.begin(); }
  typename map<K, V>::iterator end() { return _m.end(); }
  typename map<K, V>::const_iterator begin() const { return _m.begin(); }
  typename map<K, V>::const_iterator end() const { return _m.end(); }

  bool operator==(const Map<K, V> &map2) const { return equals(map2); }
  bool operator!=(const Map<K, V> &map2) const { return !equals(map2); }
  bool operator<(const Map<K, V> &map2) const {
    auto it1 = _m.begin(), it2 = map2._m.begin();
    auto end1 = _m.end(), end2 = map2._m.end();
    while (it1 != end1 && it2 != end2) {
      if (it1->first < it2->first)
        return true;
      if (it2->first < it1->first)
        return false;
      if (it1->second < it2->second)
        return true;
      if (it2->second < it1->second)
        return false;
      ++it1;
      ++it2;
    }
    return it1 == end1 && it2 != end2;
  }
  bool operator<=(const Map<K, V> &map2) const {
    return *this < map2 || *this == map2;
  }
  bool operator>(const Map<K, V> &map2) const { return map2 < *this; }
  bool operator>=(const Map<K, V> &map2) const { return map2 <= *this; }
};

template <typename K, typename V>
ostream &operator<<(ostream &os, const Map<K, V> &m) {
  os << m.toString();
  return os;
}
