#include "stanford.h"

/*
 * Function: checkBalance
 * ----------------------
 * Checks whether the braces/parentheses are balanced.
 * Return the index at which an imbalance occurs, or -1 if the string is
 * balanced. If any ( or { are never closed, return the string’s length.
 */
int checkBalance(string code) {
  // TODO: Implement this function
  return -1;
}

int main() {
  // Test case 1: Balanced string
  // index:    0123456789012345678901234567
  string s1 = "if (a(4) > 9) { foo(a(2)); }";
  EXPECT_EQUAL(checkBalance(s1), -1);

  // Test case 2: } is out of order (returns 15)
  // index:    01234567890123456789012345678901
  string s2 = "for (i=0;i<a;(3};i++) { foo{); )";
  EXPECT_EQUAL(checkBalance(s2), 15);

  // Test case 3: } doesn't match any { (returns 20)
  // index:    0123456789012345678901234
  string s3 = "while (true) foo(); }{ ()";
  EXPECT_EQUAL(checkBalance(s3), 20);

  // Test case 4: { is never closed (returns 8)
  // index:    01234567
  string s4 = "if (x) {";
  EXPECT_EQUAL(checkBalance(s4), 8);

  // Additional test: Empty string
  EXPECT_EQUAL(checkBalance(""), -1);

  // Additional test: Only opening
  EXPECT_EQUAL(checkBalance("((("), 3);

  // Additional test: Only closing
  EXPECT_EQUAL(checkBalance(")))"), 0);

  return 0;
}
