#pragma once
// ============================================================
// COMMON - Base utilities for Stanford library data structures
// Note: SFINAE helpers and _json_val are in debug_core.h which
// is always prepended by the worker
// ============================================================

#include <algorithm>
#include <cctype>
#include <cmath>
#include <deque>
#include <functional>
#include <initializer_list>
#include <iomanip>
#include <iostream>
#include <map>
#include <set>
#include <sstream>
#include <string>
#include <vector>

using namespace std;

// ============================================================
// Error Helper
// ============================================================

#ifndef STANFORD_ERROR_DEFINED
#define STANFORD_ERROR_DEFINED
void error(string msg) {
  cout << "[!ERROR] " << msg << endl;
  exit(1);
}
#endif
