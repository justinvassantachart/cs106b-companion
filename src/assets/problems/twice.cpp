#include "stanford.h"

/*
 * Function: twice
 * ---------------
 * Takes a vector of integers and returns a set containing all the numbers
 * in the vector that appear exactly twice.
 * Example: passing {1, 3, 1, 4, 3, 7, -2, 0, 7, -2, -2, 1} returns {3, 7}.
 */
Set<int> twice(Vector<int> &v) {
  Set<int> result;
  // TODO: Implement this function
  return result;
}

int main() {
  // Test case from handout
  Vector<int> v1 = {1, 3, 1, 4, 3, 7, -2, 0, 7, -2, -2, 1};
  Set<int> expected1 = {3, 7};
  EXPECT_EQUAL(twice(v1), expected1);

  // Test with no numbers appearing twice
  Vector<int> v2 = {1, 2, 3, 4, 5};
  Set<int> expected2 = {};
  EXPECT_EQUAL(twice(v2), expected2);

  // Test with all numbers appearing twice
  Vector<int> v3 = {1, 1, 2, 2, 3, 3};
  Set<int> expected3 = {1, 2, 3};
  EXPECT_EQUAL(twice(v3), expected3);

  // Test with numbers appearing once, twice, and three times
  Vector<int> v4 = {5, 5, 5, 10, 10, 20};
  Set<int> expected4 = {10};
  EXPECT_EQUAL(twice(v4), expected4);

  return 0;
}
