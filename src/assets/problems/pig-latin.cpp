#include "stanford.h"

string pigLatinReturn(string name) { return ""; }

void pigLatinReference(string name) {}

int main() {
  string name = "yasmine";
  string str1 = pigLatinReturn(name);
  cout << str1 << endl; // prints "asmineyay"
  cout << name << endl; // still prints "yasmine"

  EXPECT_EQUAL(str1, "asmineyay");

  pigLatinReference(name);
  cout
      << name
      << endl; // now prints "asmineyay", since name is passed by reference here

  EXPECT_EQUAL(name, "asmineyay");
  return 0;
}
