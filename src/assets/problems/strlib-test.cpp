#include "stanford.h"

int main() {
  cout << "--- Strlib Test ---" << endl;

  EXPECT_EQUAL(integerToString(123), "123");
  EXPECT_EQUAL(realToString(3.14), "3.14");
  EXPECT_EQUAL(stringToInteger("42"), 42);
  EXPECT_EQUAL(boolToString(true), "true");

  string s = "  hello  ";
  EXPECT_EQUAL(trim(s), "hello");
  EXPECT_EQUAL(toUpperCase("abc"), "ABC");

  Vector<string> v = stringSplit("a,b,c", ",");
  EXPECT_EQUAL(v.size(), 3);
  EXPECT_EQUAL(v[0], "a");

  EXPECT_EQUAL(stringJoin(v, "-"), "a-b-c");

  return 0;
}
