#include "stanford.h"

void function1(int n) {
  for (int i = 0; i < n; i++) {
    cout << '*' << endl;
  }
}

void function2(int n) {
  for (int i = 0; i < n; i++) {
    for (int j = 0; j < n; j++) {
      cout << '*' << endl;
    }
  }
}

void function3(int n) {
  for (int i = 0; i < n; i++) {
    for (int j = i + 1; j < n; j++) {
      cout << '*' << endl;
    }
  }
}

void function4(int n) {
  for (int i = 1; i <= n; i *= 2) {
    cout << '*' << endl;
  }
}

/*
int squigglebah(Vector<int>& v) {
    int result = 0;
    for (int i = 0; i < v.size(); i++) {
        Vector<int> values = v.subList(0, i);
        for (int j = 0; j < values.size(); j++) {
            result += values[j];
        }
    }
    return result;
}
*/

int main() {
  cout << "--- More Big O ---" << endl;
  cout << "function1: O(?)" << endl;
  cout << "function2: O(?)" << endl;
  cout << "function3: O(?)" << endl;
  cout << "function4: O(?)" << endl;
  cout << "squigglebah: O(?)" << endl;
  return 0;
}
