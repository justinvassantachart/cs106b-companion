#include "stanford.h"

struct Node {
  int val;
  Node *next;
};

int notSoHelpfulHelper() {
  int *p = new int(42);
  // p goes out of scope, but heap object should persist in the visualizer as a
  // memory leak
  return 1;
}

int main() {
  notSoHelpfulHelper();

  Node *list = new Node;
  list->val = 1;
  list->next = new Node;
  list->next->val = 2;
  list->next->next = nullptr;

  cout << "Check Heap Visualization" << endl;

  return 0;
}
