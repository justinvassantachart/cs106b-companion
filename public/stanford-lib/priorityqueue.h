#pragma once
#include "common.h"
#include <queue>
#include <vector>
#include <functional>

template <typename ValueType> class PriorityQueue {
private:
  // Internal struct to hold value with priority
  struct PQEntry {
    ValueType value;
    double priority;

    // Min-heap: lower priority = higher precedence
    bool operator>(const PQEntry &other) const {
      return priority > other.priority;
    }
  };

  std::priority_queue<PQEntry, std::vector<PQEntry>, std::greater<PQEntry>> _pq;
  int _size = 0;

public:
  PriorityQueue() {}

  int size() const { return _size; }
  bool isEmpty() const { return _size == 0; }

  void clear() {
    while (!_pq.empty())
      _pq.pop();
    _size = 0;
  }

  void enqueue(const ValueType &value, double priority) {
    _pq.push({value, priority});
    _size++;
  }

  ValueType dequeue() {
    if (isEmpty())
      error("PriorityQueue::dequeue: queue is empty");
    ValueType value = _pq.top().value;
    _pq.pop();
    _size--;
    return value;
  }

  ValueType peek() const {
    if (isEmpty())
      error("PriorityQueue::peek: queue is empty");
    return _pq.top().value;
  }

  double peekPriority() const {
    if (isEmpty())
      error("PriorityQueue::peekPriority: queue is empty");
    return _pq.top().priority;
  }

  void changePriority(const ValueType &value, double newPriority) {
    // Rebuild the queue - inefficient but correct
    std::vector<PQEntry> entries;
    bool found = false;
    while (!_pq.empty()) {
      PQEntry entry = _pq.top();
      _pq.pop();
      if (!found && entry.value == value) {
        entry.priority = newPriority;
        found = true;
      }
      entries.push_back(entry);
    }
    if (!found)
      error("PriorityQueue::changePriority: value not found");
    for (const auto &entry : entries)
      _pq.push(entry);
  }

  string toString() const {
    // Note: can't iterate std::priority_queue directly without copying
    return "{PriorityQueue of size " + std::to_string(_size) + "}";
  }

  string toDebugString() const {
    return "\"PriorityQueue[" + std::to_string(_size) + "]\"";
  }

  bool operator==(const PriorityQueue<ValueType> &other) const {
    return _size == other._size; // Simplified comparison
  }

  bool operator!=(const PriorityQueue<ValueType> &other) const {
    return !(*this == other);
  }
};

template <typename ValueType>
ostream &operator<<(ostream &os, const PriorityQueue<ValueType> &pq) {
  os << pq.toString();
  return os;
}
