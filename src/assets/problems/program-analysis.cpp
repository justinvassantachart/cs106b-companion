#include "stanford.h"

/*
   @param input: input string whose last names will be filtered
   @param suffix: the substring which we will filter last names by
   Functionality: this function filters the input string and returns last names
        that end with 'suffix'
*/
Vector<string> filter(string input, string suffix) {
  Vector<string> filteredNames;
  Vector<string> names = stringSplit(input, ',');

  for (string name : names) {
    // convert to lowercase so we can easily compare the strings
    if (endsWith(toLowerCase(name), toLowerCase(suffix))) {
      filteredNames.add(name);
    }
  }
  return filteredNames;
}

int main() {
  Vector<string> results = filter("Zelenski,Szumlanski,Alonso", "Ski");
  Vector<string> expected1 = {"Zelenski", "Szumlanski"};
  EXPECT_EQUAL(results, expected1);

  results = filter("AmbaTi,Szumlanski,Tadimeti", "TI");
  Vector<string> expected = {"AmbaTi", "Tadimeti"};
  EXPECT_EQUAL(results, expected);

  results = filter("Zelenski,Szumlanski,Alonso", "nso");
  Vector<string> expected2 = {"Alonso"};
  EXPECT_EQUAL(results, expected2);

  results = filter("Szumlanski,Coronado", "AaS");
  Vector<string> expected4 = {};
  EXPECT_EQUAL(results, expected4);

  // what other tests can you add?

  return 0;
}
