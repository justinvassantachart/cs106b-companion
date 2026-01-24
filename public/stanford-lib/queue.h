#pragma once
#include "common.h"

template <typename T> class Queue {
private:
  deque<T> _q;

public:
  Queue() {}
  Queue(std::initializer_list<T> list) : _q(list) {}
  int size() const { return _q.size(); }
  bool isEmpty() const { return _q.empty(); }
  void clear() { _q.clear(); }
  void enqueue(const T &val) { _q.push_back(val); }
  T dequeue() {
    if (isEmpty())
      error("Queue::dequeue: Attempting to dequeue an empty queue");
    T val = _q.front();
    _q.pop_front();
    return val;
  }
  const T &peek() const {
    if (isEmpty())
      error("Queue::peek: Attempting to peek at an empty queue");
    return _q.front();
  }

  bool equals(const Queue<T> &queue2) const { return _q == queue2._q; }

  string toString() const {
    stringstream ss;
    ss << "{";
    for (size_t i = 0; i < _q.size(); i++)
      ss << _q[i] << (i < _q.size() - 1 ? ", " : "");
    ss << "}";
    return ss.str();
  }
  string toDebugString() const {
    stringstream ss;
    ss << "[";
    for (size_t i = 0; i < _q.size(); i++)
      ss << _json_val(_q[i]) << (i < _q.size() - 1 ? ", " : "");
    ss << "]";
    return ss.str();
  }

  typename deque<T>::iterator begin() { return _q.begin(); }
  typename deque<T>::iterator end() { return _q.end(); }
  typename deque<T>::const_iterator begin() const { return _q.begin(); }
  typename deque<T>::const_iterator end() const { return _q.end(); }

  bool operator==(const Queue<T> &queue2) const { return _q == queue2._q; }
  bool operator!=(const Queue<T> &queue2) const { return _q != queue2._q; }
  bool operator<(const Queue<T> &queue2) const { return _q < queue2._q; }
  bool operator<=(const Queue<T> &queue2) const { return _q <= queue2._q; }
  bool operator>(const Queue<T> &queue2) const { return _q > queue2._q; }
  bool operator>=(const Queue<T> &queue2) const { return _q >= queue2._q; }
};

template <typename T> ostream &operator<<(ostream &os, const Queue<T> &q) {
  os << q.toString();
  return os;
}
