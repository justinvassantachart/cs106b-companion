#include "stanford.h"

int main() {
  cout << "--- Oh No, Big-O ---" << endl;

  // Code Snippet A
  // int sum = 0;
  // for (int i = 1; i <= N + 2; i++) {
  //     sum++;
  // }
  // for (int j = 1; j <= N * 2; j++) {
  //     sum++;
  // }
  // cout << sum << endl;
  cout << "Snippet A: O(?)" << endl;

  // Code Snippet B
  // int sum = 0;
  // for (int i = 1; i <= N - 5; i++) {
  //     for (int j = 1; j <= N - 5; j += 2) {
  //         sum++;
  //     }
  // }
  // cout << sum << endl;
  cout << "Snippet B: O(?)" << endl;

  // Code Snippet C
  // int sum = 0;
  // for (int i = 0; i < 1000000; i++) {
  //     for (int j = 1; j <= i; j++) {
  //         sum += N;
  //     }
  //     for (int j = 1; j <= i; j++) {
  //         sum += N;
  //     }
  //     for (int j = 1; j <= i; j++) {
  //         sum += N;
  //     }
  // }
  // cout << sum << endl;
  cout << "Snippet C: O(?)" << endl;

  return 0;
}
