#include "stanford.h"

void testFor(string s) {
  for (int i = 0; i < s.length(); i++) {
    s[i] += 2;
  }
}

void testIf(int x) {
  if (x > 0) {
    x = x + 1;
  } else {
    x = x - 1;
  }
}

void testWhile(int n) {
  while (n > 0) {
    n--;
  }
}

void testSwitch(int x) {
  switch (x) {
  case 1:
    x = 10;
    break;
  case 2:
    x = 20;
    break;
  default:
    x = 0;
  }
}

int main() {
  testFor("abc");
  testIf(5);
  testWhile(3);
  testSwitch(1);
  return 0;
}
