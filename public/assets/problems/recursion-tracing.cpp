#include "stanford.h"

string reverseOf(string s) {
  if (s.empty()) {
    return "";
  } else {
    return reverseOf(s.substr(1)) + s[0];
  }
}

int main() {
  cout << "Tracing reverseOf(\"stop\")" << endl;
  // Trace through the execution in your mind or on paper!
  string result = reverseOf("stop");
  cout << "Result: " << result << endl;

  // Test cases
  EXPECT_EQUAL(reverseOf("stop"), "pots");
  EXPECT_EQUAL(reverseOf(""), "");
  EXPECT_EQUAL(reverseOf("a"), "a");
  EXPECT_EQUAL(reverseOf("hello"), "olleh");
  EXPECT_EQUAL(reverseOf("recursion"), "noisrucer");

  return 0;
}
