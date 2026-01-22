#include "stanford.h"

int recursionMystery(int x, int y) {
  if (x < y) {
    return x;
  } else {
    return recursionMystery(x - y, y);
  }
}

int main() {
  // Test cases from handout
  EXPECT_EQUAL(recursionMystery(6, 13), 6);
  EXPECT_EQUAL(recursionMystery(14, 10), 4);
  EXPECT_EQUAL(recursionMystery(37, 12), 1);

  // Additional test cases
  EXPECT_EQUAL(recursionMystery(5, 3), 2);
  EXPECT_EQUAL(recursionMystery(10, 5), 0);
  EXPECT_EQUAL(recursionMystery(1, 5), 1);

  return 0;
}
