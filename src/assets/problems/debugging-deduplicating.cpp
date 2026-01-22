#include "stanford.h"

void deduplicate(Vector<string> &vec) {
  for (int i = 0; i < vec.size() - 1;) {
    if (vec[i] == vec[i + 1]) {
      vec.remove(i);
    } else {
      i++;
    }
  }
}

// Alternate solution
// void deduplicate(Vector<string>& vec) {
//     for (int i = vec.size() - 1; i > 0; i--) {
//         if (vec[i] == vec[i - 1]) {
//             vec.remove(i);
//         }
//     }
// }

int main() {
  Vector<string> hiddenFigures = {"Katherine Johnson", "Katherine Johnson",
                                  "Katherine Johnson", "Mary Jackson",
                                  "Dorothy Vaughan",   "Dorothy Vaughan"};

  deduplicate(hiddenFigures);

  Vector<string> correctSolution = {"Katherine Johnson", "Mary Jackson",
                                    "Dorothy Vaughan"};
  EXPECT_EQUAL(hiddenFigures, correctSolution);
  return 0;
}
