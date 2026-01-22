#include "stanford.h"

int factorial(int n) {
  if (n <= 1)
    return 1;
  return n * factorial(n - 1);
}

int main() {
  cout << "--- Recursion Test ---" << endl;
  int result = factorial(5);
  EXPECT_EQUAL(result, 120);
  cout << "Factorial of 5 is: " << result << endl;
  return 0;
}
