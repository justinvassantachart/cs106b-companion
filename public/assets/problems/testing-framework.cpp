#include "stanford.h"

int main() {
  cout << "--- Testing Framework ---" << endl;

  // Pass cases
  EXPECT_EQUAL(1 + 1, 2);

  Vector<int> v;
  v.add(10);
  EXPECT_EQUAL(v.size(), 1);
  EXPECT_EQUAL(v[0], 10);

  // Fail case (demonstration)
  cout << "Demonstrating failure:" << endl;
  EXPECT_EQUAL(v.size(), 0);

  return 0;
}
