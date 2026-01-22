#include "stanford.h"

/*
 * Function: maxRow
 * ----------------
 * Takes a grid of non-negative integers and an in-bounds grid location
 * and returns the maximum value in the row of that grid location.
 */
int maxRow(Grid<int> &grid, GridLocation loc) {
  // TODO: Implement this function
  return 0;
}

/*
 * Function: avgNeighborhood
 * -------------------------
 * Takes a grid and a grid location and returns the average of all the
 * values in the neighborhood of the grid location (N, S, E, W).
 * If the average is not an integer, return a truncated average.
 */
int avgNeighborhood(Grid<int> &grid, GridLocation loc) {
  // TODO: Implement this function
  return 0;
}

int main() {
  // Test maxRow
  Grid<int> g = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
  GridLocation loc1(1, 1);
  EXPECT_EQUAL(maxRow(g, loc1), 6); // Row 1 is {4, 5, 6}, max is 6

  GridLocation loc2(0, 0);
  EXPECT_EQUAL(maxRow(g, loc2), 3); // Row 0 is {1, 2, 3}, max is 3

  GridLocation loc3(2, 0);
  EXPECT_EQUAL(maxRow(g, loc3), 9); // Row 2 is {7, 8, 9}, max is 9

  // Test avgNeighborhood
  // Neighbors of (1, 1) are N(0,1)=2, S(2,1)=8, W(1,0)=4, E(1,2)=6
  // Sum = 20, Count = 4, Avg = 5
  EXPECT_EQUAL(avgNeighborhood(g, loc1), 5);

  // Neighbors of (0, 0) are S(1,0)=4, E(0,1)=2 (only 2 neighbors)
  // Sum = 6, Count = 2, Avg = 3
  EXPECT_EQUAL(avgNeighborhood(g, loc2), 3);

  // Neighbors of (1, 0) are N(0,0)=1, S(2,0)=7, E(1,1)=5 (only 3 neighbors)
  // Sum = 13, Count = 3, Avg = 4 (truncated)
  GridLocation loc4(1, 0);
  EXPECT_EQUAL(avgNeighborhood(g, loc4), 4);

  return 0;
}
