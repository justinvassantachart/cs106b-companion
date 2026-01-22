#include "stanford.h"

// Helper function to simulate file reading (for browser environment)
// In a real Qt Creator environment, you would use:
// ifstream in;
// Vector<string> lines;
// if (openFile(in, filename)) {
//     lines = readLines(in);
// }
Vector<string> readFileLines(string filename) {
  // Simulated file content for testing
  if (filename == "buddies.txt") {
    return {"Ngoc Emily", "Emily Kavel"};
  }
  return {};
}

/*
 * Function: friendList
 * --------------------
 * Reads friend relationships from a file and writes them to a Map.
 * Friendships are bi-directional, so if Emily is friends with Ngoc,
 * Ngoc is friends with Emily.
 * The file contains one friend relationship per line, with names separated by a
 * single space.
 */
Map<string, Set<string>> friendList(string filename) {
  Map<string, Set<string>> friends;
  Vector<string> lines = readFileLines(filename);

  // TODO: Implement this function
  // Process each line and add bidirectional friendships

  return friends;
}

/*
 * Function: mutualFriends
 * -----------------------
 * Takes in the friendList and two strings representing two friends,
 * and returns the names of the mutual friends they have in common.
 */
Set<string> mutualFriends(Map<string, Set<string>> &friendList, string friend1,
                          string friend2) {
  Set<string> mutual;
  // TODO: Implement this function
  return mutual;
}

int main() {
  // Test friendList
  Map<string, Set<string>> friends = friendList("buddies.txt");

  Map<string, Set<string>> expected;
  expected["Emily"] = {"Ngoc", "Kavel"};
  expected["Ngoc"] = {"Emily"};
  expected["Kavel"] = {"Emily"};

  EXPECT_EQUAL(friends, expected);

  // Test mutualFriends
  Set<string> mutual = mutualFriends(friends, "Ngoc", "Kavel");
  Set<string> expectedMutual = {"Emily"};
  EXPECT_EQUAL(mutual, expectedMutual);

  // Test with no mutual friends
  Set<string> mutual2 = mutualFriends(friends, "Ngoc", "Kavel");
  // Ngoc and Kavel both have Emily as a friend, so mutual should be {Emily}
  EXPECT_EQUAL(mutual2.size(), 1);
  EXPECT_EQUAL(mutual2.contains("Emily"), true);

  return 0;
}
